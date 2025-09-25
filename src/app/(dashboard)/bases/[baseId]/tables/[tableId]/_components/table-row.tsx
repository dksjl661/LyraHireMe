"use client";

import type { RouterOutputs } from "~/trpc/react";

import { getFieldDisplayName } from "./table-utils";

type TableField = RouterOutputs["table"]["get"]["fields"][number];
type TableRecord = RouterOutputs["table"]["get"]["records"][number];

type TableRowProps = {
  index: number;
  record: TableRecord;
  fields: TableField[];
  columnTemplate: string;
  isSelected: boolean;
  onToggle: (value: boolean) => void;
};

export function TableRow({
  index,
  record,
  fields,
  columnTemplate,
  isSelected,
  onToggle,
}: TableRowProps) {
  return (
    <div
      className="grid items-center border-b border-white/5 bg-slate-950/40 text-sm text-slate-200 transition hover:bg-slate-900/70"
      style={{ gridTemplateColumns: columnTemplate }}
    >
      <div className="flex items-center gap-3 border-r border-white/5 px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) => onToggle(event.target.checked)}
          className="size-4 appearance-none rounded-sm border border-white/30 bg-transparent checked:bg-sky-500"
          aria-label={`Select row ${index + 1}`}
        />
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          {index + 1}
        </span>
      </div>
      {fields.map((field) => (
        <Cell key={field.id} field={field} value={record.values[field.id]} />
      ))}
    </div>
  );
}

type CellProps = {
  field: TableField;
  value: unknown;
};

function Cell({ field, value }: CellProps) {
  const content = renderValue(field, value);
  const badge = getFieldDisplayName(field.type);

  return (
    <div className="flex h-full flex-col gap-2 border-r border-white/5 px-4 py-3 last:border-r-0">
      <span className="text-xs font-medium uppercase tracking-[0.25em] text-white/35">
        {badge}
      </span>
      <div className="text-sm font-medium text-slate-100">{content}</div>
    </div>
  );
}

function renderValue(field: TableField, rawValue: unknown) {
  if (rawValue == null || rawValue === "") {
    return <span className="text-slate-500">—</span>;
  }

  if (field.type === "singleSelect") {
    if (typeof rawValue !== "string") {
      return <span className="text-slate-500">—</span>;
    }
    const option = field.config?.options?.find((opt) => opt.label === rawValue);
    const color = option?.color ?? "#38bdf8";
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {rawValue}
      </span>
    );
  }

  if (field.type === "checkbox") {
    return <span className="text-base">{rawValue ? "✅" : "⬜️"}</span>;
  }

  if (field.type === "longText") {
    if (typeof rawValue !== "string") {
      return <span className="text-slate-500">—</span>;
    }
    return <span className="text-sm text-slate-200">{rawValue}</span>;
  }

  if (typeof rawValue === "string" || typeof rawValue === "number") {
    return <span className="text-sm text-slate-100">{rawValue}</span>;
  }

  return <span className="text-slate-500">—</span>;
}
