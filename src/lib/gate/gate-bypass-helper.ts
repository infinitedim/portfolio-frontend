import { gateClient } from "./gate-client";
import { GATE_L1_USERNAME, GATE_L2_USERNAME } from "./types";

export interface BypassProgress {
  step:
    | "idle"
    | "level1"
    | "fetching_l2_pass"
    | "level2"
    | "level3"
    | "unlocking"
    | "success"
    | "error";
  message: string;
}

function decodeEncodedSecret(encoded: string): string {
  // Reverse the encoding: hex -> string -> reverse -> base64 decode
  const hexPairs = encoded.match(/.{2}/g) ?? [];
  const chars = hexPairs.map((hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  const reversed = chars.join("");
  const base64 = reversed.split("").reverse().join("");
  return atob(base64);
}

export async function runRecruiterBypass(
  onProgress?: (progress: BypassProgress) => void,
): Promise<void> {
  try {
    // 1. Level 1
    onProgress?.({ step: "level1", message: "Authenticating Level 1..." });
    await gateClient.login({
      level: 1,
      username: GATE_L1_USERNAME,
      password: GATE_L1_USERNAME, // default is the same as username
    });

    // 2. Fetch L2 Password
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

    // 3. Level 2
    onProgress?.({ step: "level2", message: "Authenticating Level 2..." });
    await gateClient.login({
      level: 2,
      username: GATE_L2_USERNAME,
      password: l2Password,
    });

    // 4. Level 3 — decode the encoded secret
    onProgress?.({
      step: "level3",
      message: "Decoding Level 3 challenge...",
    });
    const challenge = await gateClient.getLevel3Challenge();
    const decoded = decodeEncodedSecret(challenge.encodedSecret);
    await gateClient.completeLevel3(decoded);

    // 5. Unlock
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
