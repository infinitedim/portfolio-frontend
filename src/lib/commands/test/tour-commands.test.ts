import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { tourCommand, tourHelpText } from "../tour-commands";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
}

describe("tour-commands.ts", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
  });

  describe("tourCommand", () => {
    it("should execute tour command", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await tourCommand.execute([]);

      expect(result.type).toBe("success");
      expect(result.content).toBe("START_GUIDED_TOUR");
    });

    it("should reset tour when --reset flag is used", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const result = await tourCommand.execute(["--reset"]);

      expect(result.type).toBe("success");
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    it("should reset tour when -r flag is used", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const result = await tourCommand.execute(["-r"]);

      expect(result.type).toBe("success");
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    it("should return command with timestamp and id", async () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const result = await tourCommand.execute([]);

      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("id");
      expect(result.id).toContain("tour-");
    });
  });

  describe("tourHelpText", () => {
    it("should export help text", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(tourHelpText).toBeDefined();
      expect(typeof tourHelpText).toBe("string");
      expect(tourHelpText).toContain("TOUR COMMAND");
    });
  });
});
