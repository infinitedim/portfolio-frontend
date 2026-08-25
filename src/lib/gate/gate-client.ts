import type {
  CompleteLevel3Response,
  GateStatus,
  Level3Challenge,
  LoginRequest,
  LoginResponse,
  UnlockResponse,
} from "./types";

/**
 * Internal HTTP client helper that performs credentialed JSON requests to local Gate API endpoints.
 * @template T - Expected response data type.
 * @param path - The relative API endpoint path to request.
 * @param init - Optional RequestInit options such as headers, method, and body.
 * @returns A promise resolving to the parsed JSON response body.
 * @throws {Error} If the HTTP response status is not ok.
 */
async function gateFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text || `Gate API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Client-side API interface for interacting with the portfolio gate service, managing authentication, challenge solving, and unlocking.
 */
export const gateClient = {
  /**
   * Fetches the current gate authentication status, completed challenge levels, and unlocked state.
   * @returns A promise resolving to the current GateStatus.
   */
  getStatus(): Promise<GateStatus> {
    return gateFetch<GateStatus>("/api/gate/status");
  },

  /**
   * Submits credentials to authenticate a specific gate challenge level (e.g., Level 1 or Level 2).
   * @param body - Login request containing target level, username, and password.
   * @returns A promise resolving to the LoginResponse with updated status.
   */
  login(body: LoginRequest): Promise<LoginResponse> {
    return gateFetch<LoginResponse>("/api/gate/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /**
   * Retrieves the obfuscated secret challenge payload for Level 3.
   * @returns A promise resolving to the Level3Challenge containing the encoded secret.
   */
  getLevel3Challenge(): Promise<Level3Challenge> {
    return gateFetch<Level3Challenge>("/api/gate/challenge/3/encoded");
  },

  /**
   * Submits the decoded secret token to complete Level 3.
   * @param secret - The decoded plaintext secret.
   * @returns A promise resolving to CompleteLevel3Response confirming validation.
   */
  completeLevel3(secret: string): Promise<CompleteLevel3Response> {
    return gateFetch<CompleteLevel3Response>("/api/gate/complete/3", {
      method: "POST",
      body: JSON.stringify({ secret }),
    });
  },

  /**
   * Finalizes the unlocking procedure after all prerequisite challenge levels are completed, setting the gate unlock cookie.
   * @returns A promise resolving to UnlockResponse confirming full portfolio unlock.
   */
  unlock(): Promise<UnlockResponse> {
    return gateFetch<UnlockResponse>("/api/gate/unlock", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
