import { gateClient } from "./gate-client";
import { GATE_L1_USERNAME, GATE_L2_USERNAME } from "./types";

/**
 * Tracks the sequential progress and status messages during the automated recruiter gate bypass process.
 */
export interface BypassProgress {
  /**
   * Current execution stage of the bypass sequence.
   */
  step:
    | "idle"
    | "level1"
    | "fetching_l2_pass"
    | "level2"
    | "level3"
    | "unlocking"
    | "success"
    | "error";
  /**
   * Human-readable status or error message for UI display.
   */
  message: string;
}

/**
 * Decodes an obfuscated hex-encoded, reversed, base64-encoded secret payload used in the Level 3 challenge.
 * @param encoded - Hex-encoded string representing a reversed base64 payload.
 * @returns Fully decoded plaintext secret string.
 */
function decodeEncodedSecret(encoded: string): string {
  const hexPairs = encoded.match(/.{2}/g) ?? [];
  const chars = hexPairs.map((hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  const reversed = chars.join("");
  const base64 = reversed.split("").reverse().join("");
  return atob(base64);
}

/**
 * Automates the multi-level authentication and challenge solving sequence to grant immediate access through the portfolio gate.
 * @param onProgress - Optional callback invoked as each stage of the bypass completes or fails.
 * @returns A promise that resolves when the gate is successfully unlocked.
 * @throws {Error} If any authentication, credential fetching, challenge decoding, or unlock request fails.
 */
export async function runRecruiterBypass(
  onProgress?: (progress: BypassProgress) => void,
): Promise<void> {
  try {
    onProgress?.({ step: "level1", message: "Authenticating Level 1..." });
    await gateClient.login({
      level: 1,
      username: GATE_L1_USERNAME,
      password: GATE_L1_USERNAME,
    });

    onProgress?.({
      step: "fetching_l2_pass",
      message: "Fetching Level 2 credentials...",
    });
    const response = await fetch("/s3cr3t/users.txt");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Level 2 credentials: ${response.statusText}`,
      );
    }
    const text = await response.text();
    const parts = text.trim().split(":");
    if (parts.length < 2) {
      throw new Error("Invalid credentials file format");
    }
    const l2Password = parts[1].trim();

    onProgress?.({ step: "level2", message: "Authenticating Level 2..." });
    await gateClient.login({
      level: 2,
      username: GATE_L2_USERNAME,
      password: l2Password,
    });

    onProgress?.({
      step: "level3",
      message: "Decoding Level 3 challenge...",
    });
    const challenge = await gateClient.getLevel3Challenge();
    const decoded = decodeEncodedSecret(challenge.encodedSecret);
    await gateClient.completeLevel3(decoded);

    onProgress?.({ step: "unlocking", message: "Unlocking terminal..." });
    await gateClient.unlock();

    onProgress?.({
      step: "success",
      message: "Access granted! Redirecting...",
    });
  } catch (error) {
    onProgress?.({
      step: "error",
      message: error instanceof Error ? error.message : "Bypass failed",
    });
    throw error;
  }
}
