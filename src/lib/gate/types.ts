import type { Route } from "next";

/**
 * Status payload describing the current state of gate challenges and overall unlock status.
 */
export interface GateStatus {
  /**
   * Whether the portfolio gate is completely unlocked.
   */
  unlocked: boolean;
  /**
   * The next or current active challenge level (1, 2, 3).
   */
  currentLevel: number;
  /**
   * List of challenge level numbers that have been successfully completed.
   */
  completedLevels: number[];
}

/**
 * Credentials and target level submitted when attempting a gate login challenge.
 */
export interface LoginRequest {
  /**
   * Gate challenge level number (e.g. 1, 2).
   */
  level: number;
  /**
   * Username credential submitted for the challenge.
   */
  username: string;
  /**
   * Password credential submitted for the challenge.
   */
  password: string;
}

/**
 * Result payload returned by the gate login endpoint.
 */
export interface LoginResponse {
  /**
   * Whether the submitted credentials successfully passed the challenge level.
   */
  passed: boolean;
  /**
   * The next challenge level unlocked, if authentication succeeded.
   */
  nextLevel?: number;
  /**
   * Count of attempts performed for this level.
   */
  attempts?: number;
  /**
   * Optional hint provided when authentication fails.
   */
  hint?: string;
}

/**
 * Result payload returned upon validating the Level 3 secret challenge token.
 */
export interface CompleteLevel3Response {
  /**
   * Whether the submitted secret was accepted and valid.
   */
  passed: boolean;
  /**
   * Number of validation attempts made.
   */
  attempts?: number;
  /**
   * Optional hint if the submitted token was invalid.
   */
  hint?: string;
}

/**
 * Challenge payload issued for Level 3 containing obfuscated secret data.
 */
export interface Level3Challenge {
  /**
   * Obfuscated or encoded secret string to decode.
   */
  encodedSecret: string;
  /**
   * Algorithm description or identifier used for encoding.
   */
  algorithm: string;
}

/**
 * Response payload returned after calling the final gate unlock endpoint.
 */
export interface UnlockResponse {
  /**
   * Whether the entire portfolio gate was successfully set to unlocked.
   */
  unlocked: boolean;
}

/**
 * Standard default username credential for Level 1 gate authentication.
 */
export const GATE_L1_USERNAME = "yourblooo0";

/**
 * Standard default username credential for Level 2 gate authentication.
 */
export const GATE_L2_USERNAME = "yourblooo1";

/**
 * Maps a given numeric challenge level to its corresponding Next.js internal route path.
 * @param level - Numeric challenge level index (e.g., 1, 2, 3).
 * @returns Type-safe Next.js Route path string (e.g., '/gate/1', '/gate/2', '/gate/3').
 */
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
