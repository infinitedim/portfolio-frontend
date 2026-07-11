import Link from "next/link";
import type { JSX } from "react";

export function TerminalLockedTeaser(): JSX.Element {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-black px-4 font-mono text-green-400"
    >
      {/* view-source: the terminal is locked — find the path from /terminal */}
      <div className="max-w-lg text-center">
        <h1 className="text-lg">Terminal locked</h1>
        <p className="mt-3 text-sm text-neutral-400">
          Complete the gate puzzles to access the interactive terminal.
        </p>
        <p className="mt-6 text-xs text-neutral-400">
          <Link
            href="/gate"
            className="underline hover:text-green-400"
          >
            Return to gate
          </Link>
        </p>
        {/* puzzle hint: continue from here with the right referer */}
        <p className="sr-only">
          <Link href="/gate/3">Continue to level 3</Link>
        </p>
        <a
          href="/gate/3"
          className="mt-8 inline-block rounded border border-green-400/30 px-4 py-2 text-xs text-green-400/80 hover:border-green-400/60"
        >
          Continue
        </a>
      </div>
    </main>
  );
}
