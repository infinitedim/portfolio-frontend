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
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Info,
  Layers,
  Eye,
  EyeOff,
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

                    
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCanvasMobile, setShowCanvasMobile] = useState<boolean>(false);

                                         
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

                                           
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

                                         
  const doneSet = useMemo(() => new Set(progress?.done ?? []), [progress]);
  const learningSet = useMemo(
    () => new Set(progress?.learning ?? []),
    [progress],
  );
  const skippedSet = useMemo(
    () => new Set(progress?.skipped ?? []),
    [progress],
  );

                         
  const padding = 120;

                                                                             
  const successColor = themeConfig.colors.success ?? themeConfig.colors.accent;
  const _errorColor = themeConfig.colors.error ?? themeConfig.colors.muted;
  const warningColor = themeConfig.colors.warning ?? themeConfig.colors.accent;
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

                                                           
  useEffect(() => {
    const container = containerRef.current;
    if (!container || width === 0) return;

    const handleResize = () => {
      const containerWidth = container.clientWidth;
                                                                                        
      const rawScale =
        containerWidth > 0 ? Math.min(1, containerWidth / width) : 1;
      const scale = Math.max(rawScale, 0.85);
      setFitScale(scale);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [width]);

                         
  const renderNode = (node: Node) => {
                                                                                 
                                                                                     
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

                                                            
    const x = node.position.x - minX + padding;
    const y = node.position.y - minY + padding;

                                     
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
        <div className="flex items-center gap-1.5 justify-between">
          <span className="font-semibold select-none leading-snug">
            {node.data.label}
          </span>
          {icon}
        </div>
      </div>
    );
  };

                             
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

        const sPrefix = edge.sourceHandle ? edge.sourceHandle.charAt(0) : "";
        const tPrefix = edge.targetHandle ? edge.targetHandle.charAt(0) : "";

                             
        let startX = sx + sW / 2;
        let startY = sy + sH / 2;
        if (sPrefix === "x") {
          startX = sx + sW;
          startY = sy + sH / 2;
        } else if (sPrefix === "y") {
          startX = sx + sW / 2;
          startY = sy + sH;
        } else if (sPrefix === "z") {
          startX = sx + sW / 2;
          startY = sy;
        } else if (sPrefix === "w") {
          startX = sx;
          startY = sy + sH / 2;
        } else {
                                        
          if (ty > sy + sH) {
            startY = sy + sH;
          } else if (ty + tH < sy) {
            startY = sy;
          }
          if (tx > sx + sW) {
            startX = sx + sW;
          } else if (tx + tW < sx) {
            startX = sx;
          }
        }

                             
        let endX = tx + tW / 2;
        let endY = ty + tH / 2;
        if (tPrefix === "x") {
          endX = tx + tW;
          endY = ty + tH / 2;
        } else if (tPrefix === "y") {
          endX = tx + tW / 2;
          endY = ty + tH;
        } else if (tPrefix === "z") {
          endX = tx + tW / 2;
          endY = ty;
        } else if (tPrefix === "w") {
          endX = tx;
          endY = ty + tH / 2;
        } else {
                                        
          if (ty > sy + sH) {
            endY = ty;
          } else if (ty + tH < sy) {
            endY = ty + tH;
          }
          if (tx > sx + sW) {
            endX = tx;
          } else if (tx + tW < sx) {
            endX = tx + tW;
          }
        }

        return {
          id: edge.id,
          startX,
          startY,
          endX,
          endY,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          style: edge.style,
        };
      })
      .filter(Boolean);
  }, [initialStructure, minX, minY]);

  return (
    <StandardPageLayout>
      <div className="min-h-screen px-4 py-8 font-mono select-none">
        <div className="mx-auto max-w-6xl space-y-4">
                                   
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
                <p
                  className="text-xs"
                  style={{ color: mutedColor }}
                >
                  {initialStructure.description}
                </p>
              </div>
            </div>

                                                           
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
                <div
                  className="text-xs"
                  style={{ color: mutedColor }}
                >
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
                <div
                  className="text-xs"
                  style={{ color: mutedColor }}
                >
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
                <div
                  className="text-xs"
                  style={{ color: mutedColor }}
                >
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
                <div
                  className="text-xs"
                  style={{ color: mutedColor }}
                >
                  {t("roadmapSkipped")}
                </div>
              </div>
            </div>
          )}

                                                                
          <div className="md:hidden space-y-4 mb-4">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
              <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider font-semibold text-amber-400 mb-1">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                  <span>$ notice :: mobile_viewport_detected</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCanvasMobile((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors text-[10px] font-mono border border-amber-400/30 cursor-pointer"
                >
                  {showCanvasMobile ? (
                    <>
                      <EyeOff size={11} />
                      <span>Hide Canvas</span>
                    </>
                  ) : (
                    <>
                      <Eye size={11} />
                      <span>Toggle Canvas</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-amber-200/90 leading-relaxed text-[11px]">
                Interactive 2D graph view is optimized for desktop & tablet viewports. Showing simplified topic outline below.
              </p>
            </div>

                                               
            {!showCanvasMobile && (
              <div
                className="rounded-lg border p-4 space-y-3 font-mono text-xs"
                style={{ borderColor: borderColor, backgroundColor: bgColor }}
              >
                <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: `${borderColor}66` }}>
                  <h3 className="font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: successColor }}>
                    <Layers size={14} />
                    Topic Outline Summary
                  </h3>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    {initialStructure.nodes.filter((n) => n.type === "topic" || n.type === "subtopic").length} topics
                  </span>
                </div>

                <div className="divide-y max-h-[60vh] overflow-y-auto pr-1" style={{ borderColor: `${borderColor}33` }}>
                  {initialStructure.nodes
                    .filter((n) => n.type === "topic" || n.type === "subtopic")
                    .map((node) => {
                      const isDone = doneSet.has(node.id);
                      const isLearning = learningSet.has(node.id);
                      const isSkipped = skippedSet.has(node.id);
                      const label = (node.data as { label?: string })?.label || node.id;
                      const isSubtopic = node.type === "subtopic";

                      return (
                        <div
                          key={node.id}
                          className={`py-2.5 flex items-center justify-between gap-3 text-xs ${
                            isSubtopic ? "pl-3 text-neutral-400 text-[11px]" : "text-neutral-200 font-medium"
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          {isDone ? (
                            <span
                              className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border"
                              style={{ borderColor: successColor, backgroundColor: `${successColor}1a`, color: successColor }}
                            >
                              Done
                            </span>
                          ) : isLearning ? (
                            <span
                              className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold border"
                              style={{ borderColor: infoColor, backgroundColor: `${infoColor}1a`, color: infoColor }}
                            >
                              Learning
                            </span>
                          ) : isSkipped ? (
                            <span
                              className="shrink-0 px-2 py-0.5 rounded text-[10px] border"
                              style={{ borderColor: `${mutedColor}66`, backgroundColor: `${bgColor}66`, color: mutedColor }}
                            >
                              Skipped
                            </span>
                          ) : (
                            <span
                              className="shrink-0 px-2 py-0.5 rounded text-[10px] border opacity-60"
                              style={{ borderColor: `${borderColor}66`, color: mutedColor }}
                            >
                              Pending
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

                                                 
          <div
            ref={containerRef}
            data-lenis-prevent
            className={`relative border rounded-lg overflow-auto max-h-[75vh] min-h-100 shadow-inner select-none ${
              showCanvasMobile ? "block" : "hidden md:block"
            }`}
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

                                    
                  {edgesData.map((edge) => {
                    if (!edge) return null;
                    const isDashed = edge.style?.strokeDasharray !== "0";

                    const sPrefix = edge.sourceHandle
                      ? edge.sourceHandle.charAt(0)
                      : "";
                    const tPrefix = edge.targetHandle
                      ? edge.targetHandle.charAt(0)
                      : "";

                    let cp1x = edge.startX;
                    let cp1y = edge.startY;
                    if (sPrefix === "x") {
                      cp1x = edge.startX + 80;
                    } else if (sPrefix === "y") {
                      cp1y = edge.startY + 80;
                    } else if (sPrefix === "z") {
                      cp1y = edge.startY - 80;
                    } else if (sPrefix === "w") {
                      cp1x = edge.startX - 80;
                    }

                    let cp2x = edge.endX;
                    let cp2y = edge.endY;
                    if (tPrefix === "x") {
                      cp2x = edge.endX + 80;
                    } else if (tPrefix === "y") {
                      cp2y = edge.endY + 80;
                    } else if (tPrefix === "z") {
                      cp2y = edge.endY - 80;
                    } else if (tPrefix === "w") {
                      cp2x = edge.endX - 80;
                    }

                    const pathD = `M ${edge.startX} ${edge.startY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${edge.endX} ${edge.endY}`;

                    return (
                      <path
                        key={edge.id}
                        d={pathD}
                        fill="none"
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

                                        
                {initialStructure.nodes.map((node) => renderNode(node))}
              </div>
            </div>
          </div>

                               
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
                <span style={{ color: successColor }}>{t("roadmapDone")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-sm border"
                  style={{
                    borderColor: infoColor,
                    backgroundColor: `${infoColor}1a`,
                  }}
                />
                <span style={{ color: infoColor }}>{t("roadmapLearning")}</span>
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
