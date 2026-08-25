"use client";

   
                                                                    
  
                                                                                  
                                                                          
                                                                              
  
                                                             
   

import { useState, useCallback, memo } from "react";
import type { GraphLayout } from "@/lib/git-graph";

/**
 * Props for the {@link GitGraphColumn} visualization component.
 */
interface GitGraphColumnProps {
  /** The computed graph layout containing positions for nodes and routed edges. */
  layout: GraphLayout;
  /** Vertical height in pixels allocated to each commit row. */
  rowHeight: number;
  /** Horizontal width in pixels allocated to each parallel branch lane. */
  laneWidth: number;
  /** Callback fired when a commit node is clicked or activated via keyboard. */
  onNodeClick: (sha: string) => void;
  /** Optional flag indicating whether terminal-style styling/opacity should be applied. */
  terminalMode?: boolean;
}

/**
 * Standard commit node circle radius in pixels.
 */
const NODE_RADIUS = 5;

/**
 * Merge commit node outer circle radius in pixels.
 */
const MERGE_NODE_RADIUS = 7;

/**
 * Expanded invisible hit target circle radius in pixels for enhanced accessibility and touch.
 */
const HIT_TARGET_RADIUS = 22;

/**
 * SVG-based interactive Git graph column component.
 *
 * Renders a visual branch topology diagram with commit nodes, merge indicators,
 * branch tip ping animations, and curved Bezier/straight edge connectors.
 * Supports branch hover highlighting and click-to-inspect commit navigation.
 *
 * @param props - Component configuration properties.
 * @param props.layout - The calculated graph layout metadata.
 * @param props.rowHeight - Row height in pixels for vertical spacing.
 * @param props.laneWidth - Lane width in pixels for horizontal column distribution.
 * @param props.onNodeClick - Callback triggered with the commit SHA when a node is clicked.
 * @param props.terminalMode - Whether to render with terminal styling.
 * @returns The rendered SVG Git graph column or `null` if no commit nodes exist.
 */
