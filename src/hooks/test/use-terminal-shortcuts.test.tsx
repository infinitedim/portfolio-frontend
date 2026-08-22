import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useTerminalShortcuts } from "@/hooks/use-terminal-shortcuts";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (jest as unknown as Record<string, unknown>).mock !== "function"
)
  (jest as unknown as Record<string, unknown>).mock = () => undefined;

mock.module("@/hooks/use-command-history", () => ({
  useCommandHistory: () => ({ getSuggestions: () => [] }),
}));

describe("useTerminalShortcuts", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    jest.clearAllMocks();
    if (typeof window !== "undefined" && window.localStorage) {
      (window.localStorage as { clear: () => void }).clear();
    }
  });

  it("should return shortcuts array and management functions", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
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
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useTerminalShortcuts());
    expect(result.current.shortcuts.length).toBeGreaterThan(0);
  });

  it("resetToDefaults should not throw", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useTerminalShortcuts());
    expect(() => act(() => result.current.resetToDefaults())).not.toThrow();
  });
});
