import { describe, it, expect, mock } from "bun:test";
import {
  subscribeNewsletter,
  confirmNewsletter,
  unsubscribeNewsletter,
  listNewsletterSubscribers,
  broadcastNewsletter,
} from "../newsletter-service";
import { authService } from "@/lib/auth/auth-service";

describe("newsletter-service", () => {
  it("should send subscribe request and return json response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ success: true, message: "Subscribed" }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await subscribeNewsletter("dev@example.com");
      expect(res.success).toBe(true);
      expect(res.message).toBe("Subscribed");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should throw error when subscribe endpoint fails", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 })
    ) as unknown as typeof fetch;

    try {
      await expect(subscribeNewsletter("invalid-email")).rejects.toThrow("Invalid email");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should send confirm request with query token", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ success: true, message: "Confirmed" }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await confirmNewsletter("sample-token-123");
      expect(res.success).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should send unsubscribe request with payload token", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ success: true, message: "Unsubscribed" }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await unsubscribeNewsletter("sample-token-123");
      expect(res.success).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should fetch subscriber list using authedFetch", async () => {
    const originalFetch = globalThis.fetch;
    const originalGetToken = authService.getAccessToken;
    authService.getAccessToken = () => "mock-admin-token";

    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await listNewsletterSubscribers();
      expect(res.total).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
      authService.getAccessToken = originalGetToken;
    }
  });

  it("should send broadcast newsletter using authedFetch", async () => {
    const originalFetch = globalThis.fetch;
    const originalGetToken = authService.getAccessToken;
    authService.getAccessToken = () => "mock-admin-token";

    globalThis.fetch = mock(
      async () => new Response(JSON.stringify({ sent: 5, failed: 0 }), { status: 200 })
    ) as unknown as typeof fetch;

    try {
      const res = await broadcastNewsletter({ subject: "Test", body: "Content" });
      expect(res.sent).toBe(5);
    } finally {
      globalThis.fetch = originalFetch;
      authService.getAccessToken = originalGetToken;
    }
  });
});
