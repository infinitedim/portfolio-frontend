"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  type GitHubCommitSummary,
  type GitHubBranchResponse,
  type ParsedRepoUrl,
  parseGitHubUrl,
  fetchRepoCommits,
  fetchRepoBranches,
} from "@/lib/api/commit-service";
import { CommitDetailDrawer } from "./commit-detail-drawer";
import {
  GitCommit,
  GitBranch,
  Search,
  Terminal,
  LayoutList,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

interface ProjectCommitTrackerProps {
  repoUrl?: string;
  projectName: string;
}

export function ProjectCommitTracker({
  repoUrl,
  projectName,
}: ProjectCommitTrackerProps) {
  // Input URL state (defaults to repoUrl prop or fallback)
  const [urlInput, setUrlInput] = useState<string>(repoUrl || "");
  const [parsedRepo, setParsedRepo] = useState<ParsedRepoUrl | null>(() =>
    parseGitHubUrl(repoUrl || ""),
  );

  const [branches, setBranches] = useState<GitHubBranchResponse[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [commits, setCommits] = useState<GitHubCommitSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"cards" | "terminal">("cards");
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(
    null,
  );
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // Update parsed repo when urlInput changes
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseGitHubUrl(urlInput);
    if (!parsed) {
      setError(
        "Invalid GitHub repository URL. Format: https://github.com/owner/repo",
      );
      return;
    }
    setError(null);
    setParsedRepo(parsed);
    setSelectedBranch("");
  };

  // Load branches & initial commits when parsedRepo changes
  const loadRepoData = useCallback(async () => {
    if (!parsedRepo) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch branches
      const fetchedBranches = await fetchRepoBranches(
        parsedRepo.owner,
        parsedRepo.repo,
      );
      setBranches(fetchedBranches);

      const defaultBranch =
        fetchedBranches.find((b) => b.name === "main" || b.name === "master")
          ?.name ||
        fetchedBranches[0]?.name ||
        "";

      const branchToUse = selectedBranch || defaultBranch;

      // 2. Fetch commits
      const fetchedCommits = await fetchRepoCommits(
        parsedRepo.owner,
        parsedRepo.repo,
        branchToUse,
        1,
        30,
      );

      setCommits(fetchedCommits);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch repository commits",
      );
      setCommits([]);
    } finally {
      setLoading(false);
    }
  }, [parsedRepo, selectedBranch]);

  useEffect(() => {
    loadRepoData();
  }, [loadRepoData]);

  // Filter commits by search query
  const filteredCommits = useMemo(() => {
    if (!searchQuery.trim()) return commits;
    const q = searchQuery.toLowerCase();
    return commits.filter(
      (c) =>
        c.message.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q) ||
        c.shortSha.toLowerCase().includes(q),
    );
  }, [commits, searchQuery]);

  const copySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  if (!parsedRepo && !urlInput) {
    return null;
  }

  return (
    <section className="px-4 py-8 border-t border-neutral-800">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-mono text-xl font-bold text-white flex items-center gap-2.5">
              <span className="text-emerald-400">$</span> git log --tracker
            </h2>
            <p className="mt-1 text-xs text-neutral-400 font-mono">
              Live commit activity for{" "}
              <span className="text-neutral-200">{projectName}</span>
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/80 p-1">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              aria-label="Switch to Interactive Cards view"
              aria-pressed={viewMode === "cards"}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                viewMode === "cards"
                  ? "bg-emerald-400 text-neutral-950 font-semibold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <LayoutList
                size={14}
                aria-hidden="true"
              />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("terminal")}
              aria-label="Switch to Terminal log view"
              aria-pressed={viewMode === "terminal"}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                viewMode === "terminal"
                  ? "bg-emerald-400 text-neutral-950 font-semibold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Terminal
                size={14}
                aria-hidden="true"
              />
              Terminal
            </button>
          </div>
        </div>

        {/* Repository URL Input & Controls Toolbar */}
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-4">
          <form
            onSubmit={handleUrlSubmit}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="relative flex-1 min-w-65">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <GitCommit
                  size={14}
                  aria-hidden="true"
                />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://github.com/owner/repository"
                aria-label="GitHub Repository URL"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 py-2 pl-9 pr-3 font-mono text-xs placeholder-neutral-500 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-800 px-4 py-2 font-mono text-xs font-medium text-neutral-200 transition-colors duration-150 hover:bg-neutral-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Fetch Commits
            </button>
          </form>

          {/* Branch & Search Filter Bar */}
          {parsedRepo && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80 pt-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                {/* Branch selector */}
                {branches.length > 0 && (
                  <div className="flex items-center gap-2">
                    <GitBranch
                      size={14}
                      className="text-emerald-400"
                      aria-hidden="true"
                    />
                    <label
                      htmlFor="branch-select"
                      className="sr-only"
                    >
                      Select Repository Branch
                    </label>
                    <select
                      id="branch-select"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="rounded-md border border-neutral-800 bg-neutral-950/90 px-2.5 py-1 text-xs text-white font-mono transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    >
                      {branches.map((b) => (
                        <option
                          key={b.name}
                          value={b.name}
                        >
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Repo Identifier Tag */}
                <div className="inline-flex items-center gap-1.5 rounded bg-neutral-800/80 px-2.5 py-1 text-neutral-300">
                  <span>Repo:</span>
                  <span className="font-semibold text-emerald-400">
                    {parsedRepo.owner}/{parsedRepo.repo}
                  </span>
                </div>
              </div>

              {/* Search input */}
              <div className="relative min-w-50">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-neutral-500">
                  <Search
                    size={13}
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter commit message..."
                  aria-label="Filter commit messages"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-950/80 py-1 pl-8 pr-3 font-mono text-xs placeholder-neutral-500 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3 py-4">
            <div className="h-16 w-full animate-pulse rounded-lg bg-neutral-900" />
            <div className="h-16 w-full animate-pulse rounded-lg bg-neutral-900" />
            <div className="h-16 w-full animate-pulse rounded-lg bg-neutral-900" />
          </div>
        )}

        {/* Error Display */}
        {error && !loading && (
          <div className="flex items-center gap-3 rounded-lg border border-rose-800/50 bg-rose-950/20 p-4 font-mono text-xs text-rose-300">
            <AlertCircle
              size={16}
              className="shrink-0 text-rose-400"
            />
            <div>
              <p className="font-semibold">Unable to fetch commits</p>
              <p className="mt-0.5 opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Empty Search / No Commits */}
        {!loading && !error && filteredCommits.length === 0 && (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 py-12 text-center font-mono text-xs text-neutral-400">
            No commits found for the selected query.
          </div>
        )}

        {/* ── View 1: Interactive Cards View ────────────────────────────── */}
        {!loading &&
          !error &&
          viewMode === "cards" &&
          filteredCommits.length > 0 && (
            <div className="relative border-l-2 border-neutral-800 ml-3 pl-6 space-y-4">
              {filteredCommits.map((commit: GitHubCommitSummary) => (
                <article
                  key={commit.sha}
                  className="group relative rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 transition-all duration-200 hover:border-emerald-400/50 hover:bg-neutral-900"
                >
                  {/* Timeline node icon */}
                  <div className="absolute -left-7.75 top-5 flex h-4 w-4 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-emerald-400 group-hover:border-emerald-400 group-hover:bg-emerald-950">
                    <GitCommit
                      size={10}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-60">
                      {/* Commit Message */}
                      <p className="font-mono text-sm font-semibold text-white leading-snug">
                        {commit.message}
                      </p>

                      {/* Author & Timestamp */}
                      <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          {commit.authorAvatar ? (
                            <img
                              src={commit.authorAvatar}
                              alt={commit.authorName}
                              className="h-4 w-4 rounded-full border border-neutral-700"
                            />
                          ) : (
                            <span className="font-bold text-emerald-400">
                              {commit.authorName.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="text-neutral-300">
                            {commit.authorName}
                          </span>
                        </div>

                        <span>•</span>

                        <time
                          dateTime={commit.authorDate}
                          className="text-neutral-400"
                        >
                          <span aria-hidden="true">
                            {new Date(commit.authorDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span className="sr-only">
                            Committed on {commit.authorDate}
                          </span>
                        </time>
                      </div>
                    </div>

                    {/* SHA Badge & Actions */}
                    <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => copySha(commit.sha)}
                        aria-label={`Copy commit hash ${commit.shortSha}`}
                        className="inline-flex items-center gap-1 rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-neutral-400 transition-colors duration-150 hover:border-neutral-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        {copiedSha === commit.sha ? (
                          <Check
                            size={12}
                            className="text-emerald-400"
                          />
                        ) : (
                          <Copy size={12} />
                        )}
                        <span>{commit.shortSha}</span>
                      </button>

                      {/* Inspect File Diff Details Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedCommitSha(commit.sha)}
                        className="inline-flex items-center gap-1 rounded border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-emerald-400 font-medium transition-all duration-150 hover:bg-emerald-900/60 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <span>Details</span>
                        <ChevronRight
                          size={12}
                          aria-hidden="true"
                        />
                      </button>

                      <a
                        href={commit.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View commit ${commit.shortSha} on GitHub`}
                        className="p-1 text-neutral-500 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
                      >
                        <ExternalLink
                          size={14}
                          aria-hidden="true"
                        />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        {/* ── View 2: Terminal Output View ────────────────────────────── */}
        {!loading &&
          !error &&
          viewMode === "terminal" &&
          filteredCommits.length > 0 && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-300 overflow-x-auto">
              <div className="mb-3 text-neutral-500">
                $ git log --oneline --graph -n {filteredCommits.length}
              </div>

              <div className="space-y-2">
                {filteredCommits.map((c) => (
                  <div
                    key={c.sha}
                    className="flex flex-wrap items-baseline gap-2 hover:bg-neutral-900/80 px-2 py-1 rounded transition-colors duration-150"
                  >
                    <span className="text-emerald-400 font-semibold shrink-0">
                      * {c.shortSha}
                    </span>
                    <span className="text-white font-medium flex-1 min-w-50">
                      {c.message}
                    </span>
                    <span className="text-neutral-400 shrink-0">
                      ({c.authorName},{" "}
                      {new Date(c.authorDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      )
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCommitSha(c.sha)}
                      className="text-[11px] text-emerald-400 hover:underline shrink-0"
                    >
                      [diff]
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Expandable Commit File Diff Drawer */}
        {selectedCommitSha && parsedRepo && (
          <CommitDetailDrawer
            owner={parsedRepo.owner}
            repo={parsedRepo.repo}
            refSha={selectedCommitSha}
            onClose={() => setSelectedCommitSha(null)}
          />
        )}
      </div>
    </section>
  );
}
