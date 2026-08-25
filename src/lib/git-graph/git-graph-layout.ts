import type { GitHubCommitSummary, GitHubBranchResponse } from "@/lib/api/commit-service";
import { getBranchColor } from "./git-graph-colors";

/**
 * Classification types for Git commit nodes in visual graph rendering.
 */
export type GitNodeType = "regular" | "merge" | "initial" | "branch-tip";

/**
 * Positioned commit node within the topological git graph.
 */
export interface GraphNode {
  /** Full 40-character commit SHA identifier */
  sha: string;
  /** Truncated 7-character commit SHA */
  shortSha: string;
  /** Zero-indexed horizontal track or lane number */
  lane: number;
  /** Zero-indexed vertical row index */
  row: number;
  /** Computed horizontal X coordinate in pixels */
  x: number;
  /** Computed vertical Y coordinate in pixels */
  y: number;
  /** Classification type of the Git node */
  type: GitNodeType;
  /** Array of parent commit SHA strings */
  parents: string[];
  /** Array of child commit SHA strings */
  children: string[];
  /** Primary branch name associated with this node */
  branchName?: string;
  /** Hex color code designated for this node's branch */
  branchColor: string;
  /** All branch reference names pointing to this commit */
  branchRefs: string[];
}

/**
 * Directed edge connecting two commit nodes in the topological git graph.
 */
export interface GraphEdge {
  /** Originating commit SHA (child or newer commit) */
  fromSha: string;
  /** Destination commit SHA (parent or older commit) */
  toSha: string;
  /** Start coordinate for rendering the edge */
  from: { x: number; y: number };
  /** End coordinate for rendering the edge */
  to: { x: number; y: number };
  /** Edge curve shape type */
  type: "straight" | "merge-curve" | "fork-curve";
  /** Hex color assigned to the edge path */
  branchColor: string;
  /** Associated Git branch name */
  branchName: string;
}

/**
 * Complete computed geometric layout representation of a git commit history graph.
 */
export interface GraphLayout {
  /** Mapping of commit SHAs to positioned GraphNode instances */
  nodes: Map<string, GraphNode>;
  /** Ordered list of commit SHAs matching row sequence */
  orderedShas: string[];
  /** Collection of directed edges connecting nodes */
  edges: GraphEdge[];
  /** Maximum number of concurrent horizontal lanes required */
  maxLanes: number;
  /** Total number of rows in the graph */
  totalRows: number;
}

/**
 * Configuration options for sizing and positioning graph layout elements.
 */
export interface LayoutOptions {
  /** Width in pixels for each branch lane track */
  laneWidth?: number;
  /** Height in pixels between commit rows */
  rowHeight?: number;
  /** Vertical offset applied to node circles */
  nodeYOffset?: number;
  /** Custom explicit Y coordinates for specific commit SHAs */
  customNodeYMap?: Map<string, number>;
}

/** Default horizontal width allocated per lane in pixels */
const DEFAULT_LANE_WIDTH = 22;
/** Default vertical height between commit rows in pixels */
const DEFAULT_ROW_HEIGHT = 88;

/**
 * Computes the SVG X coordinate for a node based on its lane index, total lanes, and lane width.
 * @param lane - Zero-indexed lane index of the commit node.
 * @param maxLanes - Total number of active lanes in the layout.
 * @param laneWidth - Width in pixels allocated per lane track.
 * @returns Computed pixel X coordinate.
 */
export function getLaneX(lane: number, maxLanes: number, laneWidth: number): number {
  const reversedLane = Math.max(0, maxLanes - 1 - lane);
  return reversedLane * laneWidth + laneWidth / 2 + 6;
}

/**
 * Aggregates branch heads into a map of commit SHA to array of branch names.
 * @param branches - Array of branch descriptors returned by the GitHub API.
 * @returns Map where keys are commit SHAs and values are arrays of branch names.
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
 * Computes the geometric layout for a sequence of Git commits, assigning lanes, coordinates, and connecting edges.
 * @param commits - Chronologically ordered array of commit summaries to lay out.
 * @param branchRefs - Map of commit SHAs to branch reference names.
 * @param options - Optional layout tuning parameters.
 * @returns Layout model containing nodes, edges, ordered SHAs, and lane boundaries.
 */
export function computeGraphLayout(
  commits: GitHubCommitSummary[],
  branchRefs: Map<string, string[]>,
  options?: LayoutOptions,
): GraphLayout {
  const laneWidth = options?.laneWidth ?? DEFAULT_LANE_WIDTH;
  const rowHeight = options?.rowHeight ?? DEFAULT_ROW_HEIGHT;
  const nodeYOffset = options?.nodeYOffset ?? Math.min(26, rowHeight / 2);
  const customNodeYMap = options?.customNodeYMap;

  if (commits.length === 0) {
    return { nodes: new Map(), orderedShas: [], edges: [], maxLanes: 1, totalRows: 0 };
  }

  const nodes = new Map<string, GraphNode>();
  const childrenMap = new Map<string, string[]>();

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

    const branchName = refs[0] || "";

    const customY = customNodeYMap?.get(commit.sha);
    const nodeY = customY !== undefined ? customY : i * rowHeight + nodeYOffset;

    nodes.set(commit.sha, {
      sha: commit.sha,
      shortSha: commit.shortSha,
      lane: 0,
      row: i,
      x: 0,
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

  const activeLanes = new Map<string, number>();
  const usedLanes = new Set<number>();
  let maxLane = 0;

  /**
   * Finds the lowest unused lane index available for allocation.
   *
   * @returns Next available zero-indexed lane number.
   */
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

  for (const node of nodes.values()) {
    node.x = getLaneX(node.lane, totalLanes, laneWidth);
  }

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
