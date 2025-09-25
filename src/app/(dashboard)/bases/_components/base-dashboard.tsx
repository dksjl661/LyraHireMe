"use client";

import { UserButton } from "@clerk/nextjs";
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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-6 rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_40px_90px_-40px_rgba(15,23,42,0.8)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80">
            Workspace
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            >
              Marketing site
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                },
              }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold text-white drop-shadow-sm sm:text-5xl">
            Your Airtable-inspired bases
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            Create gorgeous, color-coded bases just like Airtable and jump back in with a single
            click. Everything is organized, vibrant, and ready for collaboration.
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
