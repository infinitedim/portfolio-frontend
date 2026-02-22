import { Metadata } from "next";
import { JSX, Suspense } from "react";
import {
  getRoadmapDashboard,
  getRoadmapStreak,
  getRoadmapTeams,
  getRoadmapFavourites,
  type RoadmapDashboard,
  type RoadmapStreak,
  type RoadmapProgress,
} from "@/lib/data/data-fetching";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Roadmap Progress | Portfolio",
  description:
    "My learning progress across various technology roadmaps tracked on roadmap.sh",
  alternates: { canonical: "/roadmap" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function statusColor(p: number): string {
  if (p === 100) return "#10b981"; // green
  if (p >= 50) return "#3b82f6";  // blue
  if (p > 0) return "#f59e0b";    // amber
  return "#6b7280";               // gray
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components (server components, no "use client")
// ---------------------------------------------------------------------------

function StreakCard({ streak }: { streak: RoadmapStreak }): JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 font-mono">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-400">
        🔥 Streak
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Current", value: streak.count },
          { label: "Longest", value: streak.longestCount },
          { label: "Previous", value: streak.previousCount },
          { label: "Referrals", value: streak.refByUserCount },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="mt-1 text-xs text-neutral-400">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between text-xs text-neutral-500">
        <span>First visit: {formatDate(streak.firstVisitAt)}</span>
        <span>Last visit: {formatDate(streak.lastVisitAt)}</span>
      </div>
    </div>
  );
}

function ProgressRow({ p }: { p: RoadmapProgress }): JSX.Element {
  const percent = pct(p.done, p.total);
  const color = statusColor(percent);

  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4 font-mono">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <a
          href={`https://roadmap.sh/${p.resourceId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-white hover:underline"
        >
          {p.resourceTitle}
        </a>
        <span className="shrink-0 text-sm font-bold" style={{ color }}>
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-700">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>

      {/* Stats */}
      <div className="mt-2 flex gap-4 text-xs text-neutral-400">
        <span>
          ✅ <span className="text-neutral-200">{p.done}</span> done
        </span>
        {p.learning > 0 && (
          <span>
            📖 <span className="text-neutral-200">{p.learning}</span> learning
          </span>
        )}
        {p.skipped > 0 && (
          <span>
            ⏭ <span className="text-neutral-200">{p.skipped}</span> skipped
          </span>
        )}
        <span className="ml-auto">
          of <span className="text-neutral-200">{p.total}</span> topics
        </span>
      </div>

      {/* Updated */}
      <div className="mt-1 text-right text-xs text-neutral-600">
        updated {formatDate(p.updatedAt)}
      </div>
    </div>
  );
}

function DashboardSection({
  dashboard,
}: {
  dashboard: RoadmapDashboard;
}): JSX.Element {
  const totalDone = dashboard.progresses.reduce((s, p) => s + p.done, 0);
  const totalItems = dashboard.progresses.reduce((s, p) => s + p.total, 0);
  const overall = pct(totalDone, totalItems);

  // Sort: by progress descending
  const sorted = [...dashboard.progresses].sort(
    (a, b) => pct(b.done, b.total) - pct(a.done, a.total),
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 font-mono">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-400">
          📊 Overall Progress
        </h2>
        <div className="mb-3 flex items-center gap-4">
          <div className="text-5xl font-bold text-white">{overall}%</div>
          <div className="text-sm text-neutral-400">
            <div>
              <span className="text-white">{totalDone}</span> topics completed
            </div>
            <div>
              across{" "}
              <span className="text-white">{dashboard.progresses.length}</span>{" "}
              roadmaps
            </div>
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${overall}%` }}
          />
        </div>
      </div>

      {/* Individual roadmaps */}
      <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-neutral-400">
        Roadmaps ({dashboard.progresses.length})
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((p) => (
          <ProgressRow key={p.resourceId} p={p} />
        ))}
      </div>
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="rounded-lg border border-dashed border-neutral-700 p-10 text-center font-mono text-neutral-400">
      <div className="mb-2 text-3xl">🔌</div>
      <div className="text-sm">
        Backend unreachable — check{" "}
        <code className="text-neutral-200">ROADMAP_AUTH_TOKEN</code> in{" "}
        <code className="text-neutral-200">portfolio-backend/.env</code>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

async function RoadmapContent(): Promise<JSX.Element> {
  const [dashboard, streak, teams, favourites] = await Promise.all([
    getRoadmapDashboard(),
    getRoadmapStreak(),
    getRoadmapTeams(),
    getRoadmapFavourites(),
  ]);

  if (!dashboard) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4 font-mono">
        <div>
          <h1 className="text-xl font-bold text-white">{dashboard.name}</h1>
          <p className="text-sm text-neutral-400">
            @{dashboard.username} · {dashboard.headline}
          </p>
          {teams.length > 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              Teams: {teams.map((t) => t.name).join(", ")}
            </p>
          )}
          {favourites && favourites.weeklySubscriptions.length > 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              Weekly subscriptions: {favourites.weeklySubscriptions.length}
            </p>
          )}
        </div>
      </div>

      {/* Streak */}
      {streak && <StreakCard streak={streak} />}

      {/* Roadmap progress */}
      <DashboardSection dashboard={dashboard} />
    </div>
  );
}

export default function RoadmapPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Suspense
          fallback={
            <div className="font-mono text-sm text-neutral-400 animate-pulse">
              Loading roadmap data…
            </div>
          }
        >
          <RoadmapContent />
        </Suspense>
      </div>
    </div>
  );
}
