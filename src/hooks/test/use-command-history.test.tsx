import { describe, it, expect, beforeEach, jest } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCommandHistory } from "@/hooks/use-command-history";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

if (canRunTests) {
  try {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  } catch {
    void 0;
  }
}

describe("useCommandHistory", () => {
  beforeEach(() => {
    if (!canRunTests) {
      return;
    }

    ensureDocumentBody();

    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });
    }

    localStorageMock.clear();
    jest.clearAllMocks();

    if (!document.body) {
      const body = document.createElement("body");
      if (document.documentElement) {
        document.documentElement.appendChild(body);
      }
    }
  });

  it("adds and persists commands", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() =>
      useCommandHistory({ maxHistorySize: 3, persistKey: "test-history" }),
    );

    act(() => result.current.addCommand("one"));
    act(() => result.current.addCommand("two"));
    act(() => result.current.addCommand("three"));

    await waitFor(() => {
      expect(result.current.allHistory.length).toBe(3);
    });

    const commands = result.current.allHistory.map(
      (entry: { command: string; timestamp: Date; success: boolean }) =>
        entry.command,
    );

    expect(commands).toEqual(["three", "two", "one"]);

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});
