"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

type SelectOption = { label: string; color: string };

const DEFAULT_FIELD_PALETTE: SelectOption[] = [
  { label: "Backlog", color: "#f97316" },
  { label: "In Progress", color: "#3b82f6" },
  { label: "Complete", color: "#10b981" },
];

type TableField = RouterOutputs["table"]["get"]["fields"][number];
type TableRecord = RouterOutputs["table"]["getRecords"]["records"][number];

interface InfiniteTableProps {
  tableId: string;
  onRequestAddColumn: () => void;
}

// Context Menu Component
interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDeleteRow?: () => void;
  onDeleteColumn?: () => void;
  disableDeleteRow?: boolean;
  disableDeleteColumn?: boolean;
  deleteColumnLabel?: string;
  type: "row" | "column";
}

function ContextMenu({
  x,
  y,
  onClose,
  onDeleteRow,
  onDeleteColumn,
  disableDeleteRow,
  disableDeleteColumn,
  deleteColumnLabel,
  type,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[150px] rounded-lg border border-gray-200 bg-white py-2 shadow-xl"
      style={{ left: x, top: y }}
    >
      {type === "row" && onDeleteRow && (
        <button
          onClick={() => {
            onDeleteRow();
            onClose();
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disableDeleteRow}
        >
          Delete Row
        </button>
      )}
      {type === "column" && onDeleteColumn && (
        <button
          onClick={() => {
            onDeleteColumn();
            onClose();
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disableDeleteColumn}
        >
          {deleteColumnLabel ?? "Delete Column"}
        </button>
      )}
    </div>
  );
}

function isSelectOptionArray(value: unknown): value is SelectOption[] {
  return (
    Array.isArray(value) &&
    value.every(
      (option) =>
        option !== null &&
        typeof option === "object" &&
        "label" in option &&
        "color" in option &&
        typeof (option as { label: unknown }).label === "string" &&
        typeof (option as { color: unknown }).color === "string",
    )
  );
}

function getSelectOptions(field: TableField): SelectOption[] {
  const raw = field.config?.options;
  return isSelectOptionArray(raw) ? raw : DEFAULT_FIELD_PALETTE;
}

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function getDateInputValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0] ?? "";
  }
  const stringValue = toDisplayString(value);
  if (!stringValue) return "";
  const date = new Date(stringValue);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().split("T")[0] ?? "";
}

function formatDateForDisplay(value: unknown): string {
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  const stringValue = toDisplayString(value);
  if (!stringValue) return "";
  const date = new Date(stringValue);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

// Editable Cell Component
interface EditableCellProps {
  value: unknown;
  field: TableField;
  onSave: (value: unknown) => void;
}

const EditableCell = React.memo(function EditableCell({
  value,
  field,
  onSave,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const renderValue = () => {
    if (field.type === "singleSelect") {
      const displayValue = toDisplayString(value);
      let colorClass = "bg-gray-100 text-gray-800";

      const option = getSelectOptions(field).find(
        (opt) => opt.label === displayValue,
      );
      if (option?.color) {
        // Convert hex color to appropriate Tailwind classes (simplified)
        if (option.color.includes("f97316"))
          colorClass = "bg-orange-100 text-orange-800";
        else if (option.color.includes("3b82f6"))
          colorClass = "bg-blue-100 text-blue-800";
        else if (option.color.includes("10b981"))
          colorClass = "bg-green-100 text-green-800";
      } else {
        // Default status colors
        if (displayValue === "Complete")
          colorClass = "bg-green-100 text-green-800";
        else if (displayValue === "In Progress")
          colorClass = "bg-blue-100 text-blue-800";
        else if (displayValue === "Backlog")
          colorClass = "bg-orange-100 text-orange-800";
      }

      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}
        >
          {displayValue}
        </span>
      );
    }

    if (field.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onSave(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      );
    }

    if (field.type === "date") {
      const dateValue = formatDateForDisplay(value);
      return (
        <span className="block truncate" title={dateValue}>
          {dateValue || "No date"}
        </span>
      );
    }

    return (
      <span className="block truncate" title={toDisplayString(value)}>
        {toDisplayString(value)}
      </span>
    );
  };

  const renderEditInput = () => {
    if (field.type === "singleSelect") {
      const options = getSelectOptions(field);

      return (
        <select
          value={toDisplayString(editValue)}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full border-0 bg-transparent px-0 py-0 text-sm text-gray-900 focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "longText") {
      return (
        <textarea
          value={toDisplayString(editValue)}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full resize-none border-0 bg-transparent px-0 py-0 text-sm text-gray-900 focus:outline-none"
          rows={2}
        />
      );
    }

    if (field.type === "date") {
      const dateValue = getDateInputValue(editValue);
      return (
        <input
          type="date"
          value={dateValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full border-0 bg-transparent px-0 py-0 text-sm text-gray-900 focus:outline-none"
        />
      );
    }

    return (
      <input
        type="text"
        value={toDisplayString(editValue)}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full border-0 bg-transparent px-0 py-0 text-sm text-gray-900 focus:outline-none"
      />
    );
  };

  if (field.type === "checkbox") {
    return (
      <div className="flex h-10 w-full items-center justify-center px-3 py-2">
        {renderValue()}
      </div>
    );
  }

  return (
    <div
      className="flex h-10 w-full cursor-pointer items-center px-3 py-2 hover:bg-gray-50"
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isEditing) {
          setIsEditing(true);
        }
      }}
    >
      <div className="w-full overflow-hidden">
        {isEditing ? (
          renderEditInput()
        ) : (
          <div className="w-full truncate">{renderValue()}</div>
        )}
      </div>
    </div>
  );
});

