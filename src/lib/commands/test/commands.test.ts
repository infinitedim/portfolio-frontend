import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";

// NOTE: Don't mock ArgumentParser globally - it interferes with other tests
// Instead, we'll use the real ArgumentParser and mock only when needed in specific tests

describe("commands.ts", () => {
  let commands: typeof import("../commands");
  let resumeCommand: any;
  let socialCommand: any;
  let shortcutsCommand: any;
  let enhancedContactCommand: any;
  let easterEggsCommand: any;
  let enhancedCommands: any;

  beforeEach(async () => {
    // Try to unmock if available (Vitest), otherwise use importActual
    if (typeof vi !== "undefined" && vi.unmock) {
      vi.unmock("@/lib/utils/arg-parser");
    }
    if (typeof vi !== "undefined" && vi.doUnmock) {
      vi.doUnmock("@/lib/utils/arg-parser");
    }

    // Use importActual to get the real module (bypasses mocks)
    // Fallback to regular import if importActual is not available (Bun)
    if (typeof vi !== "undefined" && vi.importActual) {
      // Vitest: use importActual to bypass mocks
      commands =
        await vi.importActual<typeof import("../commands")>("../commands");
    } else {
      // Bun test runner: regular import
      commands = await import("../commands");
    }

    resumeCommand = commands.resumeCommand;
    socialCommand = commands.socialCommand;
    shortcutsCommand = commands.shortcutsCommand;
    enhancedContactCommand = commands.enhancedContactCommand;
    easterEggsCommand = commands.easterEggsCommand;
    enhancedCommands = commands.enhancedCommands;
  });

  // Mock window and document
  const mockClick = vi.fn();
  const mockOpen = vi.fn();
  const mockCreateElement = vi.fn(() => ({
    click: mockClick,
    href: "",
    download: "",
  }));

  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();

    if (typeof window !== "undefined") {
      window.open = mockOpen;
      Object.defineProperty(document, "createElement", {
        value: mockCreateElement,
        writable: true,
        configurable: true,
      });
    }
  });

  describe("resumeCommand", () => {
    it("should execute resume command", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await resumeCommand.execute([]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("RESUME");
    });

    it("should show help when --help flag is used", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await resumeCommand.execute(["--help"]);

      expect(result.type).toBe("info");
      expect(result.content).toContain("Resume Command Help");
    });

    it("should download PDF when --download flag is used", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const result = await resumeCommand.execute(["--download"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("download started");
      if (typeof document !== "undefined") {
        expect(mockCreateElement).toHaveBeenCalledWith("a");
      }
    });
  });

  describe("socialCommand", () => {
    it("should execute social command", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await socialCommand.execute([]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("SOCIAL LINKS");
    });

    it("should open links when --open flag is used", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const result = await socialCommand.execute(["--open"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("Opening all social links");
      if (typeof window !== "undefined") {
        expect(mockOpen).toHaveBeenCalled();
      }
    });
  });

  describe("shortcutsCommand", () => {
    it("should execute shortcuts command", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await shortcutsCommand.execute();

      expect(result.type).toBe("success");
      expect(result.content).toContain("KEYBOARD SHORTCUTS");
    });
  });

  describe("enhancedContactCommand", () => {
    it("should execute contact command", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await enhancedContactCommand.execute([]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("CONTACT INFORMATION");
    });

    it("should show form when --form flag is used", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await enhancedContactCommand.execute(["--form"]);

      expect(result.type).toBe("success");
      expect(result.content).toContain("INTERACTIVE CONTACT FORM");
    });
  });

  describe("easterEggsCommand", () => {
    it("should execute easter eggs command", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await easterEggsCommand.execute();

      expect(result.type).toBe("success");
      expect(result.content).toContain("EASTER EGGS");
    });
  });

  describe("enhancedCommands", () => {
    it("should export all commands", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(enhancedCommands).toHaveProperty("resume");
      expect(enhancedCommands).toHaveProperty("social");
      expect(enhancedCommands).toHaveProperty("shortcuts");
      expect(enhancedCommands).toHaveProperty("contact");
      expect(enhancedCommands).toHaveProperty("easterEggs");
    });
  });
});
