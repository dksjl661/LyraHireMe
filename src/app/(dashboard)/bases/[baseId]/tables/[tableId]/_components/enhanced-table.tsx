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

// Airtable-style data structure
interface AirtableRecord {
  id: string;
  deliverableName: string;
  description: string;
  dueDate: string;
  status: "Completed" | "In Progress" | "Blocked" | "Not Started";
  project: string;
  assignedTeamMember: string;
}

// Generate fake data that matches the screenshot
function generateAirtableData(count: number): AirtableRecord[] {
  const statuses: Array<
    "Completed" | "In Progress" | "Blocked" | "Not Started"
  > = ["Completed", "In Progress", "Blocked", "Not Started"];

  const projects = [
    "Solar Grid Expansion",
    "Battery Storage Pilot",
    "Wind Turbine Maintenance",
    "Hydro Plant Efficiency Upgrade",
    "Smart Meter Rollout",
  ];

  const teamMembers = [
    "Alexandra Chen",
    "Jorge Martinez",
    "Marcus Patel",
    "Priya Singh",
  ];

  const deliverables = [
    "Initial System Architecture",
    "User Acceptance Test Plan",
    "API Integration Document",
    "Final Project Report",
    "Deployment Checklist",
  ];

  const descriptions = [
    "Comprehensive diagram ...",
    "Document detailing the U...",
    "Technical documentation ...",
    "Comprehensive report su...",
    "Step-by-step checklist fo...",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `record-${i + 1}`,
    deliverableName: deliverables[i % deliverables.length]!,
    description: descriptions[i % descriptions.length]!,
    dueDate: new Date(2025, 8 + (i % 3), 10 + (i % 20)).toLocaleDateString(
      "en-US",
    ),
    status: statuses[i % statuses.length]!,
    project: projects[i % projects.length]!,
    assignedTeamMember: teamMembers[i % teamMembers.length]!,
  }));
}

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
      className="fixed z-50 min-w-[150px] rounded-lg border border-gray-200 bg-white py-2 shadow-xl"
      style={{ left: x, top: y }}
    >
      {type === "row" && onDeleteRow && (
        <button
          onClick={() => {
            onDeleteRow();
            onClose();
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Delete Column
        </button>
      )}
    </div>
  );
}

