import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

type FieldType = "text" | "singleSelect" | "longText" | "checkbox";

type FieldConfig = {
  options?: Array<{ label: string; color: string }>;
  isPrimary?: boolean;
};

type RecordValues = Record<string, unknown>;

export const bases = pgTable("bases", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#2563eb"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const baseTables = pgTable(
  "base_tables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    baseId: uuid("base_id")
      .notNull()
      .references(() => bases.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull().default("#38bdf8"),
    icon: text("icon").notNull().default("📋"),
    viewType: text("view_type").notNull().default("grid"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    baseIdx: index("base_tables_base_idx").on(table.baseId),
  }),
);

export const tableFields = pgTable(
  "table_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tableId: uuid("table_id")
      .notNull()
      .references(() => baseTables.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").$type<FieldType>().notNull(),
    orderIndex: integer("order_index").notNull(),
    config: jsonb("config").$type<FieldConfig>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tableIdx: index("table_fields_table_idx").on(table.tableId),
    orderIdx: index("table_fields_order_idx").on(table.tableId, table.orderIndex),
  }),
);

export const tableRecords = pgTable(
  "table_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tableId: uuid("table_id")
      .notNull()
      .references(() => baseTables.id, { onDelete: "cascade" }),
    values: jsonb("values").$type<RecordValues>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tableIdx: index("table_records_table_idx").on(table.tableId),
    createdIdx: index("table_records_created_idx").on(table.tableId, table.createdAt),
  }),
);

export type Base = typeof bases.$inferSelect;
export type BaseTable = typeof baseTables.$inferSelect;
export type TableField = typeof tableFields.$inferSelect;
export type TableRecord = typeof tableRecords.$inferSelect;

export const basesRelations = relations(bases, ({ many }) => ({
  tables: many(baseTables),
}));

export const baseTablesRelations = relations(baseTables, ({ many, one }) => ({
  base: one(bases, {
    fields: [baseTables.baseId],
    references: [bases.id],
  }),
  fields: many(tableFields),
  records: many(tableRecords),
}));

export const tableFieldsRelations = relations(tableFields, ({ one }) => ({
  table: one(baseTables, {
    fields: [tableFields.tableId],
    references: [baseTables.id],
  }),
}));

export const tableRecordsRelations = relations(tableRecords, ({ one }) => ({
  table: one(baseTables, {
    fields: [tableRecords.tableId],
    references: [baseTables.id],
  }),
}));
