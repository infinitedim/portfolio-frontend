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
    process.env.NEXT_PUBLIC_BASE_URL = "https://infinitedim.vercel.app";
  });

  it("builds terminal referer URL", () => {
    expect(getTerminalRefererUrl()).toBe(
      "https://infinitedim.vercel.app/terminal",
    );
  });

  it("accepts valid terminal referer", () => {
    expect(
      isValidTerminalReferer("https://infinitedim.vercel.app/terminal"),
    ).toBe(true);
    expect(
      isValidTerminalReferer("https://infinitedim.vercel.app/terminal/"),
    ).toBe(true);
  });

  it("rejects invalid referer", () => {
    expect(isValidTerminalReferer("https://infinitedim.vercel.app/gate/3")).toBe(
      false,
    );
    expect(isValidTerminalReferer(null)).toBe(false);
  });
});
