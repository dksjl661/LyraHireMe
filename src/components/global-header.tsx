"use client";

import { usePathname } from "next/navigation";
import { LyraLogo } from "./lyra-logo";

export function GlobalHeader() {
  const pathname = usePathname();

  // Don't show the header on the main landing page or dashboard pages (they have sidebar)
  if (pathname === "/" || pathname.startsWith("/bases")) {
    return null;
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-50">
      {/* Semi-transparent background for better readability */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="px-6 py-4">
          <LyraLogo variant="dark" size="md" />
        </div>
      </div>
    </header>
  );
}
