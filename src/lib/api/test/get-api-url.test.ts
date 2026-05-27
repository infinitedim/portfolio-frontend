import { afterEach, describe, expect, it } from "vitest";
import { getApiUrl, getServerApiUrl } from "../get-api-url";
import { getSiteUrl } from "../get-site-url";

describe("getApiUrl", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("prefers NEXT_PUBLIC_API_URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    process.env.BACKEND_URL = "http://backend:8080";
    expect(getApiUrl()).toBe("https://api.example.com");
  });

  it("falls back to BACKEND_URL", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.BACKEND_URL = "http://backend:8080";
    expect(getApiUrl()).toBe("http://backend:8080");
  });

  it("defaults to localhost:8080", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.BACKEND_URL;
    expect(getApiUrl()).toBe("http://localhost:8080");
  });
});

describe("getServerApiUrl", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("prefers BACKEND_URL for server-side calls", () => {
    process.env.BACKEND_URL = "http://backend:8080";
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    expect(getServerApiUrl()).toBe("http://backend:8080");
  });
});

describe("getSiteUrl", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("prefers NEXT_PUBLIC_BASE_URL", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
    expect(getSiteUrl()).toBe("https://example.com");
  });

  it("falls back to NEXT_PUBLIC_SITE_URL", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://legacy.example.com";
    expect(getSiteUrl()).toBe("https://legacy.example.com");
  });

  it("defaults to localhost:3000", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
