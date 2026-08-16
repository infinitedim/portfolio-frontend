"use client";

/**
 * GitGraphRow — Row-slice SVG renderer for a single commit row.
 *
 * Renders the graph segment for one commit row: the commit node,
 * pass-through lane lines, and branch/merge curve paths.
 * Each row renders only its own tiny SVG segment (Row-Slice Technique)
 * for lightweight DOM and smooth scrolling.
 */

import { memo, useCallback } from "react";
import type { GraphNode, GraphEdge } from "@/lib/git-graph";

interface GitGraphRowProps {
  node: GraphNode;
  /** Edges that touch this row (start, end, or pass through) */
  edges: GraphEdge[];
  /** Lanes with active pass-through branch lines at this row */
  activeLanes: { lane: number; color: string }[];
  maxLanes: number;
  rowHeight: number;
  laneWidth: number;
  highlightedBranch: string | null;
  onNodeClick: (sha: string) => void;
  onBranchHover: (branchName: string | null) => void;
}

/**
 * Generate an SVG path string for a curved edge (merge or fork).
 * Uses cubic bezier curves for smooth branch connections.
 */
function buildEdgePath(
  edge: GraphEdge,
  rowIndex: number,
  rowHeight: number,
): string {
  // Convert absolute coordinates to row-local coordinates
  const rowTop = rowIndex * rowHeight;
  const fromY = edge.from.y - rowTop;
  const toY = edge.to.y - rowTop;
  const fromX = edge.from.x;
  const toX = edge.to.x;

  if (edge.type === "straight") {
    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }

  // Cubic bezier for merge/fork curves
  const midY = (fromY + toY) / 2;
  return `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
}

const NODE_RADIUS = 5;
const MERGE_NODE_RADIUS = 7;
const HIT_TARGET_RADIUS = 22; // 44×44px touch target

export const GitGraphRow = memo(function GitGraphRow({
  node,
  edges,
  activeLanes,
  maxLanes,
  rowHeight,
  laneWidth,
  highlightedBranch,
  onNodeClick,
  onBranchHover,
}: GitGraphRowProps) {
  const svgWidth = Math.max(maxLanes * laneWidth, laneWidth);
  const halfRow = rowHeight / 2;
  const isHighlighted =
    highlightedBranch !== null && node.branchName === highlightedBranch;
  const isDimmed =
    highlightedBranch !== null && node.branchName !== highlightedBranch;

  const handleNodeClick = useCallback(() => {
    onNodeClick(node.sha);
  }, [onNodeClick, node.sha]);

  const handleNodeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onNodeClick(node.sha);
      }
    },
    [onNodeClick, node.sha],
  );

  const handleMouseEnter = useCallback(() => {
    onBranchHover(node.branchName || null);
  }, [onBranchHover, node.branchName]);

  const handleMouseLeave = useCallback(() => {
    onBranchHover(null);
  }, [onBranchHover]);

  // Node position is at (node.x, halfRow) within the row-local SVG
  const nodeX = node.lane * laneWidth + laneWidth / 2;
  const isMerge = node.type === "merge";
  const isBranchTip = node.type === "branch-tip";
  const radius = isMerge ? MERGE_NODE_RADIUS : NODE_RADIUS;

  return (
    <svg
      width={svgWidth}
      height={rowHeight}
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Pass-through lane lines (vertical lines for branches passing through this row) */}
      {activeLanes.map(({ lane, color }) => {
        const x = lane * laneWidth + laneWidth / 2;
        const isLaneHighlighted =
          highlightedBranch !== null &&
          edges.some(
            (e) => e.branchName === highlightedBranch &&
              (Math.abs(e.from.x - x) < 2 || Math.abs(e.to.x - x) < 2),
          );
        const laneOpacity =
          highlightedBranch === null
            ? 0.5
            : isLaneHighlighted
              ? 0.9
              : 0.15;
        const strokeW = isLaneHighlighted ? 2.5 : 1.5;

        return (
          <line
            key={`lane-${lane}`}
            x1={x}
            y1={0}
            x2={x}
            y2={rowHeight}
            stroke={color}
            strokeWidth={strokeW}
            strokeOpacity={laneOpacity}
            strokeLinecap="round"
          />
        );
      })}

      {/* Edge paths (branch/merge curves that start or end at this row) */}
      {edges
        .filter((edge) => {
          // Only render edges that have an endpoint in this row
          const rowTop = node.row * rowHeight;
          const rowBottom = (node.row + 1) * rowHeight;
          return (
            (edge.from.y >= rowTop && edge.from.y <= rowBottom) ||
            (edge.to.y >= rowTop && edge.to.y <= rowBottom)
          );
        })
        .map((edge) => {
          const isEdgeHighlighted =
            highlightedBranch !== null &&
            edge.branchName === highlightedBranch;
          const edgeOpacity =
            highlightedBranch === null
              ? 0.6
              : isEdgeHighlighted
                ? 1
                : 0.12;

          return (
            <path
              key={`edge-${edge.fromSha}-${edge.toSha}`}
              d={buildEdgePath(edge, node.row, rowHeight)}
              fill="none"
              stroke={edge.branchColor}
              strokeWidth={isEdgeHighlighted ? 2.5 : 1.5}
              strokeOpacity={edgeOpacity}
              strokeLinecap="round"
            />
          );
        })}

      {/* Commit node */}
      <g
        style={{ cursor: "pointer" }}
        onClick={handleNodeClick}
        onKeyDown={handleNodeKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        role="button"
        aria-label={`Commit ${node.shortSha}${node.branchRefs.length > 0 ? ` on ${node.branchRefs.join(", ")}` : ""}${isMerge ? ", merge commit" : ""}`}
        className="focus-visible:outline-none"
      >
        {/* Invisible hit target for touch accessibility (44×44px) */}
        <circle
          cx={nodeX}
          cy={halfRow}
          r={HIT_TARGET_RADIUS}
          fill="transparent"
        />

        {/* Merge commit: outer ring */}
        {isMerge && (
          <circle
            cx={nodeX}
            cy={halfRow}
            r={MERGE_NODE_RADIUS}
            fill="none"
            stroke={node.branchColor}
            strokeWidth={2}
            opacity={isDimmed ? 0.25 : 1}
          />
        )}

        {/* Node circle */}
        <circle
          cx={nodeX}
          cy={halfRow}
          r={isMerge ? 4 : NODE_RADIUS}
          fill={node.branchColor}
          stroke="#0a0a0a"
          strokeWidth={1.5}
          opacity={isDimmed ? 0.25 : 1}
        />

        {/* Branch tip: pulsing glow ring */}
        {isBranchTip && (
          <circle
            cx={nodeX}
            cy={halfRow}
            r={NODE_RADIUS + 3}
            fill="none"
            stroke={node.branchColor}
            strokeWidth={1}
            opacity={isHighlighted || highlightedBranch === null ? 0.5 : 0.1}
            className="motion-safe:animate-ping"
            style={{ animationDuration: "2s" }}
          />
        )}

        {/* Focus ring (visible on keyboard focus) */}
        <circle
          cx={nodeX}
          cy={halfRow}
          r={radius + 5}
          fill="none"
          stroke="#34d399"
          strokeWidth={2}
          opacity={0}
          className="group-focus-visible:opacity-100"
        />
      </g>
    </svg>
  );
});

GitGraphRow.displayName = "GitGraphRow";
