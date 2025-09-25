import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  baseTables,
  tableFields,
  tableRecords,
} from "~/server/db/schema";

const defaultFieldPalette = [
  { label: "Backlog", color: "#f97316" },
  { label: "In Progress", color: "#3b82f6" },
  { label: "Complete", color: "#10b981" },
];

export const tableRouter = createTRPCRouter({
  listByBase: publicProcedure
    .input(z.object({ baseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: baseTables.id,
          name: baseTables.name,
          icon: baseTables.icon,
          color: baseTables.color,
          viewType: baseTables.viewType,
          createdAt: baseTables.createdAt,
          description: baseTables.description,
          recordCount: sql<number>`count(${tableRecords.id})`,
        })
        .from(baseTables)
        .leftJoin(tableRecords, eq(baseTables.id, tableRecords.tableId))
        .where(eq(baseTables.baseId, input.baseId))
        .groupBy(
          baseTables.id,
          baseTables.name,
          baseTables.icon,
          baseTables.color,
          baseTables.viewType,
          baseTables.createdAt,
          baseTables.description,
        )
        .orderBy(desc(baseTables.createdAt));

      return rows;
    }),

  get: publicProcedure
    .input(z.object({ tableId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const table = await ctx.db.query.baseTables.findFirst({
        where: (table, { eq }) => eq(table.id, input.tableId),
        with: {
          fields: {
            orderBy: (field, { asc }) => [asc(field.orderIndex)],
          },
          records: {
            orderBy: (record, { asc }) => [asc(record.createdAt)],
          },
        },
      });

      if (!table) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return table;
    }),

  create: publicProcedure
    .input(
      z.object({
        baseId: z.string().uuid(),
        name: z.string().min(1, "Name is required"),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [table] = await tx
          .insert(baseTables)
          .values({
            baseId: input.baseId,
            name: input.name,
            icon: input.icon ?? "📋",
            color: input.color ?? "#38bdf8",
          })
          .returning();

        if (!table) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Table could not be created",
          });
        }

        const insertedFields = await tx
          .insert(tableFields)
          .values([
            {
              tableId: table.id,
              name: "Name",
              type: "text",
              orderIndex: 0,
              config: { isPrimary: true },
            },
            {
              tableId: table.id,
              name: "Status",
              type: "singleSelect",
              orderIndex: 1,
              config: { options: defaultFieldPalette },
            },
            {
              tableId: table.id,
              name: "Notes",
              type: "longText",
              orderIndex: 2,
              config: {},
            },
          ])
          .returning();

        const primaryField = insertedFields.find(
          (field) => field.orderIndex === 0,
        );
        const statusField = insertedFields.find((field) => field.name === "Status");
        const notesField = insertedFields.find((field) => field.name === "Notes");

        if (!primaryField || !statusField || !notesField) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Default fields could not be created",
          });
        }

        const sampleRows = [
          {
            values: {
              [primaryField.id]: "Kickoff meeting",
              [statusField.id]: defaultFieldPalette[1]?.label ?? "In Progress",
              [notesField.id]: "Align on roadmap and responsibilities.",
            },
          },
          {
            values: {
              [primaryField.id]: "Design review",
              [statusField.id]: defaultFieldPalette[0]?.label ?? "Backlog",
              [notesField.id]: "Collect feedback from the design partners.",
            },
          },
          {
            values: {
              [primaryField.id]: "Launch prep",
              [statusField.id]: defaultFieldPalette[2]?.label ?? "Complete",
              [notesField.id]: "Finalize marketing and onboarding assets.",
            },
          },
        ];

        await tx.insert(tableRecords).values(
          sampleRows.map((row) => ({ tableId: table.id, values: row.values })),
        );

        return {
          table,
          fields: insertedFields,
        };
      });
    }),

  delete: publicProcedure
    .input(z.object({ tableId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(baseTables)
        .where(eq(baseTables.id, input.tableId))
        .returning({ id: baseTables.id });

      if (deleted.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Table not found",
        });
      }

      return { success: true };
    }),

  createRecord: publicProcedure
    .input(
      z.object({
        tableId: z.string().uuid(),
        values: z.record(z.string(), z.union([z.string(), z.boolean(), z.null()])),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fields = await ctx.db.query.tableFields.findMany({
        where: (field, { eq }) => eq(field.tableId, input.tableId),
      });

      if (fields.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fields missing for table",
        });
      }

      const allowedFieldIds = new Set(fields.map((field) => field.id));
      const sanitizedValues: Record<string, string | boolean | null> = {};
      for (const [key, value] of Object.entries(input.values)) {
        if (allowedFieldIds.has(key)) {
          sanitizedValues[key] = value;
        }
      }

      if (Object.keys(sanitizedValues).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid field values provided",
        });
      }

      const [record] = await ctx.db
        .insert(tableRecords)
        .values({ tableId: input.tableId, values: sanitizedValues })
        .returning();

      return record;
    }),

  deleteRecords: publicProcedure
    .input(
      z.object({
        tableId: z.string().uuid(),
        recordIds: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(tableRecords)
        .where(
          and(
            eq(tableRecords.tableId, input.tableId),
            inArray(tableRecords.id, input.recordIds),
          ),
        );

      return { success: true };
    }),
});
