"use client";

import { useEffect, useState, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import {
  type GitHubCommitSummary,
  type GitHubBranchResponse,
  type ParsedRepoUrl,
  parseGitHubUrl,
  fetchRepoCommits,
  fetchRepoBranches,
} from "@/lib/api/commit-service";
import { CommitDetailDrawer } from "./commit-detail-drawer";
import { DeployDetailDrawer } from "./deploy-detail-drawer";
import { GitGraphColumn, BranchLabel } from "@/components/molecules/projects/git-graph-column";
import {
  computeGraphLayout,
  buildBranchRefsMap,
  type GraphLayout,
} from "@/lib/git-graph";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitCommit,
  GitBranch,
  Search,
  Terminal,
  LayoutList,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  RefreshCw,
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

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"cards" | "terminal">("cards");
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(
    null,
  );
  const [selectedDeploySha, setSelectedDeploySha] = useState<string | null>(
    null,
  );
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // Git graph layout constants
  const GRAPH_LANE_WIDTH = 20;
  const GRAPH_ROW_HEIGHT_CARDS = 88; // ~height of a commit card + gap
  const GRAPH_ROW_HEIGHT_TERMINAL = 32; // ~height of a terminal row


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

  // Load branches & initial 10 commits when parsedRepo / selectedBranch changes
  const loadRepoData = useCallback(async () => {
    if (!parsedRepo) return;

    setLoading(true);
    setError(null);
    setPage(1);
    setHasMore(true);

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

      if (!selectedBranch && defaultBranch) {
        setSelectedBranch(defaultBranch);
      }

      // 2. Fetch initial 10 commits (compare against defaultBranch for feature branches)
      const fetchedCommits = await fetchRepoCommits(
        parsedRepo.owner,
        parsedRepo.repo,
        branchToUse,
        1,
        10,
        defaultBranch,
      );

      setCommits(fetchedCommits);
      setHasMore(fetchedCommits.length >= 10);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch repository commits",
      );
      setCommits([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [parsedRepo, selectedBranch]);

  // Load next batch of 10 commits
  const handleLoadMore = async () => {
    if (!parsedRepo || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    const defaultBranch =
      branches.find((b) => b.name === "main" || b.name === "master")?.name ||
      branches[0]?.name ||
      "";

    try {
      const newCommits = await fetchRepoCommits(
        parsedRepo.owner,
        parsedRepo.repo,
        selectedBranch || defaultBranch,
        nextPage,
        10,
        defaultBranch,
      );

      if (newCommits.length === 0) {
        setHasMore(false);
      } else {
        setCommits((prev) => {
          const existingShas = new Set(prev.map((c) => c.sha));
          const uniqueNew = newCommits.filter((c) => !existingShas.has(c.sha));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        if (newCommits.length < 10) {
          setHasMore(false);
        }
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

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

  // Dynamic card position measurement
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [nodeYMap, setNodeYMap] = useState<Map<string, number>>(new Map());

  // Measure dynamic DOM card Y positions to align graph nodes with 100% accuracy
  useLayoutEffect(() => {
    if (viewMode !== "cards" || !cardsContainerRef.current) return;
    const container = cardsContainerRef.current;

    const measure = () => {
      const cardElements = container.querySelectorAll<HTMLElement>("[data-commit-sha]");
      if (cardElements.length === 0) return;

      const newMap = new Map<string, number>();
      cardElements.forEach((el) => {
        const sha = el.getAttribute("data-commit-sha");
        if (sha) {
          // 26px offset aligns graph node with card header title line
          const nodeY = el.offsetTop + 26;
          newMap.set(sha, nodeY);
        }
      });

      setNodeYMap((prev) => {
        if (prev.size !== newMap.size) return newMap;
        for (const [k, v] of newMap) {
          if (Math.abs((prev.get(k) ?? -1) - v) > 1) {
            return newMap;
          }
        }
        return prev;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);

    // Also observe each individual card for multiline text wrapping
    const cardElements = container.querySelectorAll<HTMLElement>("[data-commit-sha]");
    cardElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [filteredCommits, viewMode]);

  // Compute graph layout from commits + branch refs
  const graphLayout = useMemo<GraphLayout | null>(() => {
    if (filteredCommits.length === 0) return null;
    const branchRefsMap = buildBranchRefsMap(branches);
    return computeGraphLayout(filteredCommits, branchRefsMap, {
      laneWidth: GRAPH_LANE_WIDTH,
      rowHeight: viewMode === "cards" ? GRAPH_ROW_HEIGHT_CARDS : GRAPH_ROW_HEIGHT_TERMINAL,
      nodeYOffset: viewMode === "cards" ? 26 : 16,
      customNodeYMap: viewMode === "cards" && nodeYMap.size > 0 ? nodeYMap : undefined,
    });
  }, [filteredCommits, branches, viewMode, nodeYMap]);

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
                disabled
                className="w-full rounded-lg border border-neutral-800/80 bg-neutral-950/40 py-2 pl-9 pr-3 font-mono text-xs text-neutral-400 opacity-75 cursor-not-allowed select-none"
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
                {/* Branch selection using custom Select component */}
                {branches.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <GitBranch
                      size={14}
                      className="text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                    <Select
                      value={selectedBranch}
                      onValueChange={(val) => setSelectedBranch(val)}
                    >
                      <SelectTrigger
                        aria-label="Select Repository Branch"
                        className="h-7 w-auto min-w-35 max-w-65 border-neutral-800 bg-neutral-950/90 px-2.5 py-1 text-xs text-white font-mono transition-all duration-150 hover:border-neutral-700 focus:ring-1 focus:ring-emerald-400"
                      >
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent className="border-neutral-800 bg-neutral-950 text-white font-mono">
                        {branches.map((b) => (
                          <SelectItem
                            key={b.name}
                            value={b.name}
                            className="text-xs font-mono focus:bg-neutral-900 focus:text-emerald-400"
                          >
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

        {/* Loading Phantom Skeleton */}
        {loading && <CommitTrackerPhantomSkeleton />}

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
            <div className="flex">
              {/* Git Graph Column (hidden on mobile) */}
              {graphLayout && (
                <GitGraphColumn
                  layout={graphLayout}
                  rowHeight={GRAPH_ROW_HEIGHT_CARDS}
                  laneWidth={GRAPH_LANE_WIDTH}
                  onNodeClick={(sha) => setSelectedCommitSha(sha)}
                />
              )}

              <div ref={cardsContainerRef} className="relative flex-1 space-y-4 pl-7 sm:pl-8">
              {/* Vertical timeline track line in the left gutter (mobile fallback) */}
              <div
                className="absolute top-4 bottom-4 left-3 sm:left-3.5 w-0.5 bg-neutral-800 sm:hidden"
                aria-hidden="true"
              />

              {filteredCommits.map((commit: GitHubCommitSummary) => (
                <div
                  key={commit.sha}
                  data-commit-sha={commit.sha}
                  className="group relative"
                >
                  {/* Timeline node icon in the left gutter (mobile fallback) */}
                  <div className="absolute -left-5.25 sm:-left-6.25 top-5 flex h-4 w-4 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-emerald-400 group-hover:border-emerald-400 group-hover:bg-emerald-950 z-10 sm:hidden">
                    <GitCommit
                      size={10}
                      aria-hidden="true"
                    />
                  </div>

                  <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 transition-all duration-200 group-hover:border-emerald-400/50 group-hover:bg-neutral-900">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-60">
                        {/* Commit Message */}
                    <p className="font-mono text-sm font-semibold text-white leading-snug">
                          {commit.message}
                          {/* Branch ref labels on branch tip commits */}
                          {graphLayout && (() => {
                            const node = graphLayout.nodes.get(commit.sha);
                            if (node && node.branchRefs.length > 0) {
                              return (
                                <BranchLabel
                                  branchNames={node.branchRefs}
                                  color={node.branchColor}
                                />
                              );
                            }
                            return null;
                          })()}
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

                          <span className="mx-1 text-neutral-700">|</span>

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
                          {/* Deploy / CI Status Button */}
                          {commit.statusState === "unconfigured" ? (
                            <button
                              type="button"
                              onClick={() => setSelectedDeploySha(commit.sha)}
                              aria-label={`View CI status for commit ${commit.shortSha}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 transition-all duration-150 hover:border-neutral-700 hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                            >
                              <span>No CI Checks</span>
                            </button>
                          ) : commit.statusState === "failure" ? (
                            <button
                              type="button"
                              onClick={() => setSelectedDeploySha(commit.sha)}
                              aria-label={`View failed CI status for commit ${commit.shortSha}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-rose-800/60 bg-rose-950/40 px-2.5 py-0.5 text-[10px] font-mono font-medium text-rose-400 transition-all duration-150 hover:border-rose-500 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                            >
                              <span>Deploy Failed</span>
                            </button>
                          ) : commit.statusState === "running" ? (
                            <button
                              type="button"
                              onClick={() => setSelectedDeploySha(commit.sha)}
                              aria-label={`View running CI status for commit ${commit.shortSha}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/60 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-mono font-medium text-amber-400 transition-all duration-150 hover:border-amber-500 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                            >
                              <span>Running</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedDeploySha(commit.sha)}
                              aria-label={`View deployment runs for commit ${commit.shortSha}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-mono font-medium text-emerald-400 transition-all duration-150 hover:border-emerald-500 hover:bg-emerald-900/60 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                            >
                              <CheckCircle2 size={11} aria-hidden="true" />
                              <span>Deploy Success</span>
                            </button>
                          )}
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
                          <span>View Diff</span>
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
                </div>
              ))}
              </div>
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

              <div className="flex">
                {/* Git Graph Column for terminal (hidden on mobile) */}
                {graphLayout && (
                  <GitGraphColumn
                    layout={graphLayout}
                    rowHeight={GRAPH_ROW_HEIGHT_TERMINAL}
                    laneWidth={GRAPH_LANE_WIDTH}
                    onNodeClick={(sha) => setSelectedCommitSha(sha)}
                    terminalMode
                  />
                )}

                <div className="flex-1 space-y-0">
                {filteredCommits.map((c) => {
                  const node = graphLayout?.nodes.get(c.sha);
                  return (
                  <div
                    key={c.sha}
                    className="flex flex-wrap items-baseline gap-2 hover:bg-neutral-900/80 px-2 rounded transition-colors duration-150"
                    style={{ height: GRAPH_ROW_HEIGHT_TERMINAL, alignItems: "center" }}
                  >
                    <span className="text-emerald-400 font-semibold shrink-0">
                      {c.shortSha}
                    </span>
                    {/* Branch ref labels in terminal view */}
                    {node && node.branchRefs.length > 0 && (
                      <BranchLabel
                        branchNames={node.branchRefs}
                        color={node.branchColor}
                      />
                    )}
                    <span className="text-white font-medium flex-1 min-w-50 truncate">
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
                  );
                })}
                </div>
              </div>
            </div>
          )}

        {/* Load More Commits Button */}
        {!loading &&
          !error &&
          filteredCommits.length > 0 &&
          hasMore &&
          !searchQuery && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-5 py-2.5 font-mono text-xs font-medium text-neutral-300 transition-all duration-200 hover:border-emerald-400/50 hover:bg-neutral-900 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw
                      size={14}
                      className="animate-spin text-emerald-400"
                    />
                    <span>Loading more commits...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown
                      size={14}
                      className="text-emerald-400"
                    />
                    <span>Load More Commits</span>
                  </>
                )}
              </button>
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

        {/* Expandable Deployment CI/CD Runs Drawer (Scaffold) */}
        {selectedDeploySha && parsedRepo && (
          <DeployDetailDrawer
            owner={parsedRepo.owner}
            repo={parsedRepo.repo}
            refSha={selectedDeploySha}
            onClose={() => setSelectedDeploySha(null)}
          />
        )}
      </div>
    </section>
  );
}

function CommitTrackerPhantomSkeleton() {
  return (
    <div
      className="relative space-y-4 pl-7 sm:pl-8 font-mono"
      aria-busy="true"
      aria-label="Loading repository commits"
    >
      {/* Vertical timeline track line */}
      <div
        className="absolute top-4 bottom-4 left-3 sm:left-3.5 w-0.5 bg-neutral-800"
        aria-hidden="true"
      />

      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="group relative"
        >
          {/* Timeline node icon placeholder */}
          <div className="absolute -left-5.25 sm:-left-6.25 top-5 flex h-4 w-4 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 z-10">
            <div className="h-1.5 w-1.5 rounded-full bg-neutral-700 animate-pulse" />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2 flex-1 min-w-60">
                {/* Commit message line */}
                <div className="h-5 w-4/5 animate-pulse rounded bg-neutral-800/70" />

                {/* Author & Timestamp info */}
                <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-800 animate-pulse" />
                  <div className="h-3.5 w-28 rounded bg-neutral-800/60 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-neutral-800/50 animate-pulse" />
                  <div className="h-5 w-20 rounded-full bg-neutral-800/70 animate-pulse" />
                </div>
              </div>

              {/* SHA Hash & Action buttons */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 rounded bg-neutral-800/70 animate-pulse" />
                <div className="h-6 w-20 rounded bg-neutral-800/70 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
