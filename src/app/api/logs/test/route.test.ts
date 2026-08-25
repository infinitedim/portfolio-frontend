

import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { POST } from "../route";

if (typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" || typeof (jest as unknown as Record<string, unknown>).mock !== "function") (jest as unknown as Record<string, unknown>).mock = () => undefined;

mock.module("next/server", () => ({
  /**
   *
   */
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers as Record<string, string>),
        },
      }),
  },
}));

mock.module("@/lib/logger/server-logger", () => ({
  createServerLogger: () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    logClientLogs: jest.fn(),
  }),
}));

/**
 * Creates a mock Request object configured for POST /api/logs tests.
 *
 * @param body - The JSON payload to serialize into the request body.
 * @param headers - Optional HTTP headers to include in the request.
 * @returns A Request configured with JSON headers and serialized body.
 */
function createMockRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost:3000/api/logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/logs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 when Content-Type is not application/json", async () => {
    const req = new Request("http://localhost:3000/api/logs", {
      method: "POST",
      headers: {},
      body: JSON.stringify({ logs: [] }),
    });
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("application/json");
  });

  it("should return 400 when body is invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("should return 400 when body does not contain logs array", async () => {
    const req = createMockRequest({});
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("logs");
  });

  it("should return 400 when logs is not an array", async () => {
    const req = createMockRequest({ logs: "not-array" });
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("array");
  });

  it("should return 202 and accept valid log entries", async () => {
    const validLogs = [
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Test message",
      },
    ];
    const req = createMockRequest({ logs: validLogs });
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data).toHaveProperty("received", 1);
    expect(data).toHaveProperty("processed", 1);
    expect(data.success).toBe(true);
  });

  it("should accept valid entries and report invalid count for bad entries", async () => {
    const mixedLogs = [
      { timestamp: new Date().toISOString(), level: "info", message: "ok" },
      { invalid: "entry" },
    ];
    const req = createMockRequest({ logs: mixedLogs });
    const res = await POST(req as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.processed).toBe(1);
    expect(data.invalid).toBe(1);
  });
});
