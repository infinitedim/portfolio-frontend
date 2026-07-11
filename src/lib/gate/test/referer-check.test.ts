import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getTerminalRefererUrl,
  isValidTerminalReferer,
} from "../referer-check";

describe("referer-check", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  afterEach(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
    }
    delete process.env.VERCEL_URL;
  });

  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://infinitedim.dev";
  });

  it("builds terminal referer URL", () => {
    expect(getTerminalRefererUrl()).toBe("https://infinitedim.dev/terminal");
  });

  it("accepts valid terminal referer", () => {
    expect(isValidTerminalReferer("https://infinitedim.dev/terminal")).toBe(
      true,
    );
    expect(isValidTerminalReferer("https://infinitedim.dev/terminal/")).toBe(
      true,
    );
  });

  it("rejects invalid referer", () => {
    expect(isValidTerminalReferer("https://infinitedim.dev/gate/3")).toBe(
      false,
    );
    expect(isValidTerminalReferer(null)).toBe(false);
  });
});
