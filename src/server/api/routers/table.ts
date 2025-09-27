import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { baseTables, tableFields, tableRecords } from "~/server/db/schema";

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
          // Don't load all records here - use getRecords instead for pagination
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

  getRecords: publicProcedure
    .input(
      z.object({
        tableId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().min(0).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = input.cursor ?? 0;

      // Ensure we always fetch the exact limit requested (50 rows)
      const records = await ctx.db
        .select({
          id: tableRecords.id,
          values: tableRecords.values,
          createdAt: tableRecords.createdAt,
        })
        .from(tableRecords)
        .where(eq(tableRecords.tableId, input.tableId))
        .orderBy(tableRecords.createdAt)
        .limit(input.limit) // Always fetch exactly the requested amount
        .offset(offset);

      // Only get total count on first page to avoid expensive count queries
      let totalCount = 0;
      if (offset === 0) {
        const totalCountResult = await ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(tableRecords)
          .where(eq(tableRecords.tableId, input.tableId));
        totalCount = totalCountResult[0]?.count ?? 0;
      }

      // hasMore is true if we got exactly the limit we asked for
      const hasMore = records.length === input.limit;
      const nextOffset = hasMore ? offset + input.limit : undefined;

      console.log(
        `Fetched ${records.length} records (offset: ${offset}, limit: ${input.limit}, hasMore: ${hasMore})`,
      );

      return {
        records,
        totalCount,
        hasMore,
        nextOffset,
      };
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
              name: "Email",
              type: "text",
              orderIndex: 2,
              config: {},
            },
            {
              tableId: table.id,
              name: "Due Date",
              type: "date",
              orderIndex: 3,
              config: {},
            },
            {
              tableId: table.id,
              name: "Notes",
              type: "longText",
              orderIndex: 4,
              config: {},
            },
          ])
          .returning();

        const primaryField = insertedFields.find((field) => field.config?.isPrimary);
        const statusField = insertedFields.find(
          (field) => field.name === "Status",
        );
        const emailField = insertedFields.find(
          (field) => field.name === "Email",
        );
        const dueDateField = insertedFields.find(
          (field) => field.name === "Due Date",
        );
        const notesField = insertedFields.find(
          (field) => field.name === "Notes",
        );

        if (
          !primaryField ||
          !statusField ||
          !emailField ||
          !dueDateField ||
          !notesField
        ) {
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
              [emailField.id]: "project-lead@example.com",
              [dueDateField.id]: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0], // 3 days (urgent)
              [notesField.id]: "Align on roadmap and responsibilities.",
            },
          },
          {
            values: {
              [primaryField.id]: "Design review",
              [statusField.id]: defaultFieldPalette[0]?.label ?? "Backlog",
              [emailField.id]: "design@example.com",
              [dueDateField.id]: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0], // 10 days (medium priority)
              [notesField.id]: "Collect feedback from the design partners.",
            },
          },
          {
            values: {
              [primaryField.id]: "Launch prep",
              [statusField.id]: defaultFieldPalette[2]?.label ?? "Complete",
              [emailField.id]: "ops@example.com",
              [dueDateField.id]: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0], // 2 days ago (overdue but complete)
              [notesField.id]: "Finalize marketing and onboarding assets.",
            },
          },
          ...Array.from({ length: 1000 }, (_, i) => ({
            values: {
              [primaryField.id]: `Sample ${i + 1}`,
              [statusField.id]: defaultFieldPalette[1]?.label ?? "In Progress",
              [emailField.id]: `team${i + 1}@example.com`,
              [dueDateField.id]: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              [notesField.id]: `Generated record ${i + 1}`,
            },
          })),
        ];

        await tx.insert(tableRecords).values(
          sampleRows.map((row) => ({
            tableId: table.id,
            values: row.values,
          })),
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
        values: z.record(
          z.string(),
          z.union([z.string(), z.boolean(), z.null()]),
        ),
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

  updateRecord: publicProcedure
    .input(
      z.object({
        recordId: z.string().uuid(),
        fieldId: z.string().uuid(),
        value: z.union([z.string(), z.boolean(), z.null()]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the current record
      const currentRecord = await ctx.db.query.tableRecords.findFirst({
        where: (record, { eq }) => eq(record.id, input.recordId),
      });

      if (!currentRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Record not found",
        });
      }

      // Update the specific field value
      const updatedValues = {
        ...currentRecord.values,
        [input.fieldId]: input.value ?? null,
      };

      const [updatedRecord] = await ctx.db
        .update(tableRecords)
        .set({ values: updatedValues })
        .where(eq(tableRecords.id, input.recordId))
        .returning();

      return updatedRecord;
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

  createField: publicProcedure
    .input(
      z.object({
        tableId: z.string().uuid(),
        name: z.string().min(1, "Name is required"),
        type: z.enum(["text", "singleSelect", "longText", "checkbox", "date"]),
        options: z
          .array(z.object({ label: z.string(), color: z.string() }))
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const maxResult = await ctx.db
        .select({
          max: sql<number>`coalesce(max(${tableFields.orderIndex}), -1)`,
        })
        .from(tableFields)
        .where(eq(tableFields.tableId, input.tableId));

      const orderIndex = (maxResult[0]?.max ?? -1) + 1;

      const config =
        input.type === "singleSelect"
          ? {
              options:
                input.options && input.options.length > 0
                  ? input.options
                  : defaultFieldPalette,
            }
          : {};

      const [field] = await ctx.db
        .insert(tableFields)
        .values({
          tableId: input.tableId,
          name: input.name,
          type: input.type,
          orderIndex,
          config,
        })
        .returning();

      return field;
    }),

  deleteField: publicProcedure
    .input(z.object({ fieldId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [field] = await ctx.db
        .delete(tableFields)
        .where(eq(tableFields.id, input.fieldId))
        .returning({ id: tableFields.id, tableId: tableFields.tableId });

      if (!field) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Field not found",
        });
      }

      await ctx.db
        .update(tableRecords)
        .set({ values: sql`${tableRecords.values} - ${input.fieldId}` })
        .where(eq(tableRecords.tableId, field.tableId));

      return { success: true };
    }),

  createBulkRecords: publicProcedure
    .input(
      z.object({
        tableId: z.string().uuid(),
        count: z.number().min(1).max(100000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fields = await ctx.db.query.tableFields.findMany({
        where: (field, { eq }) => eq(field.tableId, input.tableId),
        orderBy: (field, { asc }) => [asc(field.orderIndex)],
      });

      if (fields.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fields missing for table",
        });
      }

      // Generate sample data patterns
      const sampleProjects = [
        "Solar Grid Expansion",
        "Battery Storage Pilot",
        "Wind Turbine Maintenance",
        "Hydro Plant Efficiency Upgrade",
        "Smart Meter Rollout",
      ];

      const sampleDeliverables = [
        "Initial System Architecture",
        "User Acceptance Test Plan",
        "API Integration Document",
        "Final Project Report",
        "Deployment Checklist",
      ];

      const sampleStatuses = ["Backlog", "In Progress", "Complete"];
      const sampleTeamMembers = [
        "Alexandra Chen",
        "Jorge Martinez",
        "Marcus Patel",
        "Priya Singh",
      ];

      // Prepare bulk insert data
      const recordsToInsert = [];
      const batchSize = 1000; // Insert in batches for better performance

      for (let i = 0; i < input.count; i++) {
        const values: Record<string, string | boolean | null> = {};

        for (const field of fields) {
          switch (field.type) {
            case "text":
              if (field.config?.isPrimary) {
                values[field.id] =
                  `${sampleDeliverables[i % sampleDeliverables.length]!} #${i + 1}`;
              } else if (field.name.toLowerCase().includes("project")) {
                values[field.id] = sampleProjects[i % sampleProjects.length]!;
              } else if (field.name.toLowerCase().includes("email")) {
                values[field.id] = `contact${i + 1}@example.com`;
              } else if (
                field.name.toLowerCase().includes("team") ||
                field.name.toLowerCase().includes("assigned")
              ) {
                values[field.id] =
                  sampleTeamMembers[i % sampleTeamMembers.length]!;
              } else {
                values[field.id] = `Sample ${field.name} ${i + 1}`;
              }
              break;
            case "longText":
              values[field.id] =
                `Detailed ${field.name.toLowerCase()} for record ${i + 1}. This contains more comprehensive information about the task and requirements.`;
              break;
            case "singleSelect":
              if (
                field.config?.options &&
                Array.isArray(field.config.options)
              ) {
                const options = field.config.options;
                values[field.id] =
                  options[i % options.length]?.label ??
                  sampleStatuses[i % sampleStatuses.length]!;
              } else {
                values[field.id] = sampleStatuses[i % sampleStatuses.length]!;
              }
              break;
            case "checkbox":
              values[field.id] = Math.random() > 0.5;
              break;
            case "date":
              // Generate realistic due dates based on task priority and type
              let daysOffset: number;
              const taskIndex = i % 10;

              // Create different due date patterns based on task type
              if (taskIndex < 3) {
                // Urgent tasks: 1-7 days
                daysOffset = Math.floor(Math.random() * 7) + 1;
              } else if (taskIndex < 6) {
                // Medium priority: 1-3 weeks
                daysOffset = Math.floor(Math.random() * 21) + 7;
              } else if (taskIndex < 8) {
                // Long-term tasks: 1-2 months
                daysOffset = Math.floor(Math.random() * 60) + 30;
              } else {
                // Some overdue tasks for realism
                daysOffset = -(Math.floor(Math.random() * 14) + 1);
              }

              const futureDate = new Date(
                Date.now() + daysOffset * 24 * 60 * 60 * 1000,
              );
              const dateString = futureDate.toISOString().split("T")[0];
              values[field.id] = dateString ?? null;
              break;
            default:
              values[field.id] = `Value ${i + 1}`;
          }
        }

        recordsToInsert.push({
          tableId: input.tableId,
          values,
        });
      }

      // Insert records in batches for better performance
      const insertedRecords = [];
      for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const batch = recordsToInsert.slice(i, i + batchSize);
        const batchResult = await ctx.db
          .insert(tableRecords)
          .values(batch)
          .returning();
        insertedRecords.push(...batchResult);
      }

      return {
        success: true,
        count: insertedRecords.length,
        message: `Successfully created ${insertedRecords.length} records`,
      };
    }),

  addDueDateField: publicProcedure
    .input(z.object({ tableId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if due date field already exists
      const existingFields = await ctx.db.query.tableFields.findMany({
        where: (field, { eq }) => eq(field.tableId, input.tableId),
      });

      const dueDateFieldExists = existingFields.some(
        (field) => field.type === "date" && field.name === "Due Date",
      );

      if (dueDateFieldExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Due Date field already exists",
        });
      }

      // Find the highest order index to place the new field
      const maxOrderIndex = Math.max(
        ...existingFields.map((field) => field.orderIndex),
        -1,
      );

      const [newField] = await ctx.db
        .insert(tableFields)
        .values({
          tableId: input.tableId,
          name: "Due Date",
          type: "date",
          orderIndex: maxOrderIndex + 1,
          config: {},
        })
        .returning();

      return { field: newField, message: "Due Date field added successfully" };
    }),
});
