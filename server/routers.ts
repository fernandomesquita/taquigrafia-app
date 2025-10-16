import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { randomUUID } from "crypto";
import { generatePDF } from "./pdfGenerator";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  quartos: router({
    create: protectedProcedure
      .input(z.object({
        codigos: z.string(), // códigos separados por vírgula (ex: "79777-8, 79777-9, 79778-1")
        observacao: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Processar códigos separados por vírgula
        const codigosArray = input.codigos.split(',').map(c => c.trim()).filter(c => c.length > 0);
        
        const quartosCreated = [];
        for (const codigo of codigosArray) {
          // Validar formato sessão-quarto
          const match = codigo.match(/^(\d+)-(\d+)$/);
          if (!match) {
            throw new Error(`Código inválido: ${codigo}. Use o formato SESSÃO-QUARTO (ex: 79777-8)`);
          }
          
          const [_, sessao, numeroQuarto] = match;
          
          const quarto = await db.createQuarto({
            id: randomUUID(),
            userId: ctx.user.id,
            codigoQuarto: codigo,
            sessao,
            numeroQuarto,
            observacao: input.observacao,
            dataRegistro: new Date(),
          });
          quartosCreated.push(quarto);
        }
        
        return { quartos: quartosCreated, count: quartosCreated.length };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getQuartosByUserId(ctx.user.id);
    }),

    listByMonth: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
        return await db.getQuartosByUserIdAndDateRange(ctx.user.id, startDate, endDate);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteQuarto(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  metas: router({
    upsert: protectedProcedure
      .input(z.object({
        data: z.string(), // YYYY-MM-DD
        metaQuartos: z.string(),
        motivo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meta = await db.upsertMetaDiaria({
          id: `${ctx.user.id}-${input.data}`,
          userId: ctx.user.id,
          data: input.data,
          metaQuartos: input.metaQuartos,
          motivo: input.motivo,
        });
        return meta;
      }),

    getByDate: protectedProcedure
      .input(z.object({ data: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getMetaDiariaByUserIdAndDate(ctx.user.id, input.data);
      }),

    listByMonth: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getMetasDiariasByUserIdAndMonth(ctx.user.id, input.year, input.month);
      }),
  }),

  relatorios: router({
    exportarPDF: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Buscar dados do mês
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
        const quartos = await db.getQuartosByUserIdAndDateRange(ctx.user.id, startDate, endDate);
        const metas = await db.getMetasDiariasByUserIdAndMonth(ctx.user.id, input.year, input.month);

        // Calcular estatísticas
        const totalQuartos = quartos.length; // cada registro = 1 quarto
        const totalMinutos = totalQuartos * 4;

        // Calcular dias úteis
        const diasNoMes = new Date(input.year, input.month, 0).getDate();
        let diasUteis = 0;
        for (let dia = 1; dia <= diasNoMes; dia++) {
          const data = new Date(input.year, input.month - 1, dia);
          const diaSemana = data.getDay();
          if (diaSemana >= 1 && diaSemana <= 5) {
            diasUteis++;
          }
        }

        // Calcular meta mensal
        let metaMensal = diasUteis * 5;
        metas.forEach((meta) => {
          const metaPadrao = 5;
          const metaAjustada = parseFloat(meta.metaQuartos);
          metaMensal = metaMensal - metaPadrao + metaAjustada;
        });

        const saldo = totalQuartos - metaMensal;

        // Gerar PDF
        const pdfBuffer = generatePDF({
          userName: ctx.user.name || ctx.user.email || "Taquígrafo",
          mes: String(input.month).padStart(2, '0'),
          ano: input.year,
          quartos,
          totalQuartos,
          totalMinutos,
          metaMensal,
          saldo,
        });

        // Retornar como base64
        return {
          pdf: pdfBuffer.toString("base64"),
          filename: `relatorio-taquigrafia-${input.year}-${String(input.month).padStart(2, '0')}.pdf`,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
