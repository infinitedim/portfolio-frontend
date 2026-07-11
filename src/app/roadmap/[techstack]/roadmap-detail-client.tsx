"use client";

import { useState, useEffect, JSX, useMemo, useCallback, useRef } from "react";
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
  Info,
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

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
  const { t } = useI18n();
  const { themeConfig } = useTheme();

  // Progress states
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Canvas scaling & scroll prevent refs
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

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
      setError(t("roadmapProgressError"));
    } finally {
      setLoading(false);
    }
  }, [techstack, t]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Set lookup lookups for O(1) matching
  const doneSet = useMemo(() => new Set(progress?.done ?? []), [progress]);
  const learningSet = useMemo(
    () => new Set(progress?.learning ?? []),
    [progress],
  );
  const skippedSet = useMemo(
    () => new Set(progress?.skipped ?? []),
    [progress],
  );

  // Dimensions of canvas
  const padding = 120;

  // ─── Theme color consts (single declaration, reused everywhere below) ───
  const successColor =
    themeConfig.colors.success ?? themeConfig.colors.accent;
  const _errorColor = themeConfig.colors.error ?? themeConfig.colors.muted;
  const warningColor =
    themeConfig.colors.warning ?? themeConfig.colors.accent;
  const infoColor = themeConfig.colors.info ?? successColor;
  const borderColor = themeConfig.colors.border;
  const mutedColor = themeConfig.colors.muted;
  const textColor = themeConfig.colors.text;
  const bgColor = themeConfig.colors.bg;

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

  // Effect to calculate fit scale and handle window resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container || width === 0) return;

    const handleResize = () => {
      const containerWidth = container.clientWidth;
      // Only scale down, never up — don't blow up small roadmaps to fill the container.
      const rawScale = containerWidth > 0 ? Math.min(1, containerWidth / width) : 1;
      const scale = Math.max(rawScale, 0.85);
      setFitScale(scale);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [width]);

  // Render a single node
  const renderNode = (node: Node) => {
    // ── Node type scope: only topic, subtopic, section, vertical, horizontal ──
    // title, paragraph, button, label are intentionally NOT rendered on this canvas.
    if (
      node.type === "title" ||
      node.type === "paragraph" ||
      node.type === "button" ||
      node.type === "label"
    ) {
      return null;
    }

    const w = node.style?.width ?? node.width ?? node.measured?.width ?? 200;
    const h = node.style?.height ?? node.height ?? node.measured?.height ?? 60;

    // Normalize coordinates based on minX, minY and padding
    const x = node.position.x - minX + padding;
    const y = node.position.y - minY + padding;

    // Helper: Determine topic status
    const isTopic = node.type === "topic" || node.type === "subtopic";
    let status: "done" | "learning" | "skipped" | "not-started" =
      "not-started";

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
              backgroundColor:
                node.data.style?.stroke ?? "var(--terminal-border)",
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
              backgroundColor:
                node.data.style?.stroke ?? "var(--terminal-border)",
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
            backgroundColor: `${mutedColor}10`,
            borderColor: borderColor,
          }}
          className="rounded-lg border border-dashed pointer-events-none opacity-40"
        />
      );
    }

    // Default: topic / subtopic
    // Build inline style objects per status (no hardcoded Tailwind color classes)
    let nodeStyle: React.CSSProperties = {
      borderColor: borderColor,
      backgroundColor: bgColor,
      color: mutedColor,
    };
    let icon: JSX.Element | null = null;

    if (status === "done") {
      nodeStyle = {
        borderColor: successColor,
        backgroundColor: `${successColor}1a`,
        color: successColor,
      };
      icon = (
        <CheckCircle2
          size={12}
          style={{ color: successColor }}
          className="shrink-0"
        />
      );
    } else if (status === "learning") {
      nodeStyle = {
        borderColor: infoColor,
        backgroundColor: `${infoColor}1a`,
        color: infoColor,
      };
      icon = (
        <BookOpen
          size={12}
          style={{ color: infoColor }}
          className="shrink-0"
        />
      );
    } else if (status === "skipped") {
      nodeStyle = {
        borderColor: `${mutedColor}99`,
        backgroundColor: `${bgColor}66`,
        color: `${mutedColor}99`,
      };
      icon = (
        <SkipForward
          size={12}
          style={{ color: `${mutedColor}99` }}
          className="shrink-0"
        />
      );
    } else if (status === "not-started" && !loading) {
      nodeStyle = {
        borderColor: `${mutedColor}99`,
        backgroundColor: bgColor,
        color: textColor,
      };
    }

    // Font size styling
    const fontSize = node.data.style?.fontSize
      ? `${node.data.style.fontSize}px`
      : "13px";

    return (
      <div
        key={node.id}
        style={{
          ...commonStyles,
          ...nodeStyle,
          fontSize,
        }}
        className={`flex flex-col justify-center rounded border p-3 font-mono shadow-sm transition-all duration-200${status === "learning" ? " animate-pulse-subtle" : ""}`}
      >
        <div className="flex items-start gap-1.5 justify-between">
          <span className="font-semibold select-none leading-snug">
            {node.data.label}
          </span>
          {icon}
        </div>
      </div>
    );
  };

  // Compute edge coordinates
  const edgesData = useMemo(() => {
    return initialStructure.edges
      .map((edge) => {
        const sourceNode = initialStructure.nodes.find(
          (n) => n.id === edge.source,
        );
        const targetNode = initialStructure.nodes.find(
          (n) => n.id === edge.target,
        );
        if (!sourceNode || !targetNode) return null;

        const sW =
          sourceNode.style?.width ??
          sourceNode.width ??
          sourceNode.measured?.width ??
          200;
        const sH =
          sourceNode.style?.height ??
          sourceNode.height ??
          sourceNode.measured?.height ??
          60;
        const tW =
          targetNode.style?.width ??
          targetNode.width ??
          targetNode.measured?.width ??
          200;
        const tH =
          targetNode.style?.height ??
          targetNode.height ??
          targetNode.measured?.height ??
          60;

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
      })
      .filter(Boolean);
  }, [initialStructure, minX, minY]);

  return (
    <StandardPageLayout>
      <div className="min-h-screen px-4 py-8 font-mono select-none">
        <div className="mx-auto max-w-6xl space-y-4">
          {/* Header Action Bar */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 border-b pb-4"
            style={{ borderBottomColor: borderColor }}
          >
            <div className="flex items-center gap-3">
              <Link
                href="/roadmap"
                className="flex items-center justify-center w-8 h-8 rounded border transition-all"
                style={{
                  borderColor: borderColor,
                  backgroundColor: bgColor,
                  color: mutedColor,
                }}
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h1
                  className="text-lg font-bold uppercase tracking-wider"
                  style={{ color: textColor }}
                >
                  {initialStructure.title?.page ?? initialStructure.title?.card}
                </h1>
                <p className="text-xs" style={{ color: mutedColor }}>
                  {initialStructure.description}
                </p>
              </div>
            </div>

            {/* Sync progress button & Status indicator */}
            <div className="flex items-center gap-3">
              {loading && (
                <div
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: mutedColor }}
                >
                  <Loader2
                    size={14}
                    className="animate-spin"
                    style={{ color: infoColor }}
                  />
                  <span>{t("roadmapSyncing")}</span>
                </div>
              )}
              {error && (
                <div
                  className="flex items-center gap-1.5 text-xs border px-2 py-1 rounded"
                  style={{
                    color: warningColor,
                    borderColor: `${warningColor}33`,
                    backgroundColor: `${warningColor}0d`,
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
              <button
                onClick={fetchProgress}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{
                  borderColor: borderColor,
                  backgroundColor: bgColor,
                  color: mutedColor,
                }}
              >
                <RefreshCw
                  size={12}
                  className={loading ? "animate-spin" : ""}
                />
                <span>{t("roadmapSync")}</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {progress && (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border p-4 text-center"
              style={{
                borderColor: borderColor,
                backgroundColor: `${bgColor}1a`,
              }}
            >
              <div>
                <div
                  className="text-xl font-bold"
                  style={{ color: textColor }}
                >
                  {progress.totalTopicCount}
                </div>
                <div className="text-xs" style={{ color: mutedColor }}>
                  {t("roadmapTotalTopics")}
                </div>
              </div>
              <div>
                <div
                  className="text-xl font-bold flex items-center justify-center gap-1"
                  style={{ color: successColor }}
                >
                  <CheckCircle2 size={16} />
                  {progress.done.length}
                </div>
                <div className="text-xs" style={{ color: mutedColor }}>
                  {t("roadmapCompleted")}
                </div>
              </div>
              <div>
                <div
                  className="text-xl font-bold flex items-center justify-center gap-1"
                  style={{ color: infoColor }}
                >
                  <BookOpen size={16} />
                  {progress.learning.length}
                </div>
                <div className="text-xs" style={{ color: mutedColor }}>
                  {t("roadmapLearning")}
                </div>
              </div>
              <div>
                <div
                  className="text-xl font-bold flex items-center justify-center gap-1"
                  style={{ color: mutedColor }}
                >
                  <SkipForward size={16} />
                  {progress.skipped.length}
                </div>
                <div className="text-xs" style={{ color: mutedColor }}>
                  {t("roadmapSkipped")}
                </div>
              </div>
            </div>
          )}

          {/* Map Visualizer Canvas Container */}
          <div
            ref={containerRef}
            data-lenis-prevent
            className="relative border rounded-lg overflow-auto max-h-[75vh] min-h-100 shadow-inner select-none"
            style={{
              borderColor: borderColor,
              backgroundColor: bgColor,
            }}
          >
            <div
              style={{
                width: width * fitScale,
                height: height * fitScale,
              }}
            >
              <div
                style={{
                  width,
                  height,
                  position: "relative",
                  transform: `scale(${fitScale})`,
                  transformOrigin: "top left",
                  backgroundImage: `radial-gradient(${mutedColor}33 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
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
                      <path
                        d="M 0 1.5 L 8 5 L 0 8.5 z"
                        fill="var(--terminal-border)"
                      />
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
                        strokeDasharray={
                          isDashed ? edge.style?.strokeDasharray : undefined
                        }
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
          </div>

          {/* Legend Banner */}
          <div
            className="flex flex-wrap gap-4 items-center justify-between text-xs rounded border p-3"
            style={{
              color: mutedColor,
              borderColor: `${borderColor}66`,
              backgroundColor: `${bgColor}33`,
            }}
          >
            <div
              className="flex items-center gap-1"
              style={{ color: textColor }}
            >
              <Info
                size={12}
                style={{ color: infoColor }}
              />
              <span>{t("roadmapScrollHelp")}</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm border"
                  style={{
                    borderColor: successColor,
                    backgroundColor: `${successColor}1a`,
                  }}
                />
                <span style={{ color: successColor }}>
                  {t("roadmapDone")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm border"
                  style={{
                    borderColor: infoColor,
                    backgroundColor: `${infoColor}1a`,
                  }}
                />
                <span style={{ color: infoColor }}>
                  {t("roadmapLearning")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm border"
                  style={{
                    borderColor: `${mutedColor}99`,
                    backgroundColor: `${bgColor}66`,
                  }}
                />
                <span style={{ color: `${mutedColor}99` }}>
                  {t("roadmapSkipped")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm border"
                  style={{
                    borderColor: `${mutedColor}99`,
                    backgroundColor: bgColor,
                  }}
                />
                <span style={{ color: textColor }}>
                  {t("roadmapNotStarted")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
