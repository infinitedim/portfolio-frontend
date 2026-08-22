import { renderHook } from "@testing-library/react";
import { describe, expect, it, jest, beforeEach, afterEach, mock } from "bun:test";
import { usePointerDevice } from "../use-pointer-device";

mock.module("@/components/organisms/accessibility/accessibility-provider", () => ({
  useAccessibility: () => ({ isReducedMotion: false }),
}));

describe("usePointerDevice Hook", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("pointer: fine"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
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
