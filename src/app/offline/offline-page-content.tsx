"use client";

import Link from "next/link";
import type { JSX } from "react";

export function OfflinePageContent(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 font-mono text-green-400">
      <h1 className="text-xl">You are offline</h1>
      <p className="mt-3 max-w-md text-center text-sm text-neutral-500">
        This page is available without a network connection. Reconnect to browse
        the full portfolio or open the terminal.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded border border-green-400/40 bg-green-400/10 px-4 py-2 text-xs transition-colors hover:bg-green-400/20"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded border border-neutral-700 px-4 py-2 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-green-400"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
