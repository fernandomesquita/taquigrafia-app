import { and, between, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertMetaDiaria, InsertQuarto, InsertUser, metasDiarias, quartos, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== QUARTOS ==========

export async function createQuarto(quarto: InsertQuarto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(quartos).values(quarto);
  return quarto;
}

export async function getQuartosByUserId(userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(quartos).where(eq(quartos.userId, userId)).orderBy(desc(quartos.dataRegistro));
}

export async function getQuartosByUserIdAndDateRange(userId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(quartos)
    .where(
      and(
        eq(quartos.userId, userId),
        between(quartos.dataRegistro, startDate, endDate)
      )
    )
    .orderBy(desc(quartos.dataRegistro));
}

export async function deleteQuarto(id: string, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(quartos).where(and(eq(quartos.id, id), eq(quartos.userId, userId)));
}

// ========== METAS DIÁRIAS ==========

export async function upsertMetaDiaria(meta: InsertMetaDiaria) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(metasDiarias).values(meta).onDuplicateKeyUpdate({
    set: {
      metaQuartos: meta.metaQuartos,
      motivo: meta.motivo,
      updatedAt: new Date(),
    },
  });
  return meta;
}

export async function getMetaDiariaByUserIdAndDate(userId: string, data: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(metasDiarias)
    .where(and(eq(metasDiarias.userId, userId), eq(metasDiarias.data, data)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getMetasDiariasByUserIdAndMonth(userId: string, year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  return await db.select().from(metasDiarias)
    .where(
      and(
        eq(metasDiarias.userId, userId),
        between(metasDiarias.data, startDate, endDate)
      )
    );
}
