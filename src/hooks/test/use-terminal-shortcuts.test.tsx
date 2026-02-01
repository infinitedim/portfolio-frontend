/**
 * useTerminalShortcuts hook tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTerminalShortcuts } from "@/hooks/use-terminal-shortcuts";

vi.mock("@/hooks/use-command-history", () => ({
  useCommandHistory: () => ({ getSuggestions: () => [] }),
}));

describe("useTerminalShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== "undefined" && window.localStorage) {
      (window.localStorage as { clear: () => void }).clear();
    }
  });

  it("should return shortcuts array and management functions", () => {
    const { result } = renderHook(() => useTerminalShortcuts());
    expect(Array.isArray(result.current.shortcuts)).toBe(true);
    expect(result.current.updateShortcutKeys).toBeTypeOf("function");
    expect(result.current.getShortcutSuggestions).toBeTypeOf("function");
    expect(result.current.resetToDefaults).toBeTypeOf("function");
    expect(result.current.exportShortcuts).toBeTypeOf("function");
    expect(result.current.importShortcuts).toBeTypeOf("function");
    expect(result.current.customShortcuts).toBeDefined();
  });

  it("should have shortcuts after mount", () => {
    const { result } = renderHook(() => useTerminalShortcuts());
    expect(result.current.shortcuts.length).toBeGreaterThan(0);
  });

  it("resetToDefaults should not throw", () => {
    const { result } = renderHook(() => useTerminalShortcuts());
    expect(() => act(() => result.current.resetToDefaults())).not.toThrow();
  });
});
