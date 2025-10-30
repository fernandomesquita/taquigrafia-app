import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // hash da senha (bcrypt)
  loginMethod: varchar("loginMethod", { length: 64 }).default("local"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de quartos (trabalhos de taquigrafia)
 * Cada quarto tem 4 minutos de duração
 * Agora registra códigos individuais (sessão-quarto) para auditoria
 */
export const quartos = mysqlTable("quartos", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  codigoQuarto: varchar("codigoQuarto", { length: 20 }).notNull(), // código do quarto (ex: "79777-8")
  sessao: varchar("sessao", { length: 10 }).notNull(), // número da sessão (ex: "79777")
  numeroQuarto: varchar("numeroQuarto", { length: 5 }).notNull(), // número do quarto (ex: "8")
  dataRegistro: timestamp("dataRegistro").notNull().defaultNow(), // data e hora do registro
  observacao: text("observacao"), // observações opcionais
  revisado: boolean("revisado").default(false).notNull(), // indica se o quarto foi revisado
  observacoesRevisao: text("observacoesRevisao"), // observações sobre a revisão
  dificuldade: mysqlEnum("dificuldade", ["NA", "Facil", "Medio", "Dificil"]).default("NA").notNull(), // nível de dificuldade do quarto
  status: mysqlEnum("status", ["pendente", "concluido"]).default("pendente").notNull(), // status do quarto
  revisor: varchar("revisor", { length: 255 }), // nome do revisor (quando marcado como revisado)
  // Arquivos de comparação
  arquivoTaquigrafia: text("arquivoTaquigrafia"), // arquivo Word com taquigrafia original (base64)
  arquivoTaquigrafiaName: varchar("arquivoTaquigrafiaName", { length: 255 }), // nome do arquivo original
  arquivoRedacaoFinal: text("arquivoRedacaoFinal"), // arquivo Word com redação final (base64)
  arquivoRedacaoFinalName: varchar("arquivoRedacaoFinalName", { length: 255 }), // nome do arquivo final
  comparacaoRealizada: boolean("comparacaoRealizada").default(false).notNull(), // indica se a comparação foi feita
  taxaPrecisao: varchar("taxaPrecisao", { length: 10 }), // taxa de precisão da taquigrafia (%)
  totalAlteracoes: int("totalAlteracoes").default(0), // número total de alterações
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Quarto = typeof quartos.$inferSelect;
export type InsertQuarto = typeof quartos.$inferInsert;

/**
 * Tabela de metas diárias
 * Permite ajustar a meta de quartos por dia (padrão: 5 quartos = 20 minutos)
 */
export const metasDiarias = mysqlTable("metasDiarias", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  data: varchar("data", { length: 10 }).notNull(), // formato YYYY-MM-DD
  metaQuartos: varchar("metaQuartos", { length: 10 }).notNull(), // meta de quartos para o dia (padrão: "5")
  motivo: text("motivo"), // motivo da alteração (licença médica, falha de sistema, etc)
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type MetaDiaria = typeof metasDiarias.$inferSelect;
export type InsertMetaDiaria = typeof metasDiarias.$inferInsert;
