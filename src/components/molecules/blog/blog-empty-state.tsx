import Link from "next/link";
import type { Route } from "next";

interface BlogEmptyStateProps {
  search?: string;
  tag?: string;
  series?: string;
  resetUrl: string;
  t: {
    blogNoPostsFound: string;
    blogNoPostsMessage: string;
    blogViewAllPosts: string;
  };
}

export function BlogEmptyState({
  search,
  tag,
  series,
  resetUrl,
  t,
}: BlogEmptyStateProps) {
  const isFiltered = Boolean(search || tag || series);

  return (
    <div className="relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 sm:p-14 text-center backdrop-blur-md overflow-hidden my-8 shadow-2xl">
      {/* Top emerald accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" />

      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#34d399_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.03] pointer-events-none" />
      {isFiltered ? (
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-xl font-bold font-mono text-white">
            $ grep --result=0
          </h3>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed font-mono">
            {t.blogNoPostsFound}{" "}
            {search && (
              <span className="text-white font-semibold">
                &ldquo;{search}&rdquo;
              </span>
            )}
            {search && (tag || series) && " in "}
            {tag && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-mono ml-1">
                #{tag}
              </span>
            )}
            {tag && series && " in "}
            {series && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-mono ml-1">
                series:{series}
              </span>
            )}
          </p>
          <div className="pt-2">
            <Link
              href={resetUrl as Route}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-400 text-neutral-950 font-mono text-sm font-semibold hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/10"
            >
              <span>$ clear --filters</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-5">
          <h3 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            $ cat /dev/null &gt; articles.log
          </h3>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            {t.blogNoPostsMessage}
          </p>
          <p className="text-neutral-500 text-xs sm:text-sm font-mono">
            Technical deep-dives, Rust/Axum architecture breakdowns, and Next.js
            16 engineering notes are currently being prepared in draft stage.
          </p>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-400 text-neutral-950 font-mono text-sm font-semibold hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/10"
            >
              <span>$ cd /projects</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-neutral-700 bg-neutral-800/60 hover:border-emerald-400/50 text-neutral-200 font-mono text-sm transition-colors"
            >
              <span>$ cat /about</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-neutral-700 bg-neutral-800/60 hover:border-emerald-400/50 text-neutral-200 font-mono text-sm transition-colors"
            >
              <span>$ send --message</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
