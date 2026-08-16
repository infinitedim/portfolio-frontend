/**
 * Git Graph Layout Engine
 *
 * Pure-logic module (zero DOM/React dependencies) that transforms a flat
 * GitHubCommitSummary[] array into renderable graph data with lane assignments,
 * coordinates, and edge descriptors.
 *
 * Reversal Rule:
 * - Lane 0 (main branch) is placed on the RIGHTMOST position of the graph column
 *   (closest to the commit cards).
 * - Feature branches (lane 1, 2...) branch out to the LEFT.
 */

import type { GitHubCommitSummary, GitHubBranchResponse } from "@/lib/api/commit-service";
import { getBranchColor } from "./git-graph-colors";

// ─── Types ───────────────────────────────────────────────────────────

export type GitNodeType = "regular" | "merge" | "initial" | "branch-tip";

export interface GraphNode {
  sha: string;
  shortSha: string;
  lane: number;
  row: number;
  x: number;
  y: number;
  type: GitNodeType;
  parents: string[];
  children: string[];
  branchName?: string;
  branchColor: string;
  /** All branch names pointing at this commit (for tip labels) */
  branchRefs: string[];
}

export interface GraphEdge {
  fromSha: string;
  toSha: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: "straight" | "merge-curve" | "fork-curve";
  branchColor: string;
  branchName: string;
}

export interface GraphLayout {
  nodes: Map<string, GraphNode>;
  /** Ordered list of node SHAs matching the commit display order */
  orderedShas: string[];
  edges: GraphEdge[];
  maxLanes: number;
  totalRows: number;
}

export interface LayoutOptions {
  laneWidth?: number;
  rowHeight?: number;
  nodeYOffset?: number;
  customNodeYMap?: Map<string, number>;
}

const DEFAULT_LANE_WIDTH = 22;
const DEFAULT_ROW_HEIGHT = 88;

// ─── Layout Engine ───────────────────────────────────────────────────

/**
 * Calculate X coordinate for a lane.
 * Reversed layout: lane 0 (main) is rightmost, lane 1, 2... expand to the left.
 */
export function getLaneX(lane: number, maxLanes: number, laneWidth: number): number {
  const reversedLane = Math.max(0, maxLanes - 1 - lane);
  return reversedLane * laneWidth + laneWidth / 2 + 6;
}

/**
 * Build a branch ref map from branch responses.
 * Maps commit SHA → array of branch names pointing at that commit.
 */
export function buildBranchRefsMap(
  branches: GitHubBranchResponse[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const branch of branches) {
    const existing = map.get(branch.commitSha) || [];
    existing.push(branch.name);
    map.set(branch.commitSha, existing);
  }
  return map;
}

/**
 * Compute the full graph layout from a list of commits.
 */
