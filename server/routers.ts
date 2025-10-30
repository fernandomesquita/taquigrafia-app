import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { randomUUID } from "crypto";
import { generatePDF } from "./pdfGenerator";
import { authRouter } from "./routers/auth";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,

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

    updateRevisado: protectedProcedure
      .input(z.object({ 
        id: z.string(),
        revisado: z.boolean(),
        observacoesRevisao: z.string().optional(),
        revisor: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateQuartoRevisado(input.id, ctx.user.id, input.revisado, input.observacoesRevisao, input.revisor);
        return { success: true };
      }),

    updateDificuldade: protectedProcedure
      .input(z.object({ 
        id: z.string(),
        dificuldade: z.enum(["NA", "Facil", "Medio", "Dificil"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateQuartoDificuldade(input.id, ctx.user.id, input.dificuldade);
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({ 
        id: z.string(),
        status: z.enum(["pendente", "concluido"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateQuartoStatus(input.id, ctx.user.id, input.status);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        codigoQuarto: z.string(),
        observacao: z.string().optional(),
        dificuldade: z.enum(["NA", "Facil", "Medio", "Dificil"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validar formato sessão-quarto
        const match = input.codigoQuarto.match(/^(\d+)-(\d+)$/);
        if (!match) {
          throw new Error(`Código inválido: ${input.codigoQuarto}. Use o formato SESSÃO-QUARTO (ex: 79777-8)`);
        }
        
        const [_, sessao, numeroQuarto] = match;
        
        await db.updateQuarto(input.id, ctx.user.id, {
          codigoQuarto: input.codigoQuarto,
          sessao,
          numeroQuarto,
          observacao: input.observacao,
          dificuldade: input.dificuldade,
        });
        return { success: true };
      }),

    uploadArquivoTaquigrafia: protectedProcedure
      .input(z.object({
        quartoId: z.string(),
        fileBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.uploadArquivoTaquigrafia(
          input.quartoId,
          ctx.user.id,
          input.fileBase64,
          input.fileName
        );
        return { success: true };
      }),

    uploadArquivoRedacaoFinal: protectedProcedure
      .input(z.object({
        quartoId: z.string(),
        fileBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.uploadArquivoRedacaoFinal(
          input.quartoId,
          ctx.user.id,
          input.fileBase64,
          input.fileName
        );
        return { success: true };
      }),

    salvarComparacao: protectedProcedure
      .input(z.object({
        quartoId: z.string(),
        taxaPrecisao: z.string(),
        totalAlteracoes: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.salvarComparacao(
          input.quartoId,
          ctx.user.id,
          input.taxaPrecisao,
          input.totalAlteracoes
        );
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

    ajustarLote: protectedProcedure
      .input(z.object({
        dataInicio: z.string(), // YYYY-MM-DD
        dataFim: z.string(), // YYYY-MM-DD
        metaQuartos: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const inicio = new Date(input.dataInicio + "T00:00:00");
        const fim = new Date(input.dataFim + "T00:00:00");
        
        const metas = [];
        const currentDate = new Date(inicio);
        
        while (currentDate <= fim) {
          const dataStr = currentDate.toISOString().split('T')[0];
          const meta = await db.upsertMetaDiaria({
            id: `${ctx.user.id}-${dataStr}`,
            userId: ctx.user.id,
            data: dataStr,
            metaQuartos: input.metaQuartos,
            motivo: `Ajuste em lote: ${input.dataInicio} a ${input.dataFim}`,
          });
          metas.push(meta);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return { success: true, count: metas.length };
      }),
  }),

  backup: router({
    exportarCompleto: protectedProcedure
      .query(async ({ ctx }) => {
        // Buscar todos os dados do usuário
        const quartos = await db.getQuartosByUserId(ctx.user.id);
        const metas = await db.getAllMetasDiariasByUserId(ctx.user.id);

        // Criar backup com metadados
        const backup = {
          version: "1.0",
          schema_version: "1.0",
          backup_date: new Date().toISOString(),
          user: {
            id: ctx.user.id,
            name: ctx.user.name || ctx.user.email || "Usuário",
            email: ctx.user.email,
          },
          data: {
            quartos: quartos.map(q => ({
              id: q.id,
              codigoQuarto: q.codigoQuarto,
              sessao: q.sessao,
              numeroQuarto: q.numeroQuarto,
              observacao: q.observacao,
              dataRegistro: q.dataRegistro,
              revisado: q.revisado,
              observacoesRevisao: q.observacoesRevisao,
              dificuldade: q.dificuldade,
              // Dados de comparação
              comparacaoRealizada: q.comparacaoRealizada,
              taxaPrecisao: q.taxaPrecisao,
              totalAlteracoes: q.totalAlteracoes,
            })),
            metas: metas,
          },
          stats: {
            total_quartos: quartos.length,
            total_revisados: quartos.filter(q => q.revisado).length,
            total_metas: metas.length,
          },
        };

        // Calcular checksum simples
        const checksumData = JSON.stringify(backup.data);
        const checksum = Buffer.from(checksumData).toString('base64').substring(0, 32);
        
        return {
          ...backup,
          checksum,
        };
      }),

    importarCompleto: protectedProcedure
      .input(z.object({
        backup: z.any(),
        mode: z.enum(["replace", "merge"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validar estrutura do backup
        if (!input.backup.version || !input.backup.data) {
          throw new Error("Formato de backup inválido");
        }

        // Validar checksum se existir
        if (input.backup.checksum) {
          const checksumData = JSON.stringify(input.backup.data);
          const expectedChecksum = Buffer.from(checksumData).toString('base64').substring(0, 32);
          if (expectedChecksum !== input.backup.checksum) {
            throw new Error("Arquivo corrompido: checksum inválido");
          }
        }

        let importedQuartos = 0;
        let importedMetas = 0;
        let skippedQuartos = 0;

        // Se modo replace, limpar dados existentes
        if (input.mode === "replace") {
          await db.deleteAllQuartosByUserId(ctx.user.id);
          await db.deleteAllMetasByUserId(ctx.user.id);
        }

        // Importar quartos
        const existingQuartos = await db.getQuartosByUserId(ctx.user.id);
        const existingCodigos = new Set(existingQuartos.map(q => q.codigoQuarto + q.dataRegistro));

        for (const quarto of input.backup.data.quartos) {
          const key = quarto.codigoQuarto + quarto.dataRegistro;
          
          if (input.mode === "merge" && existingCodigos.has(key)) {
            skippedQuartos++;
            continue;
          }

          await db.createQuarto({
            id: quarto.id || randomUUID(),
            userId: ctx.user.id,
            codigoQuarto: quarto.codigoQuarto,
            sessao: quarto.sessao,
            numeroQuarto: quarto.numeroQuarto,
            observacao: quarto.observacao,
            dataRegistro: new Date(quarto.dataRegistro),
            revisado: quarto.revisado || false,
            observacoesRevisao: quarto.observacoesRevisao,
            dificuldade: quarto.dificuldade || "NA",
          });
          importedQuartos++;
        }

        // Importar metas
        for (const meta of input.backup.data.metas || []) {
          await db.upsertMetaDiaria({
            id: meta.id || `${ctx.user.id}-${meta.data}`,
            userId: ctx.user.id,
            data: meta.data,
            metaQuartos: meta.metaQuartos,
            motivo: meta.motivo,
          });
          importedMetas++;
        }

        return {
          success: true,
          imported: {
            quartos: importedQuartos,
            metas: importedMetas,
          },
          skipped: {
            quartos: skippedQuartos,
          },
        };
      }),

    getLastBackupInfo: protectedProcedure
      .query(async ({ ctx }) => {
        // Retornar informações sobre último backup (se armazenado)
        // Por enquanto, retornar null (será implementado com localStorage no frontend)
        return null;
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

        // Buscar todos os quartos do usuário para calcular precisão global
        const todosQuartos = await db.getQuartosByUserId(ctx.user.id);
        const quartosComPrecisaoGlobal = todosQuartos.filter(q => q.taxaPrecisao && q.taxaPrecisao.trim() !== "");
        const precisaoMediaGlobal = quartosComPrecisaoGlobal.length > 0
          ? quartosComPrecisaoGlobal.reduce((acc, q) => acc + parseFloat(q.taxaPrecisao!), 0) / quartosComPrecisaoGlobal.length
          : 0;

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
          precisaoMediaGlobal,
          totalQuartosGlobal: todosQuartos.length,
          quartosComPrecisaoGlobal: quartosComPrecisaoGlobal.length,
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
