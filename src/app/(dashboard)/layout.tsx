import type { ReactNode } from "react";
import { Sidebar } from "~/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen bg-white text-gray-900">
      <Sidebar />
      <div className="h-full pl-64">{children}</div>
    </div>
  );
}
