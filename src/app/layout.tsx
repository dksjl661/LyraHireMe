import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "~/styles/globals.css";

import { GlobalHeader } from "~/components/global-header";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lyra - Modern Airtable Alternative",
  description:
    "Build powerful databases and organize your data with Lyra, the modern alternative to Airtable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} bg-white text-gray-900 antialiased`}
        >
          <Providers>
            <GlobalHeader />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
