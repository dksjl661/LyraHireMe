import { HydrateClient, api } from "~/trpc/server";

import { BaseDetailView } from "./_components/base-detail-view";

type BaseDetailPageProps = {
  params: Promise<{ baseId: string }>;
};

export default async function BaseDetailPage({ params }: BaseDetailPageProps) {
  const { baseId } = await params;

  await Promise.all([
    api.base.get.prefetch({ baseId }),
    api.table.listByBase.prefetch({ baseId }),
  ]);

  return (
    <HydrateClient>
      <BaseDetailView baseId={baseId} />
    </HydrateClient>
  );
}
