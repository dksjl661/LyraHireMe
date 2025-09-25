"use client";

import { useState } from "react";

import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

import { CreateBaseForm } from "./create-base-form";

type CreatedBase = RouterOutputs["base"]["create"];

type NewBaseCardProps = {
  onCreated: (base: CreatedBase) => void;
};

export function NewBaseCard({ onCreated }: NewBaseCardProps) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const createBase = api.base.create.useMutation({
    onSuccess: async (base) => {
      await utils.base.list.invalidate();
      onCreated(base);
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[270px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/40 bg-white/[0.04] text-sm font-semibold text-white/80 transition hover:border-white/70 hover:bg-white/[0.08] hover:text-white"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl text-white/90">
          +
        </span>
        New base
      </button>
    );
  }

  return (
    <div className="flex h-[270px] flex-col rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.9)]">
      <h2 className="text-lg font-semibold text-white">Create a base</h2>
      <p className="mb-4 mt-1 text-sm text-slate-300/80">
        Choose a name, description, and accent color to match Airtable’s polish.
      </p>
      <CreateBaseForm
        onSubmit={async (values) => {
          if (createBase.isPending) return;
          await createBase.mutateAsync(values);
        }}
        onCancel={() => setOpen(false)}
        isSubmitting={createBase.isPending}
      />
    </div>
  );
}