export const GitGraphColumn = memo(function GitGraphColumn({
  layout,
  rowHeight,
  laneWidth,
  onNodeClick,
  terminalMode = false,
}: GitGraphColumnProps) {
  const [highlightedBranch, setHighlightedBranch] = useState<string | null>(
    null,
  );

  const columnWidth = Math.max(layout.maxLanes * laneWidth + 12, 36);
  const lastSha = layout.orderedShas[layout.orderedShas.length - 1];
  const lastNode = lastSha ? layout.nodes.get(lastSha) : null;
  const computedHeight = lastNode ? lastNode.y + 60 : layout.totalRows * rowHeight;
  const totalHeight = Math.max(computedHeight, layout.totalRows * rowHeight);

  const handleNodeClick = useCallback(
    (sha: string) => {
      onNodeClick(sha);
    },
    [onNodeClick],
  );

  if (layout.orderedShas.length === 0) return null;

  const nodesList = Array.from(layout.nodes.values());

  return (
    <div
      className={`hidden sm:block relative shrink-0 ${terminalMode ? "opacity-85" : ""}`}
      style={{ width: columnWidth, height: totalHeight }}
      role="img"
      aria-label="Git commit graph showing branch and merge history"
    >
      <svg
        width={columnWidth}
        height={totalHeight}
        className="absolute inset-0 overflow-visible"
      >
                                                                                 
        <g className="graph-edges">
          {layout.edges.map((edge) => {
            const isEdgeHighlighted =
              highlightedBranch !== null &&
              (edge.branchName === highlightedBranch ||
                layout.nodes.get(edge.fromSha)?.branchName === highlightedBranch ||
                layout.nodes.get(edge.toSha)?.branchName === highlightedBranch);

            const strokeOpacity =
              highlightedBranch === null
                ? 0.55
                : isEdgeHighlighted
                  ? 1
                  : 0.12;

            const strokeWidth = isEdgeHighlighted ? 2.5 : 1.5;

                                                       
            if (Math.abs(edge.from.x - edge.to.x) < 1) {
              return (
                <line
                  key={`edge-${edge.fromSha}-${edge.toSha}`}
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  stroke={edge.branchColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  strokeLinecap="round"
                  onMouseEnter={() => setHighlightedBranch(edge.branchName || null)}
                  onMouseLeave={() => setHighlightedBranch(null)}
                  className="transition-all duration-150"
                />
              );
            }

                                                              
            const midY = (edge.from.y + edge.to.y) / 2;
            const pathData = `M ${edge.from.x} ${edge.from.y} C ${edge.from.x} ${midY}, ${edge.to.x} ${midY}, ${edge.to.x} ${edge.to.y}`;

            return (
              <path
                key={`edge-${edge.fromSha}-${edge.toSha}`}
                d={pathData}
                fill="none"
                stroke={edge.branchColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                strokeLinecap="round"
                onMouseEnter={() => setHighlightedBranch(edge.branchName || null)}
                onMouseLeave={() => setHighlightedBranch(null)}
                className="transition-all duration-150"
              />
            );
          })}
        </g>

                                                                                
        <g className="graph-nodes">
          {nodesList.map((node) => {
            const isNodeHighlighted =
              highlightedBranch !== null && node.branchName === highlightedBranch;
            const isDimmed =
              highlightedBranch !== null && node.branchName !== highlightedBranch;

            const isMerge = node.type === "merge";
            const isBranchTip = node.type === "branch-tip";
            const radius = isMerge ? MERGE_NODE_RADIUS : NODE_RADIUS;

            return (
              <g
                key={`node-${node.sha}`}
                style={{ cursor: "pointer" }}
                onClick={() => handleNodeClick(node.sha)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNodeClick(node.sha);
                  }
                }}
                onMouseEnter={() => setHighlightedBranch(node.branchName || null)}
                onMouseLeave={() => setHighlightedBranch(null)}
                tabIndex={0}
                role="button"
                aria-label={`Commit ${node.shortSha}${node.branchRefs.length > 0 ? ` on ${node.branchRefs.join(", ")}` : ""}${isMerge ? ", merge commit" : ""}`}
                className="focus-visible:outline-none group"
              >
                                                
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={HIT_TARGET_RADIUS}
                  fill="transparent"
                />

                                               
                {isMerge && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={MERGE_NODE_RADIUS}
                    fill="none"
                    stroke={node.branchColor}
                    strokeWidth={2}
                    opacity={isDimmed ? 0.25 : 1}
                  />
                )}

                                        
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isMerge ? 4 : NODE_RADIUS}
                  fill={node.branchColor}
                  stroke="#0a0a0a"
                  strokeWidth={1.5}
                  opacity={isDimmed ? 0.25 : 1}
                  className="transition-opacity duration-150"
                />

                                               
                {isBranchTip && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS + 3}
                    fill="none"
                    stroke={node.branchColor}
                    strokeWidth={1}
                    opacity={isNodeHighlighted || highlightedBranch === null ? 0.5 : 0.1}
                    className="motion-safe:animate-ping"
                    style={{ animationDuration: "2s" }}
                  />
                )}

                                           
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 5}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth={2}
                  opacity={0}
                  className="group-focus-visible:opacity-100"
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});

GitGraphColumn.displayName = "GitGraphColumn";

/**
 * Renders inline branch name pill badges next to commit summaries or graph rows.
 *
 * @param props - Component props containing branch names and theme color.
 * @param props.branchNames - Array of branch reference names (e.g. `['main', 'feat/auth']`).
 * @param props.color - Hex or CSS color string used for badge borders, text, and background tint.
 * @returns The rendered branch badge pills or `null` if no branch names are provided.
 */
export function BranchLabel({
  branchNames,
  color,
}: {
  branchNames: string[];
  color: string;
}) {
  if (branchNames.length === 0) return null;

  return (
    <span className="hidden sm:inline-flex items-center gap-1 ml-1.5">
      {branchNames.map((name) => (
        <span
          key={name}
          className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium border"
          style={{
            color,
            borderColor: `${color}40`,
            backgroundColor: `${color}15`,
          }}
        >
          {name}
        </span>
      ))}
    </span>
  );
}
