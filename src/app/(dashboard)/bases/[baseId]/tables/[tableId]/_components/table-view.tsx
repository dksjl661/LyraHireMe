"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "~/trpc/react";

import { InfiniteTable } from "./infinite-table";

type TableViewProps = {
  baseId: string;
  tableId: string;
};

const SELECT_COLOR_PRESETS = ["#f97316", "#3b82f6", "#10b981"] as const;

export function TableView({ baseId, tableId }: TableViewProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const [base] = api.base.get.useSuspenseQuery({ baseId });
  const [table] = api.table.get.useSuspenseQuery({ tableId });
  const [tables] = api.table.listByBase.useSuspenseQuery({ baseId });

  const createTable = api.table.create.useMutation({
    onSuccess: async ({ table }) => {
      await utils.table.listByBase.invalidate({ baseId });
      if (table) {
        router.push(`/bases/${baseId}/tables/${table.id}`);
      }
    },
  });

  const columnFormRef = useRef<HTMLDivElement | null>(null);
  const [isColumnFormOpen, setIsColumnFormOpen] = useState(false);
  const [columnName, setColumnName] = useState("New field");
  const [columnType, setColumnType] = useState<ColumnType>("text");
  const [selectOptions, setSelectOptions] = useState("Backlog\nIn Progress\nComplete");

  const [tableMenu, setTableMenu] = useState<
    { tableId: string; x: number; y: number } | null
  >(null);

  const handleOpenColumnForm = useCallback(() => {
    setIsColumnFormOpen(true);
  }, []);

  const parsedTables = useMemo(
    () => [...tables].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)),
    [tables],
  );

  const createField = api.table.createField.useMutation({
    onSuccess: async () => {
      setIsColumnFormOpen(false);
      setColumnName("New field");
      setColumnType("text");
      setSelectOptions("Backlog\nIn Progress\nComplete");
      await Promise.all([
        utils.table.get.invalidate({ tableId }),
        utils.table.getRecords.invalidate({ tableId }),
      ]);
    },
  });

  const deleteTable = api.table.delete.useMutation({
    onSuccess: async (_result, variables) => {
      setTableMenu(null);
      await Promise.all([
        utils.table.listByBase.invalidate({ baseId }),
        utils.base.get.invalidate({ baseId }),
      ]);

      if (variables.tableId === tableId) {
        const fallback = parsedTables.find((tbl) => tbl.id !== tableId);
        if (fallback) {
          router.push(`/bases/${baseId}/tables/${fallback.id}`);
        } else {
          router.push(`/bases/${baseId}`);
        }
      }
    },
  });

  useEffect(() => {
    if (!isColumnFormOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        columnFormRef.current &&
        !columnFormRef.current.contains(event.target as Node)
      ) {
        setIsColumnFormOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isColumnFormOpen]);

  useEffect(() => {
    if (!tableMenu) return;

    const close = () => setTableMenu(null);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTableMenu(null);
      }
    };

    document.addEventListener("click", close);
    document.addEventListener("contextmenu", close);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("contextmenu", close);
      document.removeEventListener("keydown", handleKey);
    };
  }, [tableMenu]);

  return (
    <div className="flex w-full flex-col gap-4 bg-white px-6 py-6">
      <header className="space-y-4">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">
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

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">{table.name}</h1>
          <div className="relative">
            <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-sky-100 bg-sky-50 px-2 py-1.5">
              {parsedTables.map((tbl) => {
                const isActive = tbl.id === tableId;
                return (
                  <button
                    key={tbl.id}
                    type="button"
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setTableMenu({
                        tableId: tbl.id,
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                    onClick={() => {
                      if (tbl.id !== tableId) {
                        router.push(`/bases/${baseId}/tables/${tbl.id}`);
                      }
                    }}
                    className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                      isActive
                        ? "bg-white text-sky-700 shadow-sm"
                        : "text-sky-700/70 hover:bg-white/70"
                    }`}
                  >
                    {tbl.icon ?? "📋"}
                    <span className="whitespace-nowrap">{tbl.name}</span>
                    <span
                      aria-hidden
                      className="text-[11px] text-sky-500"
                    >
                      ▾
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  const name = prompt("Table name", "Untitled table");
                  if (!name?.trim()) return;
                  createTable.mutate({ baseId, name: name.trim() });
                }}
                className="ml-2 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white text-base font-semibold text-sky-600 shadow transition hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                aria-label="Add table"
              >
                +
              </button>
          </div>

            {tableMenu ? (
              <div
                className="fixed z-50 min-w-[160px] rounded-md border border-gray-200 bg-white p-1 shadow-xl"
                style={{ top: tableMenu.y, left: tableMenu.x }}
              >
                <button
                  type="button"
                  onClick={() => deleteTable.mutate({ tableId: tableMenu.tableId })}
                  className="flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deleteTable.isPending}
                >
                  {deleteTable.isPending ? "Deleting…" : "Delete table"}
                </button>
              </div>
            ) : null}

            {isColumnFormOpen ? (
              <div
                ref={columnFormRef}
                className="absolute right-4 top-12 z-20 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-xl"
              >
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!columnName.trim()) return;

                    const payload = {
                      tableId,
                      name: columnName.trim(),
                      type: columnType,
                      options:
                        columnType === "singleSelect"
                          ? parseSelectOptions(selectOptions)
                          : undefined,
                    } satisfies CreateFieldInput;

                    createField.mutate(payload);
                  }}
                >
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Column name
                    </label>
                    <input
                      value={columnName}
                      onChange={(event) => setColumnName(event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="New field"
                      maxLength={60}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Type
                    </label>
                    <select
                      value={columnType}
                      onChange={(event) =>
                        setColumnType(event.target.value as ColumnType)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="text">Text</option>
                      <option value="singleSelect">Single select</option>
                      <option value="longText">Long text</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="date">Date</option>
                    </select>
                  </div>

                  {columnType === "singleSelect" ? (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Options (one per line)
                      </label>
                      <textarea
                        value={selectOptions}
                        onChange={(event) => setSelectOptions(event.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsColumnFormOpen(false)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createField.isPending}
                      className="rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {createField.isPending ? "Adding…" : "Add column"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="rounded-lg border border-gray-200 bg-white p-0 shadow-sm">
        <InfiniteTable
          tableId={tableId}
          onRequestAddColumn={handleOpenColumnForm}
        />
      </div>
    </div>
  );
}

type ColumnType = "text" | "singleSelect" | "longText" | "checkbox" | "date";

type CreateFieldInput = {
  tableId: string;
  name: string;
  type: ColumnType;
  options?: Array<{ label: string; color: string }>;
};

function parseSelectOptions(raw: string) {
  const labels = raw
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (labels.length === 0) {
    return SELECT_COLOR_PRESETS.map((color, index) => ({
      label: ["Backlog", "In Progress", "Complete"][index] ?? `Option ${index + 1}`,
      color,
    }));
  }

  return labels.map((label, index) => ({
    label,
    color: SELECT_COLOR_PRESETS[index % SELECT_COLOR_PRESETS.length]!,
  }));
}

// 56px + 48px + 45px + 32px