export function computeGraphLayout(
  commits: GitHubCommitSummary[],
  branchRefs: Map<string, string[]>,
  options?: LayoutOptions,
): GraphLayout {
  const laneWidth = options?.laneWidth ?? DEFAULT_LANE_WIDTH;
  const rowHeight = options?.rowHeight ?? DEFAULT_ROW_HEIGHT;
  // Node Y offset from top of row (default 26px aligns with card title line)
  const nodeYOffset = options?.nodeYOffset ?? Math.min(26, rowHeight / 2);
  const customNodeYMap = options?.customNodeYMap;

  if (commits.length === 0) {
    return { nodes: new Map(), orderedShas: [], edges: [], maxLanes: 1, totalRows: 0 };
  }

  // Step 1: Build nodes and parent→child links
  const nodes = new Map<string, GraphNode>();
  const childrenMap = new Map<string, string[]>(); // parent SHA → child SHAs

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const refs = branchRefs.get(commit.sha) || [];
    const parentShas = commit.parents?.map((p) => p.sha) || [];
    const isInitial = parentShas.length === 0;
    const isMerge = parentShas.length > 1;
    const isBranchTip = refs.length > 0;

    let type: GitNodeType = "regular";
    if (isBranchTip) type = "branch-tip";
    else if (isMerge) type = "merge";
    else if (isInitial) type = "initial";

    // Determine branch name
    const branchName = refs[0] || "";

    const customY = customNodeYMap?.get(commit.sha);
    const nodeY = customY !== undefined ? customY : i * rowHeight + nodeYOffset;

    nodes.set(commit.sha, {
      sha: commit.sha,
      shortSha: commit.shortSha,
      lane: 0, // assigned in step 2
      row: i,
      x: 0, // computed in step 3
      y: nodeY,
      type,
      parents: parentShas,
      children: [],
      branchName,
      branchColor: branchName ? getBranchColor(branchName) : getBranchColor("main"),
      branchRefs: refs,
    });

    for (const parentSha of parentShas) {
      const existing = childrenMap.get(parentSha) || [];
      existing.push(commit.sha);
      childrenMap.set(parentSha, existing);
    }
  }

  for (const [parentSha, children] of childrenMap) {
    const parentNode = nodes.get(parentSha);
    if (parentNode) {
      parentNode.children = children;
    }
  }

  // Step 2: Lane assignment
  const activeLanes = new Map<string, number>(); // tracking key → lane
  const usedLanes = new Set<number>();
  let maxLane = 0;

  function getNextFreeLane(): number {
    let lane = 0;
    while (usedLanes.has(lane)) lane++;
    return lane;
  }

  for (const commit of commits) {
    const node = nodes.get(commit.sha);
    if (!node) continue;

    const parentShas = node.parents;
    let assignedLane: number | undefined;

    for (const [key, lane] of activeLanes) {
      if (key === commit.sha) {
        assignedLane = lane;
        activeLanes.delete(key);
        break;
      }
    }

    if (assignedLane === undefined) {
      assignedLane = getNextFreeLane();
    }

    usedLanes.add(assignedLane);
    node.lane = assignedLane;
    if (assignedLane > maxLane) maxLane = assignedLane;

    if (parentShas.length > 0) {
      const firstParent = parentShas[0];
      if (!activeLanes.has(firstParent)) {
        activeLanes.set(firstParent, assignedLane);
      }

      for (let p = 1; p < parentShas.length; p++) {
        const mergeSha = parentShas[p];
        if (!activeLanes.has(mergeSha)) {
          const mergeLane = getNextFreeLane();
          usedLanes.add(mergeLane);
          activeLanes.set(mergeSha, mergeLane);
          if (mergeLane > maxLane) maxLane = mergeLane;
        }
      }
    } else {
      usedLanes.delete(assignedLane);
    }
  }

  const totalLanes = maxLane + 1;

  // Step 3: Compute X coordinates with REVERSED lane ordering
  for (const node of nodes.values()) {
    node.x = getLaneX(node.lane, totalLanes, laneWidth);
  }

  // Step 4: Generate edges
  const edges: GraphEdge[] = [];

  for (const node of nodes.values()) {
    for (let pi = 0; pi < node.parents.length; pi++) {
      const parentSha = node.parents[pi];
      const parentNode = nodes.get(parentSha);

      if (!parentNode) continue;

      const isSameLane = node.lane === parentNode.lane;
      const isMergeParent = pi > 0;

      let edgeType: GraphEdge["type"] = "straight";
      if (isMergeParent) {
        edgeType = "merge-curve";
      } else if (!isSameLane) {
        edgeType = "fork-curve";
      }

      edges.push({
        fromSha: node.sha,
        toSha: parentSha,
        from: { x: node.x, y: node.y },
        to: { x: parentNode.x, y: parentNode.y },
        type: edgeType,
        branchColor: isMergeParent ? parentNode.branchColor : node.branchColor,
        branchName: isMergeParent
          ? parentNode.branchName || node.branchName || ""
          : node.branchName || "",
      });
    }
  }

  const orderedShas = commits.map((c) => c.sha);

  return {
    nodes,
    orderedShas,
    edges,
    maxLanes: totalLanes,
    totalRows: commits.length,
  };
}
