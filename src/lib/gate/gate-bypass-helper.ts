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

    // 4. Level 3
    onProgress?.({
      step: "level3",
      message: "Completing Level 3 challenge...",
    });
    await gateClient.completeLevel3();

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
