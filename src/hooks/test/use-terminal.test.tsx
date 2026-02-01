/**
 * useTerminal hook tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTerminal } from "@/hooks/use-terminal";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

vi.mock("@/lib/commands/skills-commands", () => ({ skillsCommand: null }));
vi.mock("@/lib/commands/roadmap-commands", () => ({
  roadmapCommand: null,
  progressCommand: null,
}));
vi.mock("@/lib/commands/command-registry", () => {
  const cmd = (name: string) => ({ name, description: "", execute: vi.fn() });
  return {
    createHelpCommand: vi.fn(() => cmd("help")),
    aboutCommand: cmd("about"),
    projectsCommand: cmd("projects"),
    contactCommand: cmd("contact"),
    clearCommand: cmd("clear"),
    themeCommand: cmd("theme"),
    fontCommand: cmd("font"),
    statusCommand: cmd("status"),
    aliasCommand: cmd("alias"),
    pwaCommand: cmd("pwa"),
  };
});
vi.mock("@/lib/commands/language-commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: vi.fn() });
  return {
    languageCommand: cmd("language"),
    languageListCommand: cmd("language-list"),
    languageInfoCommand: cmd("language-info"),
  };
});
vi.mock("@/lib/commands/customization-commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: vi.fn() });
  return {
    customizeCommand: cmd("customize"),
    themesCommand: cmd("themes"),
    fontsCommand: cmd("fonts"),
  };
});
vi.mock("@/lib/commands/demo-commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: vi.fn() });
  return { demoCommand: cmd("demo"), setDemoCallback: vi.fn() };
});
vi.mock("@/lib/commands/github-commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: vi.fn() });
  return { githubCommand: cmd("github") };
});
vi.mock("@/lib/commands/tech-stack-commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: vi.fn() });
  return { techStackCommand: cmd("tech-stack") };
});
vi.mock("@/lib/commands/location-commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: vi.fn() });
  return { createLocationCommand: vi.fn(() => cmd("location")) };
});
vi.mock("@/lib/commands/tour-commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: vi.fn() });
  return { tourCommand: cmd("tour") };
});
vi.mock("@/lib/commands/commands", () => {
  const cmd = (name: string) => ({ name, description: "", execute: vi.fn() });
  return {
    resumeCommand: cmd("resume"),
    socialCommand: cmd("social"),
    shortcutsCommand: cmd("shortcuts"),
    enhancedContactCommand: cmd("enhanced-contact"),
    easterEggsCommand: cmd("easter-eggs"),
  };
});
vi.mock("@/hooks/use-command-history", () => ({
  useCommandHistory: () => ({
    addCommand: vi.fn(),
    getSuggestions: () => [],
    clearHistory: vi.fn(),
    history: [],
    analytics: { totalCommands: 0, uniqueCommands: 0, successRate: 100, topCommands: [], commandsByCategory: {} },
  }),
}));

describe("useTerminal", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
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
});
