import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { registerUser, loginUser, getUserById } from "../auth";

export const authRouter = router({
  /**
   * Registrar novo usuário
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
        name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
      })
    )
    .mutation(async ({ input }) => {
      const user = await registerUser(input.email, input.password, input.name);
      return { success: true, user };
    }),

  /**
   * Login de usuário
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      })
    )
    .mutation(async ({ input }) => {
      const { user, token } = await loginUser(input.email, input.password);
      return { success: true, user, token };
    }),

  /**
   * Obter usuário atual
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return user;
  }),

  /**
   * Logout (apenas limpa token no cliente)
   */
  logout: protectedProcedure.mutation(async () => {
    return { success: true };
  }),
});

