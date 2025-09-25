"use client";

import { useMemo } from "react";

import { createGradientPair } from "~/lib/color";

type BaseCardProps = {
  base: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    tables: Array<{
      id: string;
      name: string;
      color: string;
      icon: string;
    }>;
  };
  onOpen: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

export function BaseCard({ base, onOpen, onDelete, isDeleting }: BaseCardProps) {
  const [primary, secondary] = useMemo(
    () => createGradientPair(base.color),
    [base.color],
  );

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.6)] transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
      style={{
        backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      }}
    >
      <div className="absolute inset-0 -translate-y-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)] opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex h-full flex-col justify-between gap-8 p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white drop-shadow-sm">
              {base.name}
            </h2>
            {base.description ? (
              <p className="mt-2 max-w-sm text-sm text-white/80">
                {base.description}
              </p>
            ) : (
              <p className="mt-2 text-sm text-white/70">
                A flexible workspace ready for your next workflow.
              </p>
            )}
          </div>
          <span className="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur">
            {base.tables.length} {base.tables.length === 1 ? "table" : "tables"}
          </span>
        </header>

        {base.tables.length > 0 ? (
          <ol className="space-y-2">
            {base.tables.slice(0, 3).map((table) => (
              <li
                key={table.id}
                className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm text-white/90 backdrop-blur-sm"
              >
                <span className="text-lg" aria-hidden>
                  {table.icon}
                </span>
                <span className="font-medium">{table.name}</span>
              </li>
            ))}
            {base.tables.length > 3 ? (
              <li className="text-sm font-medium text-white/80">
                + {base.tables.length - 3} more
              </li>
            ) : null}
          </ol>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/30 bg-white/10 px-4 py-6 text-sm text-white/80 backdrop-blur-sm">
            No tables yet. Create one to start building.
          </div>
        )}

        <footer className="flex items-center justify-between gap-4 text-sm font-medium text-white">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/35"
          >
            Open base<span aria-hidden>→</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-sm font-semibold text-white/80 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Removing…" : "Delete"}
          </button>
        </footer>
      </div>
    </article>
  );
}
