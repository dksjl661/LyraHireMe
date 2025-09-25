"use client";

import React, { useMemo, useState, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  generateFakeData,
  type FakeRecord,
  FIELD_DEFINITIONS,
} from "~/lib/fake-data";

// Context Menu Component
interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDeleteRow?: () => void;
  onDeleteColumn?: () => void;
  type: "row" | "column";
}

function ContextMenu({
  x,
  y,
  onClose,
  onDeleteRow,
  onDeleteColumn,
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
      className="fixed z-50 min-w-[150px] rounded-lg border border-white/20 bg-slate-800/95 py-2 shadow-xl backdrop-blur-sm"
      style={{ left: x, top: y }}
    >
      {type === "row" && onDeleteRow && (
        <button
          onClick={() => {
            onDeleteRow();
            onClose();
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
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
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
        >
          Delete Column
        </button>
      )}
    </div>
  );
}

// Editable Cell Component
interface EditableCellProps {
  value: any;
  field: (typeof FIELD_DEFINITIONS)[number];
  onSave: (value: any) => void;
}

function EditableCell({ value, field, onSave }: EditableCellProps) {
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
    if (field.type === "checkbox") {
      return <span className="text-base">{value ? "✅" : "⬜️"}</span>;
    }

    if (field.type === "singleSelect") {
      const colors = {
        "Not Started": "#9CA3AF",
        "In Progress": "#3B82F6",
        Review: "#F59E0B",
        Done: "#10B981",
        Blocked: "#EF4444",
        Low: "#10B981",
        Medium: "#F59E0B",
        High: "#F97316",
        Urgent: "#EF4444",
        Bug: "#EF4444",
        Feature: "#3B82F6",
        Task: "#6B7280",
        Epic: "#8B5CF6",
        Story: "#06B6D4",
      };
      const color = colors[value as keyof typeof colors] || "#6B7280";

      return (
        <span
          className="inline-flex max-w-full items-center truncate rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: `${color}15`,
            color,
          }}
          title={value}
        >
          <span className="truncate">{value}</span>
        </span>
      );
    }

    if (field.type === "number") {
      return (
        <span className="truncate font-mono" title={`${value}%`}>
          {value}%
        </span>
      );
    }

    return (
      <span className="block max-w-full truncate" title={String(value)}>
        {value}
      </span>
    );
  };

  const renderEditInput = () => {
    if (field.type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={editValue}
          onChange={(e) => setEditValue(e.target.checked)}
          onBlur={handleSave}
          autoFocus
          className="h-4 w-4 rounded border border-gray-300 bg-transparent"
        />
      );
    }

    if (field.type === "singleSelect" && "options" in field) {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full border-0 bg-transparent px-0 py-0 text-sm text-gray-900 focus:outline-none"
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "number") {
      return (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(Number(e.target.value))}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full border-0 bg-transparent px-0 py-0 text-sm text-gray-900 focus:outline-none"
        />
      );
    }

    if (field.type === "date") {
      return (
        <input
          type="date"
          value={editValue}
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
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full rounded border border-white/20 bg-slate-700 px-2 py-1 text-sm text-white"
      />
    );
  };

  const getAlignmentClass = () => {
    if (field.type === "number") return "text-right";
    if (field.type === "checkbox") return "text-center";
    if (field.type === "date") return "text-left";
    return "text-left";
  };

  return (
    <div
      className={`h-[32px] w-full cursor-pointer px-3 py-1 ${getAlignmentClass()} flex items-center ${!isEditing ? "hover:bg-gray-50" : "bg-white"}`}
      onDoubleClick={() => !isEditing && setIsEditing(true)}
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
}

