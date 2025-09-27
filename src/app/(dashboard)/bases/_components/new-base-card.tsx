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
        className="flex h-[270px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-gray-300 bg-gray-50 text-sm font-semibold text-gray-600 transition hover:border-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white text-2xl text-gray-500">
          +
        </span>
        New base
      </button>
    );
  }

  return (
    <div className="flex h-[270px] flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-gray-900">Create a base</h2>
      <p className="mt-1 mb-4 text-sm text-gray-600">
        Choose a name, description, and accent color to match Airtable&rsquo;s polish.
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
