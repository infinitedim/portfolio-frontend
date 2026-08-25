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
  AlertTriangle,
} from "lucide-react";
import { LenisScroll } from "@/components/layout/lenis-scroll";

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
    if (refSha) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [refSha]);

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
    } // eslint-disable-next-line no-empty
    catch {}
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
                                                                                     
      <div
        className="absolute inset-0"
        aria-hidden="true"
      />

      <aside className="relative flex h-full max-h-[92vh] w-full max-w-2xl md:max-w-3xl lg:max-w-4xl flex-col rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden z-10 font-mono">
                      
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <GitCommit className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            <h2
              id="commit-detail-heading"
              className="text-base font-bold text-white flex items-center gap-2"
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
            className="rounded-lg p-2 text-neutral-400 transition-colors duration-150 hover:bg-neutral-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

                                              
        <LenisScroll
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-(--terminal-muted) hover:scrollbar-thumb-(--terminal-accent)"
          data-lenis-prevent
        >
          {loading && <CommitDetailPhantomSkeleton />}

          {error && (
            <div className="rounded-lg border border-rose-800/50 bg-rose-950/20 p-4 text-sm text-rose-300">
              <p className="font-semibold">Error loading commit detail</p>
              <p className="mt-1 font-mono text-xs opacity-90">{error}</p>
            </div>
          )}

          {detail && !loading && (
            <>
                                                  
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <p className="font-mono text-sm font-medium leading-relaxed text-white whitespace-pre-wrap">
                  {detail.message}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80 pt-3.5 text-xs text-neutral-400 font-mono">
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
                  </div>

                  <div className="flex items-center gap-3">
                    <time dateTime={detail.authorDate}>
                      {new Date(detail.authorDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </time>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(detail.sha)}
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="Copy full commit SHA"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      <span className="text-[11px] font-mono">
                        {detail.sha.substring(0, 7)}
                      </span>
                    </button>

                    <a
                      href={detail.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-400 hover:text-white transition-colors"
                      title="View commit on GitHub"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>

                                      
              {detail.stats && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950/40 px-4 py-3.5 font-mono text-xs my-1">
                  <span className="text-neutral-400">
                    Showing{" "}
                    <strong className="text-white">
                      {detail.files ? detail.files.length : 0}
                    </strong>{" "}
                    changed files
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-semibold">
                      +{detail.stats.additions}
                    </span>
                    <span className="text-rose-400 font-semibold">
                      -{detail.stats.deletions}
                    </span>
                  </div>
                </div>
              )}

                                                         
              <div className="sm:hidden rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 font-mono space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-400 text-[11px] uppercase tracking-wider">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>$ notice :: mobile_diff_limit</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90 font-sans">
                  Detailed code diff patches are optimized for desktop & tablet viewports. You can inspect full line changes directly on GitHub.
                </p>
                {detail.htmlUrl && (
                  <a
                    href={detail.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors text-[11px] font-mono font-medium border border-amber-400/30 cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    <span>View Full Diff on GitHub</span>
                  </a>
                )}
              </div>

                                               
              {detail.files && detail.files.length > 0 && (
                <div className="pt-3 space-y-4">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400 pb-1.5 pt-2">
                    Changed Files ({detail.files.length})
                  </h3>

                  <div className="space-y-4">
                    {detail.files.map((file: GitHubCommitFile) => {
                      const isExpanded = !!expandedFiles[file.filename];
                      return (
                        <div
                          key={file.filename}
                          className="rounded-lg border border-neutral-800 bg-neutral-950/70 overflow-hidden transition-colors duration-150 hover:border-neutral-700"
                        >
                                                                 
                          <button
                            type="button"
                            onClick={() => toggleFileExpand(file.filename)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-mono text-xs hover:bg-neutral-900/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {isExpanded ? (
                                <ChevronDown
                                  size={14}
                                  className="shrink-0 text-neutral-400"
                                />
                              ) : (
                                <ChevronRight
                                  size={14}
                                  className="shrink-0 text-neutral-400"
                                />
                              )}
                              <FileCode
                                size={14}
                                className="shrink-0 text-emerald-400"
                              />
                              <span className="font-semibold text-neutral-200 truncate">
                                {file.filename}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                              <span className="text-neutral-400">
                                <span className="text-emerald-400">
                                  +{file.additions}
                                </span>{" "}
                                <span className="text-rose-400">
                                  -{file.deletions}
                                </span>
                              </span>
                              {renderFileStatusBadge(file.status)}
                            </div>
                          </button>

                                                             
                          {isExpanded && (
                            <div className="border-t border-neutral-800/80 bg-neutral-950 p-3 overflow-x-auto text-[11px] font-mono leading-tight scrollbar-thin scrollbar-track-transparent scrollbar-thumb-(--terminal-muted) hover:scrollbar-thumb-(--terminal-accent)">
                              {file.patch ? (
                                <div className="w-max min-w-full font-mono">
                                  {file.patch
                                    .split("\n")
                                    .map((line, idx) => {
                                      let lineClass = "text-neutral-300";
                                      if (line.startsWith("+")) {
                                        lineClass =
                                          "bg-emerald-950/40 text-emerald-300";
                                      } else if (line.startsWith("-")) {
                                        lineClass =
                                          "bg-rose-950/40 text-rose-300";
                                      } else if (line.startsWith("@@")) {
                                        lineClass =
                                          "text-blue-400 font-bold bg-blue-950/20";
                                      }
                                      return (
                                        <div
                                          key={idx}
                                          className={`w-full px-2 py-0.5 ${lineClass}`}
                                        >
                                          {line}
                                        </div>
                                      );
                                    })}
                                </div>
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
        </LenisScroll>
      </aside>
    </div>
  );
}

function CommitDetailPhantomSkeleton() {
  return (
    <div
      className="space-y-6 font-mono"
      aria-busy="true"
      aria-label="Loading commit file diff details"
    >
                                      
      <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
        <div className="h-5 w-4/5 animate-pulse rounded bg-neutral-800/70" />
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-neutral-800 animate-pulse" />
            <div className="h-3 w-28 rounded bg-neutral-800/70 animate-pulse" />
          </div>
          <div className="h-3 w-3 rounded-full bg-neutral-800/50" />
          <div className="h-3 w-24 rounded bg-neutral-800/70 animate-pulse" />
          <div className="h-3 w-3 rounded-full bg-neutral-800/50" />
          <div className="h-5 w-20 rounded bg-neutral-800/70 animate-pulse" />
        </div>
      </div>

                                       
      <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 flex items-center justify-between">
        <div className="h-4 w-40 rounded bg-neutral-800/70 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-neutral-800/70 animate-pulse" />
          <div className="h-4 w-16 rounded bg-neutral-800/70 animate-pulse" />
        </div>
      </div>

                                                   
      <div className="space-y-3">
        <div className="h-4 w-44 rounded bg-neutral-800/70 animate-pulse" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-neutral-800 bg-neutral-950/60 overflow-hidden space-y-2 p-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-neutral-800/60 animate-pulse" />
                <div className="h-4 w-48 sm:w-64 rounded bg-neutral-800/70 animate-pulse" />
              </div>
              <div className="h-4 w-14 rounded bg-neutral-800/70 animate-pulse" />
            </div>
            <div className="mt-2 rounded bg-neutral-900 p-3 space-y-1.5 border border-neutral-800/50">
              <div className="h-3 w-3/4 rounded bg-neutral-800/50 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-emerald-950/40 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-rose-950/40 animate-pulse" />
              <div className="h-3 w-4/5 rounded bg-neutral-800/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
