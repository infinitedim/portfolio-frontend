"use client";

import { memo, useCallback } from "react";
import type { GraphNode, GraphEdge } from "@/lib/git-graph";

/**
 * Props for the {@link GitGraphRow} SVG rendering component.
 */
interface GitGraphRowProps {
  /** The graph node representing the commit at this specific row. */
  node: GraphNode;
  /** All graph edges that intersect with or connect to this row's commit. */
  edges: GraphEdge[];
  /** List of active vertical branch lanes and their assigned stroke colors passing through this row. */
  activeLanes: { lane: number; color: string }[];
  /** Maximum number of concurrent branch lanes across the entire graph to determine SVG width. */
  maxLanes: number;
  /** Vertical height in pixels allocated for this graph row. */
  rowHeight: number;
  /** Horizontal width in pixels allocated per branch lane column. */
  laneWidth: number;
  /** Currently active or hovered branch name used for visual highlighting and dimming, or null. */
  highlightedBranch: string | null;
  /** Callback fired when a commit node is clicked or activated via Enter/Space key. */
  onNodeClick: (sha: string) => void;
  /** Callback fired when hovering over or leaving a commit node with its branch name or null. */
  onBranchHover: (branchName: string | null) => void;
}

/**
 * Generates an SVG path data string (`d` attribute) for a graph edge relative to the current row.
 *
 * @param edge - The graph edge connecting two commits with source and destination coordinates.
 * @param rowIndex - The zero-based row index for calculating local coordinate offsets.
 * @param rowHeight - The pixel height of a single row.
 * @returns An SVG path definition string rendering a straight line or cubic Bézier curve.
 */
function buildEdgePath(
  edge: GraphEdge,
  rowIndex: number,
  rowHeight: number,
): string {
  const rowTop = rowIndex * rowHeight;
  const fromY = edge.from.y - rowTop;
  const toY = edge.to.y - rowTop;
  const fromX = edge.from.x;
  const toX = edge.to.x;

  if (edge.type === "straight") {
    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }

  const midY = (fromY + toY) / 2;
  return `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
}

/**
 * Default pixel radius for standard commit nodes.
 */
const NODE_RADIUS = 5;

/**
 * Outer pixel radius for merge commit ring indicators.
 */
const MERGE_NODE_RADIUS = 7;

/**
 * Hit target pixel radius to facilitate easy cursor and touch selection on small commit dots.
 */
const HIT_TARGET_RADIUS = 22;

/**
 * Renders a single row in an SVG-based interactive Git commit graph.
 *
 * @description Displays active vertical branch lanes, incoming and outgoing connecting
 * curve/straight paths, and interactive commit node markers with support for hover highlighting,
 * keyboard accessibility, and merge/branch-tip animations.
 *
 * @param props - Component properties conforming to {@link GitGraphRowProps}.
 * @returns An SVG element representing a single row in the git graph visualization.
 */
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

      {edges
        .filter((edge) => {
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
        <circle
          cx={nodeX}
          cy={halfRow}
          r={HIT_TARGET_RADIUS}
          fill="transparent"
        />

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

        <circle
          cx={nodeX}
          cy={halfRow}
          r={isMerge ? 4 : NODE_RADIUS}
          fill={node.branchColor}
          stroke="#0a0a0a"
          strokeWidth={1.5}
          opacity={isDimmed ? 0.25 : 1}
        />

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