// Top Toolbar Component with Add 100k Button
interface TopToolbarProps {
  tableId: string;
  onBulkAdd: () => void;
  isAddingBulk: boolean;
  fields: TableField[];
}

function TopToolbar({
  tableId,
  onBulkAdd,
  isAddingBulk,
  fields,
}: TopToolbarProps) {
  const utils = api.useUtils();

  // Check if due date field exists
  const hasDueDateField = fields.some(
    (field) => field.type === "date" && field.name === "Due Date",
  );

  const addDueDateMutation = api.table.addDueDateField.useMutation({
    onSuccess: async () => {
      await utils.table.get.invalidate({ tableId });
    },
  });
  return (
    <div className="flex items-center border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex-1"></div>

      <div className="flex h-7 items-center gap-2">
        {!hasDueDateField && (
          <>
            <button
              onClick={() => addDueDateMutation.mutate({ tableId })}
              disabled={addDueDateMutation.isPending}
              className="flex items-center gap-2 rounded bg-blue-50 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addDueDateMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"></div>
                  Adding...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Add Due Date
                </>
              )}
            </button>
            <div className="h-4 w-px bg-gray-300"></div>
          </>
        )}

        <button
          onClick={onBulkAdd}
          disabled={isAddingBulk}
          className="flex items-center gap-2 rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAddingBulk ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
              Adding 100k rows...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add 100k Rows
            </>
          )}
        </button>

        <div className="h-4 w-px bg-gray-300"></div>

        <button className="flex items-center gap-2 rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter
        </button>

        <button className="flex items-center gap-2 rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7"
            />
          </svg>
          Sort
        </button>
      </div>
    </div>
  );
}

