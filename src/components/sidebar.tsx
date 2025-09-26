"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { LyraLogo } from "./lyra-logo";
import { api } from "~/trpc/react";

const UserButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => ({ default: mod.UserButton })),
  {
    ssr: false,
    loading: () => <div className="h-8 w-8 rounded-full bg-gray-300"></div>,
  },
);

export function Sidebar() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { data: bases = [] } = api.base.list.useQuery();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't show sidebar on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 z-40 h-full w-64 border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <LyraLogo variant="dark" size="md" />
      </div>

      {/* Navigation */}
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {/* Main Navigation */}
          <nav className="space-y-2">
            <Link
              href="/bases"
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/bases"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="text-base">🏠</div>
              Home
            </Link>
          </nav>

          {/* Bases Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Bases
              </h3>
              <Link
                href="/bases"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Create new base"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Link>
            </div>

            <div className="mt-2 space-y-1">
              {!isClient ? (
                // Loading state for SSR
                <div className="px-3 py-2 text-sm text-gray-500">
                  Loading...
                </div>
              ) : (
                <>
                  {bases.map((base) => {
                    const isActive = pathname.includes(`/bases/${base.id}`);
                    return (
                      <Link
                        key={base.id}
                        href={`/bases/${base.id}`}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: base.color }}
                        />
                        <span className="truncate">{base.name}</span>
                      </Link>
                    );
                  })}

                  {bases.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No bases yet
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
            <div className="flex-1 truncate">
              <div className="text-sm font-medium text-gray-900">User</div>
              <div className="text-xs text-gray-500">Free plan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
