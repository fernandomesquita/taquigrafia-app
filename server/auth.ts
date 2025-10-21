import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || "taquigrafia-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token válido por 7 dias

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
}

/**
 * Registrar novo usuário
 */
export async function registerUser(email: string, password: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se email já existe
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUser.length > 0) {
    throw new Error("Email já cadastrado");
  }

  // Hash da senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar usuário
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.insert(users).values({
    id: userId,
    email,
    password: hashedPassword,
    name,
    loginMethod: "local",
    role: "user",
  });

  return { id: userId, email, name };
}

/**
 * Login de usuário
 */
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar usuário
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    throw new Error("Email ou senha incorretos");
  }

  if (!user.password) {
    throw new Error("Usuário não possui senha cadastrada");
  }

  // Verificar senha
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Email ou senha incorretos");
  }

  // Atualizar último login
  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  // Gerar token JWT
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
}

/**
 * Verificar token JWT
 */
export function verifyToken(token: string): AuthUser {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || null,
      role: decoded.role || "user",
    };
  } catch (error) {
    throw new Error("Token inválido ou expirado");
  }
}

/**
 * Obter usuário pelo ID
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * Middleware para verificar autenticação
 */
export function requireAuth(token: string | undefined): AuthUser {
  if (!token) {
    throw new Error("Não autenticado");
  }

  return verifyToken(token);
}

