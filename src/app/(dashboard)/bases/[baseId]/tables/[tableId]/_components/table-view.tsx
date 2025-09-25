"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useMemo, useState } from "react";

import { api } from "~/trpc/react";
import { createGradientPair } from "~/lib/color";

import { TableGrid } from "./table-grid";

type TableViewProps = {
  baseId: string;
  tableId: string;
};

export function TableView({ baseId, tableId }: TableViewProps) {
  const [base] = api.base.get.useSuspenseQuery({ baseId });
  const [table] = api.table.get.useSuspenseQuery({ tableId });

  const utils = api.useUtils();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fields = useMemo(
    () => [...table.fields].sort((a, b) => a.orderIndex - b.orderIndex),
    [table.fields],
  );

  const columnTemplate = useMemo(() => {
    const bodyColumns = fields.map(() => "minmax(220px, 1fr)").join(" ");
    return `72px ${bodyColumns}`;
  }, [fields]);

  const [primary, secondary] = useMemo(
    () => createGradientPair(table.color ?? base.color ?? "#38bdf8"),
    [table.color, base.color],
  );

  const createRecord = api.table.createRecord.useMutation({
    onSuccess: async () => {
      await utils.table.get.invalidate({ tableId });
      setSelected(new Set());
    },
  });

  const deleteRecords = api.table.deleteRecords.useMutation({
    onSuccess: async () => {
      await utils.table.get.invalidate({ tableId });
      setSelected(new Set());
    },
  });

  const handleAddRecord = async () => {
    if (createRecord.isPending) return;

    const values: Record<string, string | boolean | null> = {};
    fields.forEach((field, index) => {
      if (field.type === "singleSelect") {
        values[field.id] = field.config?.options?.[0]?.label ?? "Backlog";
        return;
      }
      if (field.type === "checkbox") {
        values[field.id] = false;
        return;
      }
      if (field.config?.isPrimary || index === 0) {
        values[field.id] = `Record ${table.records.length + 1}`;
        return;
      }
      values[field.id] = "";
    });

    await createRecord.mutateAsync({ tableId, values });
  };

  const handleDeleteSelected = async () => {
    if (deleteRecords.isPending || selected.size === 0) return;
    await deleteRecords.mutateAsync({ tableId, recordIds: Array.from(selected) });
  };

  const records = table.records;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header
        className="overflow-hidden rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_40px_90px_-50px_rgba(15,23,42,0.9)]"
        style={{
          backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            <Link href="/bases" className="transition hover:text-white">
              Bases
            </Link>
            <span>/</span>
            <Link href={`/bases/${baseId}`} className="transition hover:text-white">
              {base.name}
            </Link>
            <span>/</span>
            <span className="text-white">{table.name}</span>
          </nav>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-white drop-shadow-sm">{table.name}</h1>
            <p className="mt-2 text-sm text-white/80">
              Manage records with an Airtable-quality grid, complete with select pills and type
              badges.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-white">
            <button
              type="button"
              onClick={handleAddRecord}
              disabled={createRecord.isPending}
              className="rounded-full border border-white/30 bg-white/15 px-5 py-2 transition hover:border-white/40 hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createRecord.isPending ? "Adding…" : "Add record"}
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selected.size === 0 || deleteRecords.isPending}
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2 transition hover:border-white/40 hover:bg-red-400/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleteRecords.isPending ? "Deleting…" : "Delete selected"}
            </button>
          </div>
        </div>
      </header>

      <TableGrid
        fields={fields}
        records={records}
        columnTemplate={columnTemplate}
        selected={selected}
        onToggleSelect={(recordId, checked) => {
          setSelected((current) => {
            const next = new Set(current);
            if (checked) {
              next.add(recordId);
            } else {
              next.delete(recordId);
            }
            return next;
          });
        }}
        onSelectAll={(checked) => {
          setSelected(() => (checked ? new Set(records.map((record) => record.id)) : new Set()));
        }}
      />
    </div>
  );
}
