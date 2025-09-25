"use client";

import { useMemo, useState } from "react";

import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { createGradientPair } from "~/lib/color";

type CreateTableResult = RouterOutputs["table"]["create"];

type CreateTableCardProps = {
  baseId: string;
  baseColor: string;
  onCreated: (result: CreateTableResult) => void;
};

export function CreateTableCard({ baseId, baseColor, onCreated }: CreateTableCardProps) {
  const [name, setName] = useState("Tasks");
  const [primary, secondary] = useMemo(() => createGradientPair(baseColor), [baseColor]);

  const utils = api.useUtils();
  const createTable = api.table.create.useMutation({
    onSuccess: async (result) => {
      await utils.table.listByBase.invalidate({ baseId });
      onCreated(result);
      setName("Tasks");
    },
  });

  return (
    <article
      className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.9)]"
      style={{
        backgroundImage: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      }}
    >
      <h2 className="text-lg font-semibold text-white">
        Create a new table
      </h2>
      <p className="text-sm text-white/80">
        Spin up a fresh grid with Airtable-style default fields. You can rename and customize it
        later.
      </p>
      <form
        className="mt-2 flex flex-col gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!name.trim() || createTable.isPending) return;
          await createTable.mutateAsync({ baseId, name: name.trim() });
        }}
      >
        <div className="flex flex-col gap-2 text-sm">
          <label htmlFor="table-name" className="font-medium text-white/80">
            Table name
          </label>
          <input
            id="table-name"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 50))}
            maxLength={50}
            className="rounded-2xl border border-white/20 bg-white/20 px-4 py-2 font-medium text-slate-900 outline-none transition focus:border-white/60 focus:bg-white focus:ring-2 focus:ring-white/70"
            placeholder="Tasks"
          />
        </div>
        <button
          type="submit"
          disabled={createTable.isPending}
          className="mt-1 inline-flex items-center justify-center rounded-full bg-slate-900/90 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {createTable.isPending ? "Creating…" : "Create table"}
        </button>
      </form>
    </article>
  );
}
