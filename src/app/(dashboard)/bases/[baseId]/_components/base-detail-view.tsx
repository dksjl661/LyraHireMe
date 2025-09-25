"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";

import { BaseHeader } from "./base-header";
import { CreateTableCard } from "./create-table-card";
import { TableCard } from "./table-card";

type BaseDetailViewProps = {
  baseId: string;
};

export function BaseDetailView({ baseId }: BaseDetailViewProps) {
  const router = useRouter();
  const [base] = api.base.get.useSuspenseQuery({ baseId });
  const [tables] = api.table.listByBase.useSuspenseQuery({ baseId });

  const utils = api.useUtils();

  const deleteBase = api.base.delete.useMutation({
    onSuccess: async () => {
      await utils.base.list.invalidate();
      router.push("/bases");
    },
  });

  const deleteTable = api.table.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.base.get.invalidate({ baseId }),
        utils.table.listByBase.invalidate({ baseId }),
      ]);
    },
  });

  return (
    <div className="flex w-full flex-col gap-10 bg-white px-6 py-10">
      <div className="flex items-center gap-4">
        <Link
          href="/bases"
          className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold tracking-wide text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
        >
          ← All bases
        </Link>
      </div>

      <BaseHeader
        base={base}
        onDelete={() => deleteBase.mutate({ baseId })}
        isDeleting={deleteBase.isPending}
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <CreateTableCard
          baseColor={base.color}
          baseId={baseId}
          onCreated={(response) => {
            if (!response?.table) return;
            void utils.base.get.invalidate({ baseId });
            void utils.table.listByBase.invalidate({ baseId });
            router.push(`/bases/${baseId}/tables/${response.table.id}`);
          }}
        />
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            onOpen={() => router.push(`/bases/${baseId}/tables/${table.id}`)}
            onDelete={() => deleteTable.mutate({ tableId: table.id })}
            isDeleting={
              deleteTable.isPending &&
              deleteTable.variables?.tableId === table.id
            }
          />
        ))}
      </section>
    </div>
  );
}
