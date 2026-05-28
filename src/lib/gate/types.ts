import type { Route } from "next";

export interface GateStatus {
  unlocked: boolean;
  currentLevel: number;
  completedLevels: number[];
}

export interface LoginRequest {
  level: number;
  username: string;
  password: string;
}

export interface LoginResponse {
  passed: boolean;
  nextLevel?: number;
  attempts?: number;
  hint?: string;
}

export interface CompleteLevel3Response {
  passed: boolean;
}

export interface UnlockResponse {
  unlocked: boolean;
}

export const GATE_L1_USERNAME = "yourbloo0";
export const GATE_L2_USERNAME = "yourbloo1";

export function gateLevelRoute(level: number): Route {
  switch (level) {
    case 2:
      return "/gate/2";
    case 3:
      return "/gate/3";
    default:
      return "/gate/1";
  }
}
