import { describe, it, expect, mock } from "bun:test";
import { gateClient } from "../gate-client";

describe("gate-client", () => {
  it("getStatus should fetch /api/gate/status", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ currentLevel: 1, unlocked: false, completedLevels: [] }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const status = await gateClient.getStatus();
      expect(status.currentLevel).toBe(1);
      expect(status.unlocked).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("login should POST /api/gate/login with credentials", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ passed: true, nextLevel: 2 }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await gateClient.login({ level: 1, username: "yourblooo0", password: "p1" });
      expect(res.passed).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getLevel3Challenge should fetch /api/gate/challenge/3/encoded", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ encodedSecret: "secret-abc", algorithm: "base64" }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await gateClient.getLevel3Challenge();
      expect(res.encodedSecret).toBe("secret-abc");
      expect(res.algorithm).toBe("base64");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("completeLevel3 should POST /api/gate/complete/3", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ passed: true }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await gateClient.completeLevel3("secret-123");
      expect(res.passed).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("unlock should POST /api/gate/unlock", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ unlocked: true }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await gateClient.unlock();
      expect(res.unlocked).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should throw error when gate response is not ok", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response("Invalid credentials", { status: 401, statusText: "Unauthorized" })
    ) as unknown as typeof fetch;

    try {
      await expect(gateClient.login({ level: 1, username: "u", password: "w" })).rejects.toThrow("Invalid credentials");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