export function EnhancedTable() {
  const [data, setData] = useState<FakeRecord[]>(() => generateFakeData(1000));
  const [sorting, setSorting] = useState<SortingState>([]);
  const [visibleFields, setVisibleFields] = useState(() => [
    ...FIELD_DEFINITIONS,
  ]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "row" | "column";
    rowIndex?: number;
    columnId?: string;
  } | null>(null);

  const columns = useMemo<ColumnDef<FakeRecord>[]>(
    () => [
      {
        id: "select",
        header: "",
        size: 40,
        cell: ({ row }) => (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-gray-400">{row.index + 1}</span>
          </div>
        ),
      },
      ...visibleFields.map((field) => ({
        accessorKey: field.id,
        header: ({ column }: any) => (
          <div
            className={`flex items-center gap-2 ${
              field.type === "number"
                ? "justify-end"
                : field.type === "checkbox"
                  ? "justify-center"
                  : field.type === "date"
                    ? "justify-start"
                    : "justify-start"
            }`}
          >
            <span className="text-xs text-gray-500">
              {field.type === "text" && "📝"}
              {field.type === "email" && "📧"}
              {field.type === "singleSelect" && "🏷️"}
              {field.type === "number" && "🔢"}
              {field.type === "date" && "📅"}
              {field.type === "longText" && "📄"}
              {field.type === "checkbox" && "☑️"}
            </span>
            <span className="truncate">{field.name}</span>
          </div>
        ),
        size:
          field.type === "longText"
            ? 360
            : field.type === "checkbox"
              ? 120
              : field.id === "name"
                ? 240
                : field.id === "email"
                  ? 300
                  : field.id === "assignee"
                    ? 216
                    : field.id === "dueDate"
                      ? 432
                      : 180,
        cell: ({ getValue, row, column }: any) => (
          <EditableCell
            value={getValue()}
            field={field}
            onSave={(newValue) => {
              setData((prev) =>
                prev.map((item, index) =>
                  index === row.index
                    ? { ...item, [field.id]: newValue }
                    : item,
                ),
              );
            }}
          />
        ),
      })),
    ],
    [visibleFields],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 20,
  });

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

  const handleDeleteRow = useCallback(() => {
    if (contextMenu?.rowIndex !== undefined) {
      setData((prev) =>
        prev.filter((_, index) => index !== contextMenu.rowIndex),
      );
    }
  }, [contextMenu]);

  const handleDeleteColumn = useCallback(() => {
    if (contextMenu?.columnId && contextMenu.columnId !== "select") {
      // Remove the column from visible fields
      setVisibleFields((prev) =>
        prev.filter((field) => field.id !== contextMenu.columnId),
      );

      // Remove the column data from all records
      setData((prev) =>
        prev.map((record) => {
          const newRecord = { ...record };
          delete (newRecord as any)[contextMenu.columnId as string];
          return newRecord;
        }),
      );
    }
  }, [contextMenu]);

  const handleAddRow = () => {
    setData((prev) => [...prev, ...generateFakeData(1)]);
  };

  const handleAddColumn = () => {
    // Find hidden fields that can be restored
    const hiddenFields = FIELD_DEFINITIONS.filter(
      (field) => !visibleFields.some((vf) => vf.id === field.id),
    );

    if (hiddenFields.length > 0) {
      // Add the first hidden field back
      const fieldToAdd = hiddenFields[0];
      if (fieldToAdd) {
        setVisibleFields((prev) => [...prev, fieldToAdd]);

        // Regenerate data for the restored field
        setData((prev) =>
          prev.map((record) => ({
            ...record,
            [fieldToAdd.id]:
              generateFakeData(1)[0]?.[fieldToAdd.id as keyof FakeRecord] ?? "",
          })),
        );
      }
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Controls */}
      <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2">
        <span className="text-xs text-gray-500">{data.length} records</span>
        {FIELD_DEFINITIONS.length > visibleFields.length && (
          <button
            onClick={handleAddColumn}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            + Restore field ({FIELD_DEFINITIONS.length - visibleFields.length}{" "}
            hidden)
          </button>
        )}
      </div>

      {/* Table Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm"
        style={{ height: "calc(100vh - 180px)" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize() + 32}px`,
            position: "relative",
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <div
                key={headerGroup.id}
                className="flex border-b border-gray-200"
              >
                {headerGroup.headers.map((header) => (
                  <div
                    key={header.id}
                    className="flex h-[32px] items-center border-r border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 last:border-r-0"
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
              </div>
            ))}
          </div>

          {/* Virtual Rows */}
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;
            return (
              <div
                key={row.id}
                className="absolute left-0 flex h-[32px] w-full border-b border-gray-100 bg-white hover:bg-gray-50"
                style={{
                  height: `32px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onContextMenu={(e) =>
                  handleContextMenu(e, "row", virtualRow.index)
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="h-[32px] overflow-hidden border-r border-gray-100 text-sm text-gray-900 last:border-r-0"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Add Row Button */}
          <div
            className="absolute left-0 flex h-[32px] w-full cursor-pointer border-b border-gray-100 bg-white hover:bg-gray-50"
            style={{
              height: `32px`,
              transform: `translateY(${virtualizer.getTotalSize()}px)`,
            }}
            onClick={handleAddRow}
          >
            <div
              className="flex items-center justify-center border-r border-gray-100"
              style={{ width: 40 }}
            >
              <button className="flex h-6 w-6 items-center justify-center text-lg text-gray-400 hover:text-gray-600">
                +
              </button>
            </div>
            {visibleFields.map((field) => (
              <div
                key={field.id}
                className="flex h-[32px] items-center overflow-hidden border-r border-gray-100 px-3 text-sm text-gray-400 last:border-r-0"
                style={{ width: table.getColumn(field.id)?.getSize() }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          onClose={() => setContextMenu(null)}
          onDeleteRow={contextMenu.type === "row" ? handleDeleteRow : undefined}
          onDeleteColumn={
            contextMenu.type === "column" ? handleDeleteColumn : undefined
          }
        />
      )}
    </div>
  );
}
