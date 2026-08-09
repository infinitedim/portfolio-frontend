import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { usePointerDevice } from "../use-pointer-device";

vi.mock("@/components/organisms/accessibility/accessibility-provider", () => ({
  useAccessibility: () => ({ isReducedMotion: false }),
}));

describe("usePointerDevice Hook", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("pointer: fine"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("should detect fine pointer capability correctly", () => {
    const { result } = renderHook(() => usePointerDevice());
    expect(result.current.isFinePointer).toBe(true);
    expect(result.current.isCustomCursorSupported).toBe(true);
  });
});
