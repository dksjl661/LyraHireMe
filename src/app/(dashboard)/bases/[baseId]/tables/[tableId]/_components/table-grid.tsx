"use client";

import type { RouterOutputs } from "~/trpc/react";

import { TableRow } from "./table-row";
import { getFieldDisplayName } from "./table-utils";

type TableField = RouterOutputs["table"]["get"]["fields"][number];
type TableRecord = RouterOutputs["table"]["getRecords"]["records"][number];

type TableGridProps = {
  fields: TableField[];
  records: TableRecord[];
  columnTemplate: string;
  selected: Set<string>;
  onToggleSelect: (recordId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
};

export function TableGrid({
  fields,
  records,
  columnTemplate,
  selected,
  onToggleSelect,
  onSelectAll,
}: TableGridProps) {
  const allSelected = records.length > 0 && selected.size === records.length;

  return (
    <div className="overflow-hidden rounded-4xl border border-white/10 bg-slate-950/70 shadow-[0_40px_90px_-50px_rgba(15,23,42,0.9)]">
      <div
        className="grid items-center border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.3em] text-white/60"
        style={{ gridTemplateColumns: columnTemplate }}
      >
        <div className="flex items-center gap-3 border-r border-white/10 px-4 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => onSelectAll(event.target.checked)}
            className="size-4 appearance-none rounded-sm border border-white/40 bg-transparent checked:bg-sky-500"
            aria-label="Select all rows"
          />
          <span>Rec</span>
        </div>
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center justify-between gap-2 border-r border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.35em] text-white/60 last:border-r-0"
          >
            <span>{field.name}</span>
            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium tracking-[0.4em]">
              {getFieldDisplayName(field.type)}
            </span>
          </div>
        ))}
      </div>

      <div className="divide-y divide-white/5">
        {records.map((record, index) => (
          <TableRow
            key={record.id}
            index={index}
            record={record}
            fields={fields}
            columnTemplate={columnTemplate}
            isSelected={selected.has(record.id)}
            onToggle={(checked) => onToggleSelect(record.id, checked)}
          />
        ))}
        {records.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">
            No records yet. Add one to see your Airtable-style grid come to life.
          </div>
        ) : null}
      </div>
    </div>
  );
}
