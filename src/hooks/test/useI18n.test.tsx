

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useI18n } from "@/hooks/useI18n";

vi.mock("@/lib/i18n/i18n-service", () => ({
  i18n: {
    getCurrentLocale: () => "en",
    isRTL: () => false,
    subscribe: (cb: (locale: string) => void) => {
      cb("en");
      return () => { };
    },
    updateDocumentDirection: vi.fn(),
    tWithFallback: (key: string, fallback?: string) => fallback ?? key,
    setLocale: vi.fn(() => true),
    getCurrentLocaleConfig: () => ({}),
    getSupportedLocales: () => ["en"],
    isLocaleSupported: () => true,
    getLocaleInfo: () => ({}),
  },
  t: (key: string) => key,
}));

describe("useI18n", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return expected shape", () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current).toHaveProperty("currentLocale");
    expect(result.current).toHaveProperty("isRTL");
    expect(result.current).toHaveProperty("t");
    expect(result.current).toHaveProperty("tWithFallback");
    expect(result.current).toHaveProperty("changeLocale");
    expect(result.current).toHaveProperty("getCurrentLocaleConfig");
    expect(result.current).toHaveProperty("getSupportedLocales");
    expect(result.current).toHaveProperty("isLocaleSupported");
    expect(result.current).toHaveProperty("getLocaleInfo");
    expect(result.current).toHaveProperty("i18n");
  });

  it("should have currentLocale", () => {
    const { result } = renderHook(() => useI18n());
    expect(typeof result.current.currentLocale).toBe("string");
  });

  it("t should return string", () => {
    const { result } = renderHook(() => useI18n());
    const translated = result.current.t("common.greeting" as Parameters<typeof result.current.t>[0]);
    expect(typeof translated).toBe("string");
  });
});
