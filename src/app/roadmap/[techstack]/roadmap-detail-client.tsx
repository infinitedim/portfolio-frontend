"use client";

import { useState, useEffect, JSX, useMemo, useCallback } from "react";
import Link from "next/link";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { useTheme } from "@/hooks/use-theme";
import type { Root, Node } from "@/types/detailed_roadmap";
import { 
  CheckCircle2, 
  BookOpen, 
  SkipForward, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  ArrowLeft,
  Info
} from "lucide-react";

interface ProgressResponse {
  totalTopicCount: number;
  done: string[];
  learning: string[];
  skipped: string[];
  isFavorite: boolean;
}

interface RoadmapDetailClientProps {
  techstack: string;
  initialStructure: Root;
}

export function RoadmapDetailClient({
  techstack,
  initialStructure,
}: RoadmapDetailClientProps): JSX.Element {
  const { themeConfig } = useTheme();
  
  // Progress states
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch progress live from backend route
  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/roadmap/progress/${techstack}`);
      if (!res.ok) {
        throw new Error(`Upstream returned ${res.status}`);
      }
      const data = (await res.json()) as ProgressResponse;
      setProgress(data);
    } catch (err) {
      console.error("[RoadmapDetailClient] Failed to load progress:", err);
      setError("Live progress currently unavailable. Displaying layout structure only.");
    } finally {
      setLoading(false);
    }
  }, [techstack]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Set lookup lookups for O(1) matching
  const doneSet = useMemo(() => new Set(progress?.done ?? []), [progress]);
  const learningSet = useMemo(() => new Set(progress?.learning ?? []), [progress]);
  const skippedSet = useMemo(() => new Set(progress?.skipped ?? []), [progress]);

  // Dimensions of canvas
  const padding = 120;
  
  const { minX, minY, width, height } = useMemo(() => {
    const nodes = initialStructure.nodes;
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, width: 200, height: 200 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      const nW = n.style?.width ?? n.width ?? n.measured?.width ?? 200;
      const nH = n.style?.height ?? n.height ?? n.measured?.height ?? 60;
      
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.x + nW > maxX) maxX = n.position.x + nW;
      if (n.position.y + nH > maxY) maxY = n.position.y + nH;
    });

    return {
      minX,
      minY,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }, [initialStructure]);

  // Render a single node
  const renderNode = (node: Node) => {
    const w = node.style?.width ?? node.width ?? node.measured?.width ?? 200;
    const h = node.style?.height ?? node.height ?? node.measured?.height ?? 60;
    
    // Normalize coordinates based on minX, minY and padding
    const x = node.position.x - minX + padding;
    const y = node.position.y - minY + padding;

    // Helper: Determine topic status
    const isTopic = node.type === "topic" || node.type === "subtopic";
    let status: "done" | "learning" | "skipped" | "not-started" = "not-started";
    
    if (isTopic) {
      if (doneSet.has(node.id)) status = "done";
      else if (learningSet.has(node.id)) status = "learning";
      else if (skippedSet.has(node.id)) status = "skipped";
    }

    const commonStyles = {
      position: "absolute" as const,
      left: x,
      top: y,
      width: w,
      height: h,
      zIndex: node.zIndex ?? 1,
    };

    if (node.type === "vertical") {
      return (
        <div
          key={node.id}
          style={commonStyles}
          className="flex items-center justify-center pointer-events-none"
        >
          <div
            style={{
              width: node.data.style?.strokeWidth ?? 3.5,
              height: "100%",
              backgroundColor: node.data.style?.stroke ?? "var(--terminal-border)",
            }}
          />
        </div>
      );
    }

    if (node.type === "horizontal") {
      return (
        <div
          key={node.id}
          style={commonStyles}
          className="flex items-center justify-center pointer-events-none"
        >
          <div
            style={{
              width: "100%",
              height: node.data.style?.strokeWidth ?? 3.5,
              backgroundColor: node.data.style?.stroke ?? "var(--terminal-border)",
            }}
          />
        </div>
      );
    }

    if (node.type === "section") {
      return (
        <div
          key={node.id}
          style={{
            ...commonStyles,
            backgroundColor: `${themeConfig.colors.muted}10`,
            borderColor: themeConfig.colors.border,
          }}
          className="rounded-lg border border-dashed pointer-events-none opacity-40"
        />
      );
    }

    if (node.type === "title") {
      return (
        <div
          key={node.id}
          style={{
            ...commonStyles,
            height: "auto",
          }}
          className="font-mono font-bold text-white text-3xl select-none"
        >
          {node.data.label}
        </div>
      );
    }

    if (node.type === "paragraph") {
      return (
        <div
          key={node.id}
          style={{
            ...commonStyles,
            height: "auto",
          }}
          className="font-mono text-neutral-400 text-xs leading-relaxed max-w-md select-none"
        >
          {node.data.label}
        </div>
      );
    }

    if (node.type === "button") {
      return (
        <a
          key={node.id}
          href={node.data.href ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          style={commonStyles}
          className="flex items-center justify-center rounded font-mono text-sm font-bold border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all select-none"
        >
          {node.data.label}
        </a>
      );
    }

    if (node.type === "label") {
      return (
        <div
          key={node.id}
          style={{
            ...commonStyles,
            height: "auto",
          }}
          className="font-mono text-neutral-500 text-xs font-semibold select-none"
        >
          {node.data.label}
        </div>
      );
    }

    // Default: topic / subtopic
    let statusClass = "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700";
    let icon = null;

    if (status === "done") {
      statusClass = "border-emerald-500 bg-emerald-950/20 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/30";
      icon = <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />;
    } else if (status === "learning") {
      statusClass = "border-sky-500 bg-sky-950/20 text-sky-300 hover:border-sky-400 hover:bg-sky-950/30 animate-pulse-subtle";
      icon = <BookOpen size={12} className="text-sky-400 shrink-0" />;
    } else if (status === "skipped") {
      statusClass = "border-neutral-700 bg-neutral-900/40 text-neutral-500 hover:border-neutral-600";
      icon = <SkipForward size={12} className="text-neutral-500 shrink-0" />;
    } else if (status === "not-started" && !loading) {
      statusClass = "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-600 hover:text-white";
    }

    // Font size styling
    const fontSize = node.data.style?.fontSize ? `${node.data.style.fontSize}px` : "13px";

    return (
      <div
        key={node.id}
        style={{
          ...commonStyles,
          fontSize,
        }}
        className={`flex flex-col justify-center rounded border p-3 font-mono shadow-sm transition-all duration-200 ${statusClass}`}
      >
        <div className="flex items-start gap-1.5 justify-between">
          <span className="font-semibold select-none leading-snug">{node.data.label}</span>
          {icon}
        </div>
      </div>
    );
  };

  // Compute edge coordinates
  const edgesData = useMemo(() => {
    return initialStructure.edges.map((edge) => {
      const sourceNode = initialStructure.nodes.find((n) => n.id === edge.source);
      const targetNode = initialStructure.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return null;

      const sW = sourceNode.style?.width ?? sourceNode.width ?? sourceNode.measured?.width ?? 200;
      const sH = sourceNode.style?.height ?? sourceNode.height ?? sourceNode.measured?.height ?? 60;
      const tW = targetNode.style?.width ?? targetNode.width ?? targetNode.measured?.width ?? 200;
      const tH = targetNode.style?.height ?? targetNode.height ?? targetNode.measured?.height ?? 60;

      const sx = sourceNode.position.x - minX + padding;
      const sy = sourceNode.position.y - minY + padding;
      const tx = targetNode.position.x - minX + padding;
      const ty = targetNode.position.y - minY + padding;

      // Connect boundary box centers:
      let startX = sx + sW / 2;
      let startY = sy + sH / 2;
      let endX = tx + tW / 2;
      let endY = ty + tH / 2;

      // Adjust boundaries so lines connect nicely to edges of boxes
      if (ty > sy + sH) {
        startY = sy + sH;
        endY = ty;
      } else if (ty + tH < sy) {
        startY = sy;
        endY = ty + tH;
      }

      if (tx > sx + sW) {
        startX = sx + sW;
        endX = tx;
      } else if (tx + tW < sx) {
        startX = sx;
        endX = tx + tW;
      }

      return {
        id: edge.id,
        startX,
        startY,
        endX,
        endY,
        style: edge.style,
      };
    }).filter(Boolean);
  }, [initialStructure, minX, minY]);

  return (
    <StandardPageLayout>
      <div className="min-h-screen px-4 py-8 font-mono select-none">
        <div className="mx-auto max-w-6xl space-y-4">
          
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/roadmap"
                className="flex items-center justify-center w-8 h-8 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white uppercase tracking-wider">
                  {initialStructure.title?.page ?? initialStructure.title?.card}
                </h1>
                <p className="text-xs text-neutral-500">
                  {initialStructure.description}
                </p>
              </div>
            </div>

            {/* Sync progress button & Status indicator */}
            <div className="flex items-center gap-3">
              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Loader2 size={14} className="animate-spin text-sky-500" />
                  <span>Syncing progress...</span>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-amber-500 border border-amber-500/20 bg-amber-500/5 px-2 py-1 rounded">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
              <button
                onClick={fetchProgress}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {progress && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 text-center">
              <div>
                <div className="text-xl font-bold text-white">{progress.totalTopicCount}</div>
                <div className="text-xs text-neutral-500">Total Topics</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-500 flex items-center justify-center gap-1">
                  <CheckCircle2 size={16} />
                  {progress.done.length}
                </div>
                <div className="text-xs text-neutral-500">Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-sky-500 flex items-center justify-center gap-1">
                  <BookOpen size={16} />
                  {progress.learning.length}
                </div>
                <div className="text-xs text-neutral-500">Learning</div>
              </div>
              <div>
                <div className="text-xl font-bold text-neutral-400 flex items-center justify-center gap-1">
                  <SkipForward size={16} />
                  {progress.skipped.length}
                </div>
                <div className="text-xs text-neutral-500">Skipped</div>
              </div>
            </div>
          )}

          {/* Map Visualizer Canvas Container */}
          <div className="relative border border-neutral-800 bg-neutral-950 rounded-lg overflow-auto max-h-[75vh] min-h-[400px] shadow-inner select-none">
            <div
              style={{
                width,
                height,
                position: "relative",
              }}
              className="bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px]"
            >
              {/* SVG containing connections */}
              <svg
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              >
                {/* Arrow markers */}
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--terminal-border)" />
                  </marker>
                </defs>

                {/* Draw edges */}
                {edgesData.map((edge) => {
                  if (!edge) return null;
                  const isDashed = edge.style?.strokeDasharray !== "0";
                  
                  return (
                    <line
                      key={edge.id}
                      x1={edge.startX}
                      y1={edge.startY}
                      x2={edge.endX}
                      y2={edge.endY}
                      stroke={edge.style?.stroke ?? "var(--terminal-border)"}
                      strokeWidth={edge.style?.strokeWidth ?? 3.5}
                      strokeDasharray={isDashed ? edge.style?.strokeDasharray : undefined}
                      strokeLinecap="round"
                      markerEnd="url(#arrow)"
                      opacity="0.8"
                    />
                  );
                })}
              </svg>

              {/* Render all nodes */}
              {initialStructure.nodes.map((node) => renderNode(node))}
            </div>
          </div>

          {/* Legend Banner */}
          <div className="flex flex-wrap gap-4 items-center justify-between text-xs text-neutral-500 rounded border border-neutral-800/40 p-3 bg-neutral-950/20">
            <div className="flex items-center gap-1 text-neutral-400">
              <Info size={12} className="text-sky-500" />
              <span>Scroll inside the canvas container above to browse the full roadmap.</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border border-emerald-500 bg-emerald-950/10"></span> <span className="text-emerald-400">Done</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border border-sky-500 bg-sky-950/10"></span> <span className="text-sky-400">Learning</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border border-neutral-700 bg-neutral-900/40"></span> <span className="text-neutral-500">Skipped</span></div>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm border border-neutral-700 bg-neutral-900"></span> <span className="text-neutral-300">Not Started</span></div>
            </div>
          </div>

        </div>
      </div>
    </StandardPageLayout>
  );
}
