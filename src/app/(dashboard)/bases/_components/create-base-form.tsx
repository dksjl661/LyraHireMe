"use client";

import { useState } from "react";

type CreateBaseInput = {
  name: string;
  description?: string;
  color: string;
};

type CreateBaseFormProps = {
  onSubmit: (values: CreateBaseInput) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting: boolean;
};

export const BASE_COLOR_OPTIONS = [
  "#2563eb",
  "#0ea5e9",
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#facc15",
  "#d946ef",
  "#ef4444",
  "#14b8a6",
];

export function CreateBaseForm({ onSubmit, onCancel, isSubmitting }: CreateBaseFormProps) {
  const [form, setForm] = useState<CreateBaseInput>({
    name: "Untitled base",
    description: "",
    color: BASE_COLOR_OPTIONS[0]!,
  });

  return (
    <form
      className="flex h-full flex-col gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!form.name.trim()) return;
        await onSubmit({
          name: form.name.trim(),
          description: form.description?.trim() ? form.description.trim() : undefined,
          color: form.color,
        });
      }}
    >
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-300" htmlFor="base-name">
          Base name
        </label>
        <input
          id="base-name"
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value.slice(0, 60) }))
          }
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base font-semibold text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/20"
          placeholder="Product Roadmap"
          maxLength={60}
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-300" htmlFor="base-description">
          Description
        </label>
        <textarea
          id="base-description"
          rows={3}
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value.slice(0, 160) }))
          }
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-4 focus:ring-sky-500/20"
          placeholder="Plan, track, and deliver features with your team."
          maxLength={160}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-slate-300">Accent color</legend>
        <div className="flex flex-wrap gap-2">
          {BASE_COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, color }))}
              className={`relative h-10 w-10 rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                form.color === color
                  ? "ring-2 ring-offset-2 ring-offset-slate-950"
                  : "border border-white/10"
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select ${color} accent`}
            >
              {form.color === color ? (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-950">
                  ✓
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-auto flex items-center justify-end gap-3 text-sm font-medium">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-white/10 px-4 py-2 text-slate-200 transition hover:bg-white/20"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-sky-400 px-5 py-2 font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Creating…" : "Create base"}
        </button>
      </div>
    </form>
  );
}
