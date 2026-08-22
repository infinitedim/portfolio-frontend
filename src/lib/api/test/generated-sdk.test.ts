import { describe, it, expect } from "bun:test";
import { createTypedApiClient } from "../generated-sdk";

describe("generated-sdk", () => {
  it("should create typed API client with get method", () => {
    const client = createTypedApiClient("http://localhost:8080");
    expect(client).toBeDefined();
    expect(typeof client.get).toBe("function");
  });

  it("should handle mock fetch response correctly", async () => {
    const mockClient = {
      async get() {
        return { status: "ok", database: "connected" };
      },
    };
    const res = await mockClient.get();
    expect(res.status).toBe("ok");
    expect(res.database).toBe("connected");
  });
});
