import { HydrateClient, api } from "~/trpc/server";

import { TableView } from "./_components/table-view";

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

type TablePageProps = {
  params: Promise<{ baseId: string; tableId: string }>;
};

export default async function TablePage({ params }: TablePageProps) {
  const { baseId, tableId } = await params;

  await Promise.all([
    api.base.get.prefetch({ baseId }),
    api.table.get.prefetch({ tableId }),
    api.table.getRecords.prefetch({ tableId, limit: 50 }),
  ]);
  

  return (
    <HydrateClient>
      <TableView baseId={baseId} tableId={tableId} />
    </HydrateClient>
  );
}
