"use client";

import { useEffect, useState, useCallback } from "react";
import {
  type GitHubCommitDetail,
  type GitHubCommitFile,
  fetchCommitDetail,
} from "@/lib/api/commit-service";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  ChevronDown,
  ChevronRight,
  GitCommit,
} from "lucide-react";

interface CommitDetailDrawerProps {
  owner: string;
  repo: string;
  refSha: string | null;
  onClose: () => void;
}

export function CommitDetailDrawer({
  owner,
  repo,
  refSha,
  onClose,
}: CommitDetailDrawerProps) {
  const [detail, setDetail] = useState<GitHubCommitDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(
    {},
  );

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

  useEffect(() => {
    if (!refSha || !owner || !repo) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadCommitDetail = async () => {
      try {
        const data = await fetchCommitDetail(owner, repo, refSha);
        if (!isMounted) return;
        setDetail(data);

        // Expand first 3 files by default if patches exist
        const initialExpanded: Record<string, boolean> = {};
        if (data.files) {
          data.files.slice(0, 3).forEach((f) => {
            initialExpanded[f.filename] = true;
          });
        }
        setExpandedFiles(initialExpanded);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load commit detail",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadCommitDetail();

    return () => {
      isMounted = false;
    };
  }, [owner, repo, refSha]);

  if (!refSha) return null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignore
    }
  };

  const toggleFileExpand = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  const renderFileStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let badgeClass = "bg-neutral-800 text-neutral-400 border-neutral-700";
    let label = status;

    if (s === "added") {
      badgeClass = "bg-emerald-950/60 text-emerald-400 border-emerald-800/50";
      label = "added";
    } else if (s === "modified") {
      badgeClass = "bg-blue-950/60 text-blue-400 border-blue-800/50";
      label = "modified";
    } else if (s === "removed" || s === "deleted") {
      badgeClass = "bg-rose-950/60 text-rose-400 border-rose-800/50";
      label = "removed";
    }

    return (
      <span
        className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase ${badgeClass}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-neutral-950/80 backdrop-blur-xs p-2 sm:p-4 transition-all duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="commit-detail-heading"
    >
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative flex h-full max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <GitCommit className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            <h2
              id="commit-detail-heading"
              className="font-mono text-base font-bold text-white flex items-center gap-2"
            >
              Commit Details
              <span className="text-xs font-normal text-neutral-400 font-mono">
                ({refSha.substring(0, 7)})
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close commit details modal"
            className="rounded-lg p-2 text-neutral-400 transition-colors duration-150 hover:bg-neutral-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading && (
            <div className="space-y-4 py-8">
              <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-800" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-800" />
              <div className="h-24 w-full animate-pulse rounded-lg bg-neutral-800" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-800/50 bg-rose-950/20 p-4 text-sm text-rose-300">
              <p className="font-semibold">Error loading commit detail</p>
              <p className="mt-1 font-mono text-xs opacity-90">{error}</p>
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Commit Message & Author info */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4">
                <p className="font-mono text-sm font-medium leading-relaxed text-white whitespace-pre-wrap">
                  {detail.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80 pt-3 text-xs text-neutral-400 font-mono">
                  <div className="flex items-center gap-2">
                    {detail.authorAvatar ? (
                      <img
                        src={detail.authorAvatar}
                        alt={detail.authorName}
                        className="h-6 w-6 rounded-full border border-neutral-700"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-950 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                        {detail.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-neutral-200">
                      {detail.authorName}
                    </span>
                    {detail.authorLogin && (
                      <span className="text-neutral-500">
                        (@{detail.authorLogin})
                      </span>
                    )}
                  </div>

                  <time dateTime={detail.authorDate} className="text-neutral-400">
                    <span aria-hidden="true">
                      {new Date(detail.authorDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="sr-only">
                      Committed on {detail.authorDate}
                    </span>
                  </time>
                </div>
              </div>

              {/* SHA Actions & Links */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800/80 bg-neutral-950/40 px-4 py-2.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-neutral-400">
                  <span>SHA:</span>
                  <code className="rounded bg-neutral-800 px-2 py-0.5 text-emerald-400">
                    {detail.sha}
                  </code>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(detail.sha)}
                    className="inline-flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-neutral-300 transition-colors duration-150 hover:border-neutral-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {copied ? (
                      <>
                        <Check size={12} className="text-emerald-400" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} aria-hidden="true" />
                        <span>Copy SHA</span>
                      </>
                    )}
                  </button>

                  <a
                    href={detail.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-neutral-300 transition-colors duration-150 hover:border-neutral-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <ExternalLink size={12} aria-hidden="true" />
                    <span>View on GitHub</span>
                  </a>
                </div>
              </div>

              {/* Aggregate Stats Bar */}
              {detail.stats && (
                <div className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-950/40 px-4 py-3 text-xs font-mono">
                  <span className="text-neutral-400">Stats:</span>
                  <span className="font-semibold text-emerald-400">
                    +{detail.stats.additions} additions
                  </span>
                  <span className="font-semibold text-rose-400">
                    -{detail.stats.deletions} deletions
                  </span>
                  <span className="text-neutral-500">
                    ({detail.files?.length || 0} files changed)
                  </span>
                </div>
              )}

              {/* Modified Files & Diff Snippets */}
              {detail.files && detail.files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Changed Files ({detail.files.length})
                  </h3>

                  <div className="space-y-2.5">
                    {detail.files.map((file: GitHubCommitFile) => {
                      const isExpanded = !!expandedFiles[file.filename];
                      return (
                        <div
                          key={file.filename}
                          className="rounded-lg border border-neutral-800 bg-neutral-950/80 overflow-hidden"
                        >
                          {/* File Header Accordion Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleFileExpand(file.filename)}
                            aria-expanded={isExpanded}
                            aria-label={`Toggle diff for ${file.filename}`}
                            className="flex w-full items-center justify-between px-3.5 py-2.5 text-left font-mono text-xs transition-colors duration-150 hover:bg-neutral-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              {isExpanded ? (
                                <ChevronDown
                                  size={14}
                                  className="text-neutral-400 shrink-0"
                                  aria-hidden="true"
                                />
                              ) : (
                                <ChevronRight
                                  size={14}
                                  className="text-neutral-400 shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                              <FileCode
                                size={14}
                                className="text-emerald-400 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="font-medium text-neutral-200 truncate">
                                {file.filename}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-emerald-400 font-semibold">
                                +{file.additions}
                              </span>
                              <span className="text-rose-400 font-semibold">
                                -{file.deletions}
                              </span>
                              {renderFileStatusBadge(file.status)}
                            </div>
                          </button>

                          {/* Diff Snippet Content */}
                          {isExpanded && (
                            <div className="border-t border-neutral-800 bg-neutral-950 p-3 font-mono text-[11px] leading-snug overflow-x-auto">
                              {file.patch ? (
                                <pre className="whitespace-pre">
                                  {file.patch
                                    .split("\n")
                                    .map((line, idx) => {
                                      let lineStyle = "text-neutral-400";
                                      let bgStyle = "";
                                      if (line.startsWith("+")) {
                                        lineStyle = "text-emerald-300";
                                        bgStyle = "bg-emerald-950/30";
                                      } else if (line.startsWith("-")) {
                                        lineStyle = "text-rose-300";
                                        bgStyle = "bg-rose-950/30";
                                      } else if (line.startsWith("@@")) {
                                        lineStyle = "text-blue-400 font-semibold";
                                        bgStyle = "bg-blue-950/20";
                                      }

                                      return (
                                        <div
                                          key={idx}
                                          className={`px-2 py-0.5 rounded-xs ${lineStyle} ${bgStyle}`}
                                        >
                                          {line}
                                        </div>
                                      );
                                    })}
                                </pre>
                              ) : (
                                <p className="text-neutral-500 italic px-2 py-1">
                                  Binary file or diff unavailable.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
