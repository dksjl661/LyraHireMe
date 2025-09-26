import { HydrateClient, api } from "~/trpc/server";

import { BaseDashboard } from "./_components/base-dashboard";

// Force dynamic rendering to avoid database connection during build
export const dynamic = 'force-dynamic';

export default async function BasesPage() {
  await api.base.list.prefetch();

  return (
    <HydrateClient>
      <BaseDashboard />
    </HydrateClient>
  );
}
