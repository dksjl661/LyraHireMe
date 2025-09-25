import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { bases } from "~/server/db/schema";

export const baseRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.bases.findMany({
      orderBy: (base, { desc }) => [desc(base.createdAt)],
      with: {
        tables: {
          columns: {
            id: true,
            name: true,
            color: true,
            icon: true,
            createdAt: true,
          },
          orderBy: (table, { desc }) => [desc(table.createdAt)],
        },
      },
    });
  }),

  get: publicProcedure
    .input(z.object({ baseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const base = await ctx.db.query.bases.findFirst({
        where: (table, { eq }) => eq(table.id, input.baseId),
        with: {
          tables: {
            orderBy: (table, { desc }) => [desc(table.createdAt)],
          },
        },
      });

      if (!base) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Base not found",
        });
      }

      return base;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [base] = await ctx.db
        .insert(bases)
        .values({
          name: input.name,
          description: input.description,
          color: input.color ?? "#2563eb",
        })
        .returning();

      return base;
    }),

  update: publicProcedure
    .input(
      z.object({
        baseId: z.string().uuid(),
        name: z.string().min(1, "Name is required").optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { baseId, ...updateData } = input;

      const result = await ctx.db
        .update(bases)
        .set(updateData)
        .where(eq(bases.id, baseId))
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Base not found",
        });
      }

      return result[0];
    }),

  delete: publicProcedure
    .input(z.object({ baseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(bases)
        .where(eq(bases.id, input.baseId))
        .returning({ id: bases.id });

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Base not found",
        });
      }

      return { success: true };
    }),
});
