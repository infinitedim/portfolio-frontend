"use client";

import { useEffect, useCallback } from "react";
import {
  X,
  CheckCircle2,
  GitCommit,
  Rocket,
  ShieldCheck,
  Server,
  Terminal,
} from "lucide-react";
import { LenisScroll } from "@/components/layout/lenis-scroll";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-neutral-950/80 backdrop-blur-xs p-2 sm:p-4 transition-all duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deploy-detail-heading"
    >
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative flex h-full max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden z-10 font-mono">
        {/* Modal Header */}
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <Rocket className="h-5 w-5 text-emerald-400" aria-hidden="true" />
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

          <button
            type="button"
            onClick={onClose}
            aria-label="Close deployment details modal"
            className="rounded-lg p-2 text-neutral-400 transition-colors duration-150 hover:bg-neutral-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {/* Content Body with Lenis Scroll */}
        <LenisScroll
          className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-(--terminal-muted) hover:scrollbar-thumb-(--terminal-accent)"
          data-lenis-prevent
        >
          {/* Target Repo Info Banner */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <GitCommit size={14} className="text-emerald-400" />
                <span>Target Commit:</span>
                <code className="text-emerald-400 font-semibold">{refSha.substring(0, 7)}</code>
              </span>
              <span>Repository: <strong className="text-neutral-200">{owner}/{repo}</strong></span>
            </div>
          </div>

          {/* Placeholder Section: CI/CD Workflow Runs List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>CI/CD Workflow Checks</span>
            </h3>

            {/* Workflow Item 1: Vercel Deploy */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Rocket size={14} className="text-emerald-400" />
                  <span>Vercel Production Deployment</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded border border-emerald-800/60 bg-emerald-950/50 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 size={10} />
                  <span>Deploy Success</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Frontend edge deployment built and promoted to production origin.
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-500 border-t border-neutral-800/60">
                <span>Environment: <strong className="text-neutral-300">Production</strong></span>
                <span>Duration: 42s</span>
              </div>
            </div>

            {/* Workflow Item 2: GitHub Actions CI */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Terminal size={14} className="text-emerald-400" />
                  <span>GitHub Actions — Rust & TS Test Suite</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded border border-emerald-800/60 bg-emerald-950/50 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 size={10} />
                  <span>Passed</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Cargo clippy, unit tests, and TypeScript type checks completed with 0 errors.
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-500 border-t border-neutral-800/60">
                <span>Runner: <strong className="text-neutral-300">ubuntu-latest</strong></span>
                <span>Duration: 1m 12s</span>
              </div>
            </div>

            {/* Workflow Item 3: GCP Cloud Run Service */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Server size={14} className="text-emerald-400" />
                  <span>GCP Cloud Run Service Revision</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded border border-emerald-800/60 bg-emerald-950/50 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 size={10} />
                  <span>Active</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Axum API binary deployed to asia-southeast2 container instance.
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-neutral-500 border-t border-neutral-800/60">
                <span>Region: <strong className="text-neutral-300">asia-southeast2</strong></span>
                <span>Duration: 55s</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 p-3 text-[11px] text-neutral-400 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>
              CI/CD deployment UI scaffolded. Live check-run details will be connected in future planning.
            </span>
          </div>
        </LenisScroll>
      </aside>
    </div>
  );
}