export function InfiniteTable({ tableId, onRequestAddColumn }: InfiniteTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "row" | "column";
    rowIndex?: number;
    columnId?: string;
  } | null>(null);

  // Get table structure (fields only, not all records)
  const {
    data: tableStructure,
    isLoading: isLoadingStructure,
    error: structureError,
  } = api.table.get.useQuery({ tableId });

  const {
    data,
    error: recordsError,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
  } = api.table.getRecords.useInfiniteQuery(
    { tableId, limit: 50 },
    {
      getNextPageParam: (lastPage) => lastPage.nextOffset,
      staleTime: 10000,
      gcTime: 2 * 60 * 1000, // Shorter garbage collection for memory efficiency
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  );

  // Flatten all pages into a single array
  const allRecords = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.records);
  }, [data]);

  const hasError = Boolean(structureError ?? recordsError);
  const combinedStatus = isLoadingStructure
    ? "pending"
    : hasError
      ? "error"
      : "success";
  const error = structureError ?? recordsError;

  // Bulk add mutation
  const bulkAddMutation = api.table.createBulkRecords.useMutation({
    onSuccess: () => {
      // Refetch all data after bulk add
      void refetch();
    },
  });

  // Update record mutation with optimistic updates
  const utils = api.useUtils();
  const updateRecordMutation = api.table.updateRecord.useMutation({
    onMutate: async ({ recordId, fieldId, value }) => {
      // Cancel any outgoing refetches
      await utils.table.getRecords.cancel({ tableId });

      // Snapshot the previous value
      const previousData = utils.table.getRecords.getInfiniteData({ tableId });

      // Optimistically update the cache
      utils.table.getRecords.setInfiniteData({ tableId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            records: page.records.map((record) =>
              record.id === recordId
                ? {
                    ...record,
                    values: { ...record.values, [fieldId]: value },
                  }
                : record,
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      console.error("Failed to update record:", err);
      if (context?.previousData) {
        utils.table.getRecords.setInfiniteData(
          { tableId },
          context.previousData,
        );
      }
    },
    onSettled: async () => {
      // Always refetch after error or success to sync with server
      await utils.table.getRecords.invalidate({ tableId });
    },
  });

  const deleteRecordsMutation = api.table.deleteRecords.useMutation({
    onMutate: async ({ recordIds }) => {
      await utils.table.getRecords.cancel({ tableId });
      const previousRecords = utils.table.getRecords.getInfiniteData({
        tableId,
      });

      utils.table.getRecords.setInfiniteData({ tableId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            records: page.records.filter(
              (record) => !recordIds.includes(record.id),
            ),
          })),
        };
      });

      return { previousRecords };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRecords) {
        utils.table.getRecords.setInfiniteData(
          { tableId },
          context.previousRecords,
        );
      }
    },
    onSettled: async () => {
      await utils.table.getRecords.invalidate({ tableId });
    },
  });

  const deleteFieldMutation = api.table.deleteField.useMutation({
    onMutate: async ({ fieldId }) => {
      await Promise.all([
        utils.table.get.cancel({ tableId }),
        utils.table.getRecords.cancel({ tableId }),
      ]);

      const previousStructure = utils.table.get.getData({ tableId });
      const previousRecords = utils.table.getRecords.getInfiniteData({
        tableId,
      });

      utils.table.get.setData({ tableId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          fields: old.fields.filter((field) => field.id !== fieldId),
        };
      });

      utils.table.getRecords.setInfiniteData({ tableId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            records: page.records.map((record) => {
              const nextValues = { ...(record.values ?? {}) };
              delete nextValues[fieldId];
              return {
                ...record,
                values: nextValues as typeof record.values,
              };
            }),
          })),
        };
      });

      return { previousStructure, previousRecords };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStructure) {
        utils.table.get.setData({ tableId }, context.previousStructure);
      }
      if (context?.previousRecords) {
        utils.table.getRecords.setInfiniteData(
          { tableId },
          context.previousRecords,
        );
      }
    },
    onSettled: async () => {
      await Promise.all([
        utils.table.get.invalidate({ tableId }),
        utils.table.getRecords.invalidate({ tableId }),
      ]);
    },
  });

  const handleBulkAdd = useCallback(() => {
    bulkAddMutation.mutate({
      tableId,
      count: 50,
    });
  }, [tableId, bulkAddMutation]);

  // Efficient memory management: render all loaded records without sliding window
  // since we're fetching in small 50-row batches
  const optimizedRecords = useMemo(() => {
    return allRecords;
  }, [allRecords]);

  const fields = useMemo(() => {
    const baseFields = tableStructure?.fields ?? [];
    const getPriority = (field: TableField) => {
      const lower = field.name.toLowerCase();
      if (field.config?.isPrimary || lower.includes("name")) return 0;
      if (lower.includes("status")) return 1;
      if (lower.includes("email")) return 2;
      return 3 + field.orderIndex;
    };
    return [...baseFields].sort((a, b) => getPriority(a) - getPriority(b));
  }, [tableStructure]);

  // Add record mutation
  const createRecordMutation = api.table.createRecord.useMutation({
    onSuccess: async () => {
      await utils.table.getRecords.invalidate({ tableId });
    },
  });

  // Create table columns
  const columns = useMemo<ColumnDef<TableRecord>[]>(() => {
    const cols: ColumnDef<TableRecord>[] = [];

    fields.forEach((field) => {
      cols.push({
        id: field.id,
        accessorFn: (row) => row.values[field.id],
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-xs">
              {field.type === "text"
                ? "📝"
                : field.type === "singleSelect"
                  ? "🔄"
                  : field.type === "longText"
                    ? "📄"
                    : field.type === "checkbox"
                      ? "✅"
                      : field.type === "date"
                        ? "📅"
                        : "📋"}
            </span>
            <span>{field.name}</span>
          </div>
        ),
        size:
          field.type === "longText"
            ? 200
            : field.type === "checkbox"
              ? 80
              : 150,
        cell: ({ getValue, row }) => {
          const record = row.original;
          const value = getValue();
          return (
            <EditableCell
              value={value}
              field={field}
              onSave={(newValue) => {
                updateRecordMutation.mutate({
                  recordId: record.id,
                  fieldId: field.id,
                  value: newValue as string | boolean | null,
                });
              }}
            />
          );
        },
      });
    });

    return cols;
  }, [fields, updateRecordMutation]);

  const table = useReactTable({
    data: optimizedRecords,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Keep sorting enabled since we're using small batches
    enableSorting: true,
  });

  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const handleAddRow = useCallback(() => {
    if (fields.length === 0) return;

    const nextIndex = rows.length + 1;
    const values: Record<string, string | boolean | null> = {};

    for (const field of fields) {
      if (field.type === "checkbox") {
        values[field.id] = false;
        continue;
      }

      if (field.type === "singleSelect") {
        const options = getSelectOptions(field);
        values[field.id] = options[0]?.label ?? "Backlog";
        continue;
      }

      if (field.type === "date") {
        values[field.id] = new Date().toISOString().slice(0, 10);
        continue;
      }

      const lowerName = field.name.toLowerCase();
      if (field.config?.isPrimary || lowerName.includes("name")) {
        values[field.id] = `Record ${nextIndex}`;
        continue;
      }

      if (lowerName.includes("email")) {
        values[field.id] = `user${nextIndex}@example.com`;
        continue;
      }

      values[field.id] = "";
    }

    createRecordMutation.mutate({ tableId, values });
  }, [createRecordMutation, fields, rows.length, tableId]);

  // Optimized virtual scrolling for 50-row batches
  const rowHeight = 40;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 20, // Higher overscan for smoother scrolling with small batches
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Aggressive prefetching for smooth scrolling with 50-row batches
  useEffect(() => {
    if (!virtualItems.length) return;

    const [lastItem] = [...virtualItems].reverse();
    if (!lastItem) return;

    // Fetch next 50 rows when we're within 15 items of the end
    // This ensures we always have data ready as user scrolls
    if (
      lastItem.index >= rows.length - 15 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, rows.length, isFetchingNextPage, virtualItems]);

  const handleContextMenu = useCallback(
    (
      e: React.MouseEvent,
      type: "row" | "column",
      rowIndex?: number,
      columnId?: string,
    ) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type,
        rowIndex,
        columnId,
      });
    },
    [],
  );

  const targetRow =
    contextMenu?.type === "row" &&
    typeof contextMenu.rowIndex === "number" &&
    contextMenu.rowIndex >= 0
      ? rows[contextMenu.rowIndex]
      : undefined;

  const targetField =
    contextMenu?.type === "column" && contextMenu.columnId
      ? fields.find((field) => field.id === contextMenu.columnId)
      : undefined;

  const isPrimaryField = Boolean(targetField?.config?.isPrimary);

  if (combinedStatus === "pending") {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading table data...</p>
        </div>
      </div>
    );
  }

  if (combinedStatus === "error") {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading table data</p>
          <p className="text-sm text-gray-500">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white">
      {/* Top Toolbar */}
      <TopToolbar
        tableId={tableId}
        onBulkAdd={handleBulkAdd}
        isAddingBulk={bulkAddMutation.isPending}
        fields={fields}
      />

      {/* Empty state */}
      {optimizedRecords.length === 0 && !isFetching && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="mb-2 text-lg text-gray-600">No records found</p>
            <p className="text-sm text-gray-500">
              Click &quot;Add 100k Rows&quot; to get started
            </p>
          </div>
        </div>
      )}

      {/* Table Container */}
      {optimizedRecords.length > 0 && (
        <div ref={parentRef} className="h-[500px] overflow-auto bg-white">
          <div
            className="relative w-full"
            style={{
              height: `${virtualizer.getTotalSize() + rowHeight}px`,
            }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <div key={headerGroup.id} className="flex">
                  <div className="flex h-10 w-14 items-center justify-center border-r border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500">
                    #
                  </div>
                  {headerGroup.headers.map((header) => (
                    <div
                      key={header.id}
                      className="flex h-10 items-center border-r border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 last:border-r-0"
                      style={{ width: header.getSize() }}
                      onContextMenu={(e) =>
                        handleContextMenu(e, "column", undefined, header.id)
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "flex cursor-pointer items-center gap-2 select-none hover:text-gray-900"
                              : "flex items-center gap-2"
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: (
                              <span className="ml-1 text-xs text-gray-400">
                                ↑
                              </span>
                            ),
                            desc: (
                              <span className="ml-1 text-xs text-gray-400">
                                ↓
                              </span>
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={onRequestAddColumn}
                    className="flex h-10 w-14 flex-none items-center justify-center border-l border-gray-200 bg-gray-50 text-base font-semibold text-sky-600 transition hover:bg-sky-100"
                    aria-label="Add column"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>

            {/* Virtual Rows */}
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isLoaderRow = virtualRow.index > rows.length - 1;

              if (isLoaderRow) {
                return (
                  <div
                    key={virtualRow.index}
                    className="absolute left-0 flex h-10 w-full items-center justify-center border-b border-gray-100 bg-white"
                    style={{
                      height: `${rowHeight}px`,
                      transform: `translateY(${virtualRow.index * rowHeight}px)`,
                    }}
                  >
                    {hasNextPage ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
                        Loading next 50 rows...
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {optimizedRecords.length > 0
                          ? "End of data"
                          : "No records found"}
                      </div>
                    )}
                  </div>
                );
              }

              if (!row) return null;

              return (
                <div
                  key={row.id}
                  className="absolute left-0 flex h-10 w-full border-b border-gray-100 bg-white hover:bg-gray-50"
                  style={{
                    height: `${rowHeight}px`,
                    transform: `translateY(${virtualRow.index * rowHeight}px)`,
                    // Optimize rendering performance
                    contain: "layout style paint",
                    willChange: "transform",
                  }}
                  onContextMenu={(e) =>
                    handleContextMenu(e, "row", virtualRow.index)
                  }
                >
                  <div className="flex w-14 items-center justify-center border-r border-gray-100 text-xs font-semibold text-gray-500">
                    {virtualRow.index + 1}
                  </div>
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="flex h-10 items-center overflow-hidden border-r border-gray-100 text-sm text-gray-900 first:pl-2 last:border-r-0"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            <div
              className="absolute left-0 flex h-10 w-full border-b border-gray-100 bg-white"
              style={{
                height: `${rowHeight}px`,
                transform: `translateY(${rows.length * rowHeight}px)`,
              }}
            >
              <button
                type="button"
                onClick={handleAddRow}
                disabled={fields.length === 0}
                className="flex w-14 items-center justify-center border-r border-gray-100 text-base font-semibold text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Add row"
              >
                +
              </button>
              <div className="flex-1" />
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="flex h-8 items-center border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500">
        {isFetching && !isFetchingNextPage ? "Background updating..." : null}
        {bulkAddMutation.isPending && (
          <span className="text-blue-600">Creating 100k records...</span>
        )}
        {bulkAddMutation.isSuccess && (
          <span className="text-green-600">
            Successfully added {bulkAddMutation.data?.count} records!
          </span>
        )}
        {bulkAddMutation.isError && (
          <span className="text-red-600">
            Error: {bulkAddMutation.error?.message}
          </span>
        )}
        <span className="ml-auto">
          {optimizedRecords.length} rows loaded
          {hasNextPage && " • scroll to load more (50 at a time)"}
          {data?.pages[0]?.totalCount &&
            ` • total: ${data.pages[0].totalCount.toLocaleString()}`}
          {isFetchingNextPage && " • loading next 50..."}
        </span>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          onClose={() => setContextMenu(null)}
          onDeleteRow={
            targetRow
              ? () =>
                  deleteRecordsMutation.mutate({
                    tableId,
                    recordIds: [targetRow.original.id],
                  })
              : undefined
          }
          disableDeleteRow={deleteRecordsMutation.isPending}
          onDeleteColumn={
            targetField && !isPrimaryField
              ? () => deleteFieldMutation.mutate({ fieldId: targetField.id })
              : undefined
          }
          disableDeleteColumn={deleteFieldMutation.isPending || isPrimaryField}
          deleteColumnLabel={
            isPrimaryField ? "Primary field cannot be deleted" : "Delete Column"
          }
        />
      )}

    </div>
  );
}
