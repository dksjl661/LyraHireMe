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
    <article className="flex h-full flex-col justify-between gap-6 rounded-lg border border-gray-200 bg-white p-6 text-gray-900 shadow-sm transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-md">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xl">
            {table.icon ?? "📋"}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{table.name}</h3>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              {table.viewType ?? "grid"}
            </p>
          </div>
        </div>
        <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          {recordCount} {recordCount === 1 ? "record" : "records"}
        </span>
      </header>

      <p className="text-sm text-gray-600">
        {table.description ?? "Grid view with quick sample records and default fields."}
      </p>

      <footer className="flex items-center justify-between gap-4 text-sm font-semibold">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Open table
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={onDelete}
          className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </footer>
    </article>
  );
}
