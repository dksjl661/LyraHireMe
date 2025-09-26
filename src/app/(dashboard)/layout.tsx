import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "~/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // const { userId } = await auth();

  // if (!userId) {
  //   redirect("/");
  // }

  return (
    <div className="h-screen bg-white text-gray-900">
      <Sidebar />
      <div className="h-full pl-64">{children}</div>
    </div>
  );
}
