import type { Route } from "next";

export interface GateStatus {
  unlocked: boolean;
  currentLevel: number;
  completedLevels: number[];
}

export interface VerifyRequest {
  level: number;
  answer: string;
  meta?: Record<string, unknown>;
}

export interface VerifyResponse {
  passed: boolean;
  nextLevel?: number;
  attempts?: number;
  hint?: string;
}

export interface StubRequest {
  content: string;
}

export interface StubResponse {
  md5: string;
  suggestedFilename: string;
}

export interface ManifestRequest {
  filename: string;
  signature: string;
}

export interface TriggerRequest {
  filename: string;
}

export interface TriggerResponse {
  token: string;
  message: string;
}

export interface CrashRequest {
  input: string;
}

export interface CrashResponse {
  eipOffset: number;
  message: string;
}

export interface RunRequest {
  payload: string;
}

export interface RunResponse {
  password: string;
}

export interface UnlockResponse {
  unlocked: boolean;
}

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
