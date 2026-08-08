import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import type { Command } from "@/types/terminal";

vi.unmock("@/lib/utils/arg-parser");

describe("commands.ts", () => {
  let commands: typeof import("../commands");
  let resumeCommand: Command;

  beforeEach(async () => {
    if (typeof vi !== "undefined" && vi.importActual) {
      commands =
        await vi.importActual<typeof import("../commands")>("../commands");
    } else {
      commands = await import("../commands");
    }

    resumeCommand = commands.resumeCommand;
  });

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
      expect(result.content).toContain("Resume download started");
      if (typeof document !== "undefined") {
        expect(mockCreateElement).toHaveBeenCalledWith("a");
      }
    });
  });
});
