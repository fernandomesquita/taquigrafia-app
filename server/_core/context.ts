import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { verifyToken, getUserById, type AuthUser } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: (User & { authUser?: AuthUser }) | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: (User & { authUser?: AuthUser }) | null = null;

  try {
    // Tentar autenticar via JWT (novo sistema)
    const authHeader = opts.req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");
    
    if (token) {
      const authUser = verifyToken(token);
      const dbUser = await getUserById(authUser.id);
      
      if (dbUser) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          loginMethod: "local",
          role: dbUser.role,
          createdAt: new Date(),
          lastSignedIn: new Date(),
          authUser,
        };
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
