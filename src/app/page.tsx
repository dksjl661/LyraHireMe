import Link from "next/link";

import {
  SignedOut,
  SignInButton,
  SignedIn,
  SignOutButton,
  SignUpButton,
} from "@clerk/nextjs";

import { LyraLogo } from "~/components/lyra-logo";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-sky-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.45),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-[-20%] top-[-18rem] -z-10 h-[32rem] rounded-full bg-sky-200/60 blur-3xl" />

      {/* Header with Lyra logo */}
      <header className="relative z-10 px-6 py-6">
        <LyraLogo variant="dark" size="lg" />
      </header>

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16">
        <section className="w-full rounded-3xl bg-white/70 p-10 shadow-xl ring-1 shadow-sky-200/60 ring-white/60 backdrop-blur-lg sm:p-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1 text-sm font-medium text-sky-700">
            <span className="size-2 rounded-full bg-sky-500" aria-hidden />
            Lyra Airtable: The modern Airtable alternative
          </span>

          <h1 className="mt-6 text-4xl leading-tight font-semibold text-slate-900 sm:text-5xl">
            Build your Airtable here mate!
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Stay organized, collaborate instantly, and keep your data glowing.
            Sign in to access your personalized Lyra Airtable dashboard, or
            create a new account to get started in moments.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-sky-300/50 transition duration-200 hover:shadow-xl hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                  <span
                    className="absolute inset-0 translate-y-full bg-white/20 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
                    aria-hidden
                  />
                  <span className="relative">Sign In</span>
                </button>
              </SignInButton>
              <div className="ml-1 inline-flex items-center gap-1 text-sm text-slate-500">
                <span>No account yet?</span>
                <SignUpButton mode="modal" fallbackRedirectUrl="/">
                  <span className="cursor-pointer font-semibold text-sky-600 transition hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                    Create one
                  </span>
                </SignUpButton>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/bases"
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-400"
                >
                  Open your bases
                </Link>
                <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                  <button className="inline-flex items-center justify-center rounded-full border border-sky-200/80 bg-white/80 px-6 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            </SignedIn>
          </div>
        </section>

        <footer className="mt-12 text-center text-sm text-slate-500">
          Need a tour? Check out the resources in your dashboard after signing
          in.
        </footer>
      </div>
    </main>
  );
}
