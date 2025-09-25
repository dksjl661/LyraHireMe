"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";
import { BaseCard } from "./base-card";
import { NewBaseCard } from "./new-base-card";

export function BaseDashboard() {
  const router = useRouter();
  const [bases = []] = api.base.list.useSuspenseQuery();

  const utils = api.useUtils();
  const deleteBase = api.base.delete.useMutation({
    onSuccess: async () => {
      await utils.base.invalidate();
    },
  });

  return (
    <div className="flex min-h-screen w-full flex-col gap-10 bg-white px-6 py-12">
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-semibold tracking-[0.35em] text-gray-500 uppercase">
            Workspace
          </span>
          <Link
            href="/"
            className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
          >
            Marketing site
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold text-gray-900 sm:text-5xl">
            Your Airtable-inspired bases
          </h1>
          <p className="max-w-2xl text-base text-gray-600">
            Create gorgeous, color-coded bases just like Airtable and jump back
            in with a single click. Everything is organized, vibrant, and ready
            for collaboration.
          </p>
        </div>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <NewBaseCard
          onCreated={(base) => {
            if (!base) return;
            router.push(`/bases/${base.id}`);
          }}
        />
        {bases.map((base) => (
          <BaseCard
            key={base.id}
            base={base}
            onOpen={() => router.push(`/bases/${base.id}`)}
            onDelete={() => deleteBase.mutate({ baseId: base.id })}
            isDeleting={
              deleteBase.isPending && deleteBase.variables?.baseId === base.id
            }
          />
        ))}
      </section>
    </div>
  );
}
