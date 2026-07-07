import { describe, it, expect, vi, beforeEach } from "vitest";
import { roadmapCommand } from "../roadmap-commands";

describe("roadmap-commands.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("roadmapCommand", () => {
    it("should execute successfully and return success status", async () => {
      const openMock = vi.fn();
      const originalOpen = window.open;
      window.open = openMock as any;

      try {
        const result = await roadmapCommand.execute([]);

        expect(result.type).toBe("success");
        expect(result.content).toContain("Opening roadmap.sh profile");
        expect(openMock).toHaveBeenCalledWith(
          "https://roadmap.sh/u/infinitedim",
          "_blank",
          "noopener,noreferrer",
        );
      } finally {
        window.open = originalOpen;
      }
    });
  });
});
