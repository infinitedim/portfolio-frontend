"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  MinusCircle,
  GitCommit,
  Rocket,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { LenisScroll } from "@/components/layout/lenis-scroll";
import {
  fetchCommitCheckRuns,
  type GitHubCheckRunsResponse,
  type GitHubCheckRun,
} from "@/lib/api/commit-service";

interface DeployDetailDrawerProps {
  owner: string;
  repo: string;
  refSha: string | null;
  onClose: () => void;
}

export function DeployDetailDrawer({
  owner,
  repo,
  refSha,
  onClose,
}: DeployDetailDrawerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkRunsData, setCheckRunsData] =
    useState<GitHubCheckRunsResponse | null>(null);

  // Cooldown countdown timer for manual refresh (10 seconds)
  const [cooldown, setCooldown] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch check runs data
  const loadCheckRuns = useCallback(
    async (force: boolean = false) => {
      if (!refSha) return;
      if (force) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await fetchCommitCheckRuns(owner, repo, refSha, force);
        setCheckRunsData(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load deployment check runs.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [owner, repo, refSha],
  );

  useEffect(() => {
    if (refSha) {
      loadCheckRuns(false);
    }
  }, [refSha, loadCheckRuns]);

  // Handle manual refresh with 10-second cooldown
  const handleManualRefresh = () => {
    if (cooldown > 0 || refreshing) return;
    loadCheckRuns(true);
    setCooldown(10);
  };

  // Decrement cooldown timer every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock background body scrolling when modal is open
  useEffect(() => {
    if (refSha) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [refSha]);

  if (!refSha) return null;

  // Helper to render static status badge
  const renderStatusBadge = (run: GitHubCheckRun) => {
    if (run.status === "in_progress" || run.status === "queued") {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-amber-800/60 bg-amber-950/40 px-2 py-0.5 text-[10px] text-amber-400 font-medium font-mono">
          <Clock
            size={10}
            aria-hidden="true"
          />
          <span>Running</span>
        </span>
      );
    }

    const conclusion = run.conclusion?.toLowerCase() || "";

    if (conclusion === "success") {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-emerald-800/60 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-400 font-medium font-mono">
          <CheckCircle2
            size={10}
            aria-hidden="true"
          />
          <span>Success</span>
        </span>
      );
    }

    if (
      conclusion === "failure" ||
      conclusion === "timed_out" ||
      conclusion === "action_required"
    ) {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-rose-800/60 bg-rose-950/40 px-2 py-0.5 text-[10px] text-rose-400 font-medium font-mono">
          <XCircle
            size={10}
            aria-hidden="true"
          />
          <span>Failed</span>
        </span>
      );
    }

    if (conclusion === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-neutral-700/80 bg-neutral-900/80 px-2 py-0.5 text-[10px] text-neutral-400 font-medium font-mono">
          <Ban
            size={10}
            aria-hidden="true"
          />
          <span>Cancelled</span>
        </span>
      );
    }

    if (conclusion === "skipped") {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-sky-800/60 bg-sky-950/40 px-2 py-0.5 text-[10px] text-sky-400 font-medium font-mono">
          <MinusCircle
            size={10}
            aria-hidden="true"
          />
          <span>Skipped</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[10px] text-neutral-400 font-medium font-mono">
        <span>{conclusion || run.status}</span>
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-neutral-950/80 backdrop-blur-xs p-2 sm:p-4 transition-all duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deploy-detail-heading"
    >
      {/* Backdrop overlay (non-clickable: user must click explicit close button) */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
      />

      <aside className="relative flex h-full max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden z-10 font-mono">
        {/* Modal Header */}
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <Rocket
              className="h-5 w-5 text-emerald-400"
              aria-hidden="true"
            />
            <h2
              id="deploy-detail-heading"
              className="text-base font-bold text-white flex items-center gap-2"
            >
              Deployment & CI/CD Runs
              <span className="text-xs font-normal text-neutral-400">
                ({refSha.substring(0, 7)})
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Manual Refresh Button with 10s Cooldown */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={cooldown > 0 || refreshing || loading}
              aria-label="Refresh deployment check status"
              title={
                cooldown > 0
                  ? `Please wait ${cooldown}s before refreshing`
                  : "Refresh live check status"
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-300 transition-all duration-150 hover:border-emerald-400/50 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={12}
                className={refreshing ? "animate-spin text-emerald-400" : ""}
              />
              <span>{cooldown > 0 ? `Refresh (${cooldown}s)` : "Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close deployment details modal"
              className="rounded-lg p-1.5 text-neutral-400 transition-colors duration-150 hover:bg-neutral-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
            >
              <X
                size={18}
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        {/* Content Body with Lenis Scroll */}
        <LenisScroll
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-(--terminal-muted) hover:scrollbar-thumb-(--terminal-accent)"
          data-lenis-prevent
        >
          {/* Target Repo Info Banner */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <GitCommit
                  size={14}
                  className="text-emerald-400"
                />
                <span>Target Commit:</span>
                <code className="text-emerald-400 font-semibold">
                  {refSha.substring(0, 7)}
                </code>
              </span>
              <span>
                Repository:{" "}
                <strong className="text-neutral-200">
                  {owner}/{repo}
                </strong>
              </span>
            </div>
          </div>

          {/* Loading Phantom Skeleton State */}
          {loading && <DeployDetailPhantomSkeleton />}

          {/* Error Banner */}
          {!loading && error && (
            <div className="rounded-lg border border-rose-800/60 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle
                size={16}
                className="shrink-0 mt-0.5 text-rose-400"
              />
              <div>
                <p className="font-bold">Failed to load check runs</p>
                <p className="text-rose-400/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Authentic Unconfigured State (No CI Checks Configured) */}
          {!loading &&
            !error &&
            checkRunsData &&
            (checkRunsData.combinedState === "unconfigured" ||
              checkRunsData.totalCount === 0) && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-8 text-center space-y-3">
                <HelpCircle
                  size={32}
                  className="mx-auto text-neutral-500"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-bold text-neutral-200">
                  No CI/CD Pipeline Configured
                </h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                  This repository does not have active GitHub Actions or Vercel
                  deployment checks attached to commit{" "}
                  <code className="text-neutral-300">
                    {refSha.substring(0, 7)}
                  </code>
                  .
                </p>
                <div className="pt-2 text-[11px] text-neutral-500">
                  Tip: Add a{" "}
                  <code className="text-neutral-400">.github/workflows</code>{" "}
                  YAML or connect Vercel to trigger automated checks on future
                  commits.
                </div>
              </div>
            )}

          {/* Live CI/CD Workflow Runs List */}
          {!loading &&
            !error &&
            checkRunsData &&
            checkRunsData.totalCount > 0 && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-400 pb-1">
                  <span className="flex items-center gap-2">
                    <ShieldCheck
                      size={14}
                      className="text-emerald-400"
                    />
                    <span>
                      CI/CD Workflow Checks ({checkRunsData.totalCount})
                    </span>
                  </span>
                  <span className="text-[11px] text-neutral-500 capitalize">
                    State:{" "}
                    <strong className="text-emerald-400">
                      {checkRunsData.combinedState}
                    </strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {checkRunsData.checkRuns.map((run: GitHubCheckRun) => (
                    <div
                      key={run.id}
                      className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-4 space-y-2.5 transition-colors duration-150 hover:border-neutral-700"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white">
                          <Rocket
                            size={14}
                            className="text-emerald-400"
                          />
                          <span>{run.name}</span>
                        </div>
                        {renderStatusBadge(run)}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-neutral-400 border-t border-neutral-800/60">
                        <span className="text-neutral-400">
                          App:{" "}
                          <strong className="text-neutral-200">
                            {run.app.name}
                          </strong>
                        </span>

                        <a
                          href={run.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:underline hover:text-emerald-300 transition-colors duration-150"
                        >
                          <span>View Logs</span>
                          <ExternalLink
                            size={10}
                            aria-hidden="true"
                          />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </LenisScroll>
      </aside>
    </div>
  );
}

function DeployDetailPhantomSkeleton() {
  return (
    <div
      className="space-y-5 font-mono"
      aria-busy="true"
      aria-label="Loading deployment check runs"
    >
      {/* CI/CD Workflow Checks Section Phantom (3 Items) */}
      <div className="space-y-3">
        <div className="h-4 w-48 rounded bg-neutral-800/70 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-neutral-800/60 animate-pulse" />
                <div className="h-4 w-44 sm:w-56 rounded bg-neutral-800/70 animate-pulse" />
              </div>
              <div className="h-5 w-20 rounded-full bg-neutral-800/70 animate-pulse" />
            </div>

            <div className="h-3.5 w-5/6 rounded bg-neutral-800/50 animate-pulse" />

            <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
              <div className="h-3 w-28 rounded bg-neutral-800/50 animate-pulse" />
              <div className="h-3 w-16 rounded bg-neutral-800/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
