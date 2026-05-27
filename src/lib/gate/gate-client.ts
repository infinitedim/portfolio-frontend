import { getApiUrl } from "@/lib/api/get-api-url";
import type {
  CrashRequest,
  CrashResponse,
  GateStatus,
  ManifestRequest,
  RunRequest,
  RunResponse,
  StubRequest,
  StubResponse,
  TriggerRequest,
  TriggerResponse,
  UnlockResponse,
  VerifyRequest,
  VerifyResponse,
} from "./types";

async function gateFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
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

  verify(body: VerifyRequest): Promise<VerifyResponse> {
    return gateFetch<VerifyResponse>("/api/gate/verify", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  unlock(): Promise<UnlockResponse> {
    return gateFetch<UnlockResponse>("/api/gate/unlock", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  l2Stub(body: StubRequest): Promise<StubResponse> {
    return gateFetch<StubResponse>("/api/gate/challenge/2/stub", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  l2Manifest(body: ManifestRequest): Promise<{ stored: boolean }> {
    return gateFetch<{ stored: boolean }>("/api/gate/challenge/2/manifest", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  l2Trigger(body: TriggerRequest): Promise<TriggerResponse> {
    return gateFetch<TriggerResponse>("/api/gate/challenge/2/trigger", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  l3Crash(body: CrashRequest): Promise<CrashResponse> {
    return gateFetch<CrashResponse>("/api/gate/challenge/3/crash", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  l3Run(body: RunRequest): Promise<RunResponse> {
    return gateFetch<RunResponse>("/api/gate/challenge/3/run", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
