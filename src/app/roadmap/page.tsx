import { Metadata } from "next";
import { headers } from "next/headers";
import { JSX, Suspense } from "react";
import {
  getRoadmapDashboardWithError,
  getRoadmapStreak,
  getRoadmapTeams,
  getRoadmapFavourites,
  type RoadmapDashboard,
  type RoadmapStreak,
  type RoadmapProgress,
  type RoadmapFetchError,
} from "@/lib/data/data-fetching";
import Link from "next/link";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { PageHeader } from "@/components/atoms/shared/page-header";
import {
  Flame,
  CheckCircle2,
  BookOpen,
  SkipForward,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Roadmap Progress | Portfolio",
  description:
    "My learning progress across various technology roadmaps tracked on roadmap.sh",
  alternates: { canonical: "/roadmap" },
};

function pct(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function statusColor(p: number): string {
  if (p === 100) return "#10b981";
  if (p >= 50) return "#3b82f6";
  if (p > 0) return "#f59e0b";
  return "#6b7280";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StreakCard({ streak }: { streak: RoadmapStreak }): JSX.Element {
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 font-mono">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
        <Flame
          size={16}
          className="text-orange-500"
        />{" "}
        Streak
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Current", value: streak.count },
          { label: "Longest", value: streak.longestCount },
          { label: "Previous", value: streak.previousCount },
          { label: "Referrals", value: streak.refByUserCount },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="text-center"
          >
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="mt-1 text-xs text-neutral-400">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between text-xs text-neutral-400">
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
      {}
      <div className="mb-2 flex items-start justify-between gap-2">
        <a
          href={`https://roadmap.sh/${p.resourceId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-white hover:underline"
        >
          {p.resourceTitle}
        </a>
        <span
          className="shrink-0 text-sm font-bold"
          style={{ color }}
        >
          {percent}%
        </span>
      </div>

      {}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-700">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>

      {}
      <div className="mt-2 flex gap-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <CheckCircle2
            size={12}
            className="text-emerald-500"
          />{" "}
          <span className="text-neutral-200">{p.done}</span> done
        </span>
        {p.learning > 0 && (
          <span className="flex items-center gap-1">
            <BookOpen
              size={12}
              className="text-sky-500"
            />{" "}
            <span className="text-neutral-200">{p.learning}</span> learning
          </span>
        )}
        {p.skipped > 0 && (
          <span className="flex items-center gap-1">
            <SkipForward
              size={12}
              className="text-neutral-400"
            />{" "}
            <span className="text-neutral-200">{p.skipped}</span> skipped
          </span>
        )}
        <span className="ml-auto">
          of <span className="text-neutral-200">{p.total}</span> topics
        </span>
      </div>

      {}
      <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
        <span>updated {formatDate(p.updatedAt)}</span>
        <Link
          href={`/roadmap/${p.resourceId}`}
          className="flex items-center gap-1 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 font-semibold text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white"
        >
          Detail
          <ArrowRight size={12} />
        </Link>
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

  const sorted = [...dashboard.progresses].sort(
    (a, b) => pct(b.done, b.total) - pct(a.done, a.total),
  );

  return (
    <div className="space-y-4">
      {}
      <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5 font-mono">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-400">
          Overall Progress
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

      {}
      <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-neutral-400">
        Roadmaps ({dashboard.progresses.length})
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((p) => (
          <ProgressRow
            key={p.resourceId}
            p={p}
          />
        ))}
      </div>
    </div>
  );
}

function roadmapEmptyMessage(error: RoadmapFetchError | null): JSX.Element {
  const msg = error?.message ?? "";
  const isProduction = process.env.NODE_ENV === "production";

  if (msg.includes("ROADMAP_EMAIL/PASSWORD not configured")) {
    return (
      <>
        Roadmap credentials missing — set{" "}
        <code className="text-neutral-200">ROADMAP_EMAIL</code> /{" "}
        <code className="text-neutral-200">ROADMAP_PASSWORD</code> in Cloud Run
        Secret Manager, then redeploy the backend service.
      </>
    );
  }

  if (msg.includes("roadmap.sh") || msg.includes("login request failed")) {
    return (
      <>
        Cloud Run cannot reach{" "}
        <code className="text-neutral-200">roadmap.sh</code> (outbound internet
        blocked). Run{" "}
        <code className="text-neutral-200">
          gcloud run services update portfolio-backend --region=asia-southeast2
          --vpc-egress=private-ranges-only
        </code>{" "}
        then verify{" "}
        <code className="text-neutral-200">/api/roadmap/dashboard</code> returns
        200.
      </>
    );
  }

  if (error?.status === 502 || error?.status === 504) {
    return (
      <>
        Roadmap proxy error ({error.status}) — backend is up (pageview works)
        but upstream failed. Check Cloud Run logs and roadmap credentials.
      </>
    );
  }

  return (
    <>
      Could not load roadmap data
      {msg ? (
        <>
          {" "}
          — <span className="text-neutral-300">{msg}</span>
        </>
      ) : null}
      {isProduction ? (
        <>
          {" "}
          Confirm <code className="text-neutral-200">BACKEND_URL</code> on
          Vercel Production matches Cloud Run.
        </>
      ) : (
        <>
          {" "}
          Check <code className="text-neutral-200">portfolio-backend/.env</code>
          .
        </>
      )}
    </>
  );
}

function EmptyState({
  error,
}: {
  error: RoadmapFetchError | null;
}): JSX.Element {
  return (
    <div className="rounded-lg border border-dashed border-neutral-700 p-10 text-center font-mono text-neutral-400">
      <div className="mb-2 text-3xl"></div>
      <div className="text-sm">{roadmapEmptyMessage(error)}</div>
    </div>
  );
}

async function RoadmapContent(): Promise<JSX.Element> {
  // Request-time data (roadmap.sh proxy); avoids build-time SSG timeout with cacheComponents.
  await headers();

  const dashboardResult = await getRoadmapDashboardWithError();
  const dashboard = dashboardResult.data;
  if (!dashboard) return <EmptyState error={dashboardResult.error} />;

  const [streak, teams, favourites] = await Promise.all([
    getRoadmapStreak(),
    getRoadmapTeams(),
    getRoadmapFavourites(),
  ]);

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center gap-4 font-mono">
        <div>
          <h1 className="text-xl font-bold text-white">{dashboard.name}</h1>
          <p className="text-sm text-neutral-400">
            @{dashboard.username} · {dashboard.headline}
          </p>
          {teams.length > 0 && (
            <p className="mt-1 text-xs text-neutral-400">
              Teams: {teams.map((t) => t.name).join(", ")}
            </p>
          )}
          {favourites && favourites.weeklySubscriptions.length > 0 && (
            <p className="mt-1 text-xs text-neutral-400">
              Weekly subscriptions: {favourites.weeklySubscriptions.length}
            </p>
          )}
        </div>
      </div>

      {}
      {streak && <StreakCard streak={streak} />}

      {}
      <DashboardSection dashboard={dashboard} />
    </div>
  );
}

export default function RoadmapPage(): JSX.Element {
  return (
    <StandardPageLayout>
      <div className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <PageHeader
            title="roadmap"
            description="My learning progress across various technology roadmaps tracked on roadmap.sh"
          />
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
    </StandardPageLayout>
  );
}
