import type {
  CompleteLevel3Response,
  GateStatus,
  Level3Challenge,
  LoginRequest,
  LoginResponse,
  UnlockResponse,
} from "./types";

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

export const gateClient = {
  getStatus(): Promise<GateStatus> {
    return gateFetch<GateStatus>("/api/gate/status");
  },

  login(body: LoginRequest): Promise<LoginResponse> {
    return gateFetch<LoginResponse>("/api/gate/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getLevel3Challenge(): Promise<Level3Challenge> {
    return gateFetch<Level3Challenge>("/api/gate/challenge/3/encoded");
  },

  completeLevel3(secret: string): Promise<CompleteLevel3Response> {
    return gateFetch<CompleteLevel3Response>("/api/gate/complete/3", {
      method: "POST",
      body: JSON.stringify({ secret }),
    });
  },

  unlock(): Promise<UnlockResponse> {
    return gateFetch<UnlockResponse>("/api/gate/unlock", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