// Editable Cell Component
interface EditableCellProps {
  value: unknown;
  field: string;
  onSave: (value: unknown) => void;
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
    if (field === "status") {
      const statusColors = {
        Completed: "bg-green-100 text-green-800",
        "In Progress": "bg-blue-100 text-blue-800",
        Blocked: "bg-red-100 text-red-800",
        "Not Started": "bg-gray-100 text-gray-800",
      };

      const colorClass =
        statusColors[value as keyof typeof statusColors] ||
        "bg-gray-100 text-gray-800";

      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}
        >
          {value as string}
        </span>
      );
    }

    return (
      <span className="block truncate" title={String(value)}>
        {value as string}
      </span>
    );
  };

  const renderEditInput = () => {
    if (field === "status") {
      return (
        <select
          value={String(editValue)}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full border-0 bg-transparent px-0 py-0 text-sm text-gray-900 focus:outline-none"
        >
          <option value="Completed">Completed</option>
          <option value="In Progress">In Progress</option>
          <option value="Blocked">Blocked</option>
          <option value="Not Started">Not Started</option>
        </select>
      );
    }

    if (field === "dueDate") {
      return (
        <input
          type="date"
          value={String(editValue)}
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
        value={String(editValue)}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full border-0 bg-transparent px-0 py-0 text-sm text-gray-900 focus:outline-none"
      />
    );
  };

  return (
    <div
      className="flex h-8 w-full cursor-pointer items-center px-3 py-1 hover:bg-gray-50"
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

// Top Toolbar Component
function TopToolbar() {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
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
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L9.171 9.171m.707.707L15.121 15.121m0 0l.707.707M9.171 9.171l6.363 6.363"
          />
        </svg>
        Hide fields
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        Group
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

      <button className="flex items-center gap-2 rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100">
        <div className="h-4 w-4 rounded bg-blue-500"></div>
        Color
      </button>

      <div className="flex-1"></div>

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
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
          />
        </svg>
        Share and sync
      </button>

      <button className="rounded p-1 text-gray-600 hover:bg-gray-100">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </div>
  );
}

export function EnhancedTable() {
  const [data, setData] = useState<AirtableRecord[]>(() =>
    generateAirtableData(10),
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "row" | "column";
    rowIndex?: number;
    columnId?: string;
  } | null>(null);

  const columns = useMemo<ColumnDef<AirtableRecord>[]>(
    () => [
      {
        id: "select",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            {row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: "deliverableName",
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-xs">📋</span>
            <span>Deliverable Name</span>
          </div>
        ),
        size: 250,
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue()}
            field="deliverableName"
            onSave={(newValue) => {
              setData((prev) =>
                prev.map((item, index) =>
                  index === row.index
                    ? { ...item, deliverableName: String(newValue) }
                    : item,
                ),
              );
            }}
          />
        ),
      },
      {
        accessorKey: "description",
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-xs">📝</span>
            <span>Description</span>
          </div>
        ),
        size: 200,
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue()}
            field="description"
            onSave={(newValue) => {
              setData((prev) =>
                prev.map((item, index) =>
                  index === row.index
                    ? { ...item, description: String(newValue) }
                    : item,
                ),
              );
            }}
          />
        ),
      },
      {
        accessorKey: "dueDate",
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-xs">📅</span>
            <span>Due Date</span>
          </div>
        ),
        size: 120,
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue()}
            field="dueDate"
            onSave={(newValue) => {
              setData((prev) =>
                prev.map((item, index) =>
                  index === row.index
                    ? { ...item, dueDate: String(newValue) }
                    : item,
                ),
              );
            }}
          />
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-xs">🔄</span>
            <span>Status</span>
          </div>
        ),
        size: 120,
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue()}
            field="status"
            onSave={(newValue) => {
              setData((prev) =>
                prev.map((item, index) =>
                  index === row.index
                    ? { ...item, status: newValue as AirtableRecord["status"] }
                    : item,
                ),
              );
            }}
          />
        ),
      },
      {
        accessorKey: "project",
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-xs">📁</span>
            <span>Project</span>
          </div>
        ),
        size: 180,
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue()}
            field="project"
            onSave={(newValue) => {
              setData((prev) =>
                prev.map((item, index) =>
                  index === row.index
                    ? { ...item, project: String(newValue) }
                    : item,
                ),
              );
            }}
          />
        ),
      },
      {
        accessorKey: "assignedTeamMember",
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-xs">👤</span>
            <span>Assigned Team Me...</span>
          </div>
        ),
        size: 160,
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue()}
            field="assignedTeamMember"
            onSave={(newValue) => {
              setData((prev) =>
                prev.map((item, index) =>
                  index === row.index
                    ? { ...item, assignedTeamMember: String(newValue) }
                    : item,
                ),
              );
            }}
          />
        ),
      },
    ],
    [],
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
    // Column deletion logic can be implemented here
  }, []);

  const handleAddRow = () => {
    const newRecord: AirtableRecord = {
      id: `record-${data.length + 1}`,
      deliverableName: "",
      description: "",
      dueDate: new Date().toLocaleDateString("en-US"),
      status: "Not Started",
      project: "",
      assignedTeamMember: "",
    };
    setData((prev) => [...prev, newRecord]);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Top Toolbar */}
      <TopToolbar />

      {/* Table Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto bg-white"
        style={{ height: "calc(100vh - 180px)" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize() + 32}px`,
            position: "relative",
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} className="flex">
                {headerGroup.headers.map((header) => (
                  <div
                    key={header.id}
                    className="flex h-8 items-center border-r border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 last:border-r-0"
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
                className="absolute left-0 flex h-8 w-full border-b border-gray-100 bg-white hover:bg-gray-50"
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
                    className="h-8 overflow-hidden border-r border-gray-100 text-xs text-gray-900 last:border-r-0"
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
            className="absolute left-0 flex h-8 w-full cursor-pointer border-b border-gray-100 bg-white hover:bg-gray-50"
            style={{
              height: `32px`,
              transform: `translateY(${virtualizer.getTotalSize()}px)`,
            }}
            onClick={handleAddRow}
          >
            <div
              className="flex items-center justify-center border-r border-gray-100"
              style={{ width: 50 }}
            >
              <button className="flex h-4 w-4 items-center justify-center text-xs text-gray-400 hover:text-gray-600">
                +
              </button>
            </div>
            {table
              .getAllColumns()
              .slice(1)
              .map((column) => (
                <div
                  key={column.id}
                  className="flex h-8 items-center overflow-hidden border-r border-gray-100 px-3 text-xs text-gray-400 last:border-r-0"
                  style={{ width: column.getSize() }}
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
