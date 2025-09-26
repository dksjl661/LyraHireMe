"use client";

import Link from "next/link";
import { useMemo } from "react";

import { api } from "~/trpc/react";
import { createGradientPair } from "~/lib/color";

import { EnhancedTable } from "./enhanced-table";

type TableViewProps = {
  baseId: string;
  tableId: string;
};

export function TableView({ baseId, tableId }: TableViewProps) {
  const [base] = api.base.get.useSuspenseQuery({ baseId });
  const [table] = api.table.get.useSuspenseQuery({ tableId });

  // const [primary, secondary] = useMemo(
  //   () => createGradientPair(table.color ?? base.color ?? "#38bdf8"),
  //   [table.color, base.color],
  // );

  return (
    <div className="flex w-full flex-col gap-4 bg-white px-6 py-6">
      <header className="flex flex-col gap-2">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.35em] text-gray-500 uppercase">
          <Link href="/bases" className="transition hover:text-gray-700">
            Bases
          </Link>
          <span>/</span>
          <Link
            href={`/bases/${baseId}`}
            className="transition hover:text-gray-700"
          >
            {base.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{table.name}</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {table.name}
            </h1>
          </div>
        </div>
      </header>

      <div className="rounded-lg border border-gray-200 bg-white p-0 shadow-sm">
        <EnhancedTable />
      </div>
    </div>
  );
}
