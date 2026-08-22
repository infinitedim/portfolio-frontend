import { describe, it, expect, jest, beforeEach, mock } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTerminal } from "@/hooks/use-terminal";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

const commandHistoryMock = {
  addCommand: jest.fn(),
  clearHistory: jest.fn(),
  history: [] as Array<{
    command: string;
    success: boolean;
    timestamp: Date;
    category: string;
    favorite: boolean;
    frequency: number;
  }>,
};

mock.module("@/lib/commands/roadmap-commands", () => ({
  roadmapCommand: null,
}));
mock.module("@/lib/commands/command-registry", async (importOriginal?: () => Promise<unknown>) => {
  const actual = importOriginal ? ((await importOriginal()) as Record<string, unknown>) : {};
  const cmd = (name: string) => ({ name, description: "", execute: jest.fn() });
  return {
    ...actual,
    createHelpCommand: jest.fn(() => cmd("help")),
    aboutCommand: cmd("about"),
    projectsCommand: cmd("projects"),
    contactCommand: cmd("contact"),
    clearCommand: cmd("clear"),
    themeCommand: cmd("theme"),
    fontCommand: cmd("font"),
    gitCommand: cmd("git"),
  };
});
mock.module("@/lib/commands/language-commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: jest.fn() });
  return {
    languageCommand: cmd("language"),
    languageListCommand: cmd("language-list"),
    languageInfoCommand: cmd("language-info"),
  };
});
mock.module("@/lib/commands/commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: jest.fn() });
  return {
    resumeCommand: cmd("resume"),
  };
});
mock.module("@/hooks/use-command-history", () => ({
  useCommandHistory: () => ({
    addCommand: commandHistoryMock.addCommand,
    getSuggestions: () => [],
    clearHistory: commandHistoryMock.clearHistory,
    history: commandHistoryMock.history,
    analytics: {
      totalCommands: 0,
      uniqueCommands: 0,
      successRate: 100,
      topCommands: [],
      commandsByCategory: {},
    },
  }),
}));

describe("useTerminal", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    jest.clearAllMocks();
    localStorage.clear();
    commandHistoryMock.history = [];
  });

  it("should return expected shape", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useTerminal());
    expect(result.current).toHaveProperty("history");
    expect(result.current).toHaveProperty("executeCommand");
    expect(result.current).toHaveProperty("currentInput");
    expect(result.current).toHaveProperty("setCurrentInput");
    expect(result.current).toHaveProperty("clearHistory");
    expect(result.current).toHaveProperty("isProcessing");
    expect(Array.isArray(result.current.history)).toBe(true);
  });

  it("should execute clearHistory without throwing", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useTerminal());
    expect(() => act(() => result.current.clearHistory())).not.toThrow();
  });

  it("setCurrentInput should update currentInput", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }
    const { result } = renderHook(() => useTerminal());
    act(() => result.current.setCurrentInput("help"));
    expect(result.current.currentInput).toBe("help");
  });

  it("navigates fallback command history with newest command first", async () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    const { result } = renderHook(() => useTerminal());

    await waitFor(async () => {
      const output = await result.current.executeCommand("");
      expect(output?.id).not.toBe("error-not-ready");
    });

    await act(async () => {
      await result.current.executeCommand("first");
      await result.current.executeCommand("second");
      await result.current.executeCommand("third");
    });

    await waitFor(() => {
      expect(result.current.commandHistory).toEqual([
        "first",
        "second",
        "third",
      ]);
    });

    act(() => {
      expect(result.current.navigateHistory("up")).toBe("third");
      expect(result.current.navigateHistory("up")).toBe("second");
      expect(result.current.navigateHistory("down")).toBe("third");
      expect(result.current.navigateHistory("down")).toBe("");
    });
  });

  it("navigates enhanced command history with newest command first", () => {
    if (!canRunTests) {
      expect(true).toBe(true);
      return;
    }

    commandHistoryMock.history = [
      {
        command: "contact",
        success: true,
        timestamp: new Date("2026-01-03"),
        category: "portfolio",
        favorite: false,
        frequency: 1,
      },
      {
        command: "projects",
        success: true,
        timestamp: new Date("2026-01-02"),
        category: "portfolio",
        favorite: false,
        frequency: 1,
      },
      {
        command: "help",
        success: true,
        timestamp: new Date("2026-01-01"),
        category: "system",
        favorite: false,
        frequency: 1,
      },
    ];

    const { result } = renderHook(() => useTerminal());

    act(() => {
      expect(result.current.navigateHistory("up")).toBe("contact");
      expect(result.current.navigateHistory("up")).toBe("projects");
      expect(result.current.navigateHistory("down")).toBe("contact");
      expect(result.current.navigateHistory("down")).toBe("");
    });
  });
});
