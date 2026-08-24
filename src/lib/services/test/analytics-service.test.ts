import { describe, it, expect, mock } from "bun:test";
import { recordPageview } from "../analytics-service";

describe("analytics-service", () => {
  it("should send POST request to /api/analytics/pageview", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = mock(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await recordPageview({ path: "/blog/post-1", slug: "post-1" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should swallow fetch errors gracefully", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(async () => {
      throw new Error("Network error");
    }) as unknown as typeof fetch;

    try {
      await expect(recordPageview({ path: "/contact" })).resolves.toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
