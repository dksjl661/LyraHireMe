"use client";

import { useMemo, useState, useEffect, useRef } from "react";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";

import { createGradientPair } from "~/lib/color";
import { BASE_COLOR_OPTIONS } from "../../_components/create-base-form";

type BaseData = RouterOutputs["base"]["get"];

type BaseHeaderProps = {
  base: BaseData;
  onDelete: () => void;
  isDeleting: boolean;
};

export function BaseHeader({ base, onDelete, isDeleting }: BaseHeaderProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  // Close color picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    }

    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker]);

  const [primary, secondary] = useMemo(
    () => createGradientPair(base.color),
    [base.color],
  );

  const updateBase = api.base.update.useMutation({
    onSuccess: async () => {
      await utils.base.get.invalidate({ baseId: base.id });
      await utils.base.list.invalidate();
      setShowColorPicker(false);
    },
  });

  return (
    <section className="overflow-hidden rounded-4xl border border-white/10 bg-slate-900/80 shadow-[0_40px_90px_-40px_rgba(15,23,42,0.9)]">
      <div
        className="relative flex flex-col gap-6 bg-gradient-to-br from-transparent via-white/5 to-white/10 p-8 sm:p-10"
        style={{
          backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl">
              📚
            </span>
            <div>
              <h1 className="text-4xl font-semibold text-white drop-shadow-sm">
                {base.name}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {base.description ??
                  "Organize your data with Airtable-grade polish."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-white">
            <button
              type="button"
              className="rounded-full border border-white/20 bg-white/20 px-4 py-2 transition hover:bg-white/30"
            >
              Share
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="rounded-full border border-white/30 bg-white/10 px-4 py-2 transition hover:border-red-200/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting…" : "Delete base"}
            </button>
          </div>
        </div>

        <dl className="grid gap-4 text-xs font-semibold tracking-[0.3em] text-white/70 uppercase sm:grid-cols-3">
          <div>
            <dt>Tables</dt>
            <dd className="mt-2 text-lg tracking-normal text-white normal-case">
              {base.tables.length}
            </dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd className="mt-2 text-lg tracking-normal text-white normal-case">
              {new Date(base.createdAt ?? new Date()).toLocaleDateString()}
            </dd>
          </div>
          <div className="relative">
            <dt>Accent</dt>
            <dd className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 transition hover:border-white/50"
                style={{ backgroundColor: base.color }}
                aria-label="Change base color"
              >
                <span className="text-xs text-white/90">✎</span>
              </button>
              <span className="text-lg tracking-normal text-white normal-case">
                {base.color}
              </span>
            </dd>
            {showColorPicker && (
              <div
                ref={colorPickerRef}
                className="absolute top-full right-0 z-50 mt-2 rounded-2xl border border-white/20 bg-slate-900/95 p-4 shadow-2xl backdrop-blur"
              >
                <div className="flex flex-wrap gap-2">
                  {BASE_COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        updateBase.mutate({ baseId: base.id, color });
                      }}
                      disabled={updateBase.isPending}
                      className={`relative h-8 w-8 rounded-full border-2 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 ${
                        base.color === color
                          ? "border-white/60 ring-2 ring-white/30"
                          : "border-white/20 hover:border-white/40"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Set color to ${color}`}
                    >
                      {base.color === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="mt-3 w-full rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </dl>
      </div>
    </section>
  );
}
