   
                          
  
                                                                         
                                                                                
                                     
  
                 
                                                                                 
                                   
                                                            
   

import type { GitHubCommitSummary, GitHubBranchResponse } from "@/lib/api/commit-service";
import { getBranchColor } from "./git-graph-colors";

                                                                        

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

                                                                        

   
                                     
                                                                                
   
export function getLaneX(lane: number, maxLanes: number, laneWidth: number): number {
  const reversedLane = Math.max(0, maxLanes - 1 - lane);
  return reversedLane * laneWidth + laneWidth / 2 + 6;
}

   
                                                
                                                                   
   
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
