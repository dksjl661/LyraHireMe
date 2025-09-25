"use client";

type TableCardProps = {
  table: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    viewType: string | null;
    description: string | null;
    recordCount: number;
  };
  onOpen: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

export function TableCard({ table, onOpen, onDelete, isDeleting }: TableCardProps) {
  const recordCount = Number(table.recordCount ?? 0);

  return (
    <article className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.9)] transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.08]">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl">
            {table.icon ?? "📋"}
          </span>
          <div>
            <h3 className="text-lg font-semibold">{table.name}</h3>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              {table.viewType ?? "grid"}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
          {recordCount} {recordCount === 1 ? "record" : "records"}
        </span>
      </header>

      <p className="text-sm text-white/75">
        {table.description ?? "Grid view with quick sample records and default fields."}
      </p>

      <footer className="flex items-center justify-between gap-4 text-sm font-semibold">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-full bg-white/20 px-4 py-2 text-slate-900 transition hover:bg-white/30"
        >
          Open table
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={onDelete}
          className="text-sm font-semibold text-white/80 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </footer>
    </article>
  );
}
