import { describe, it, expect, jest, beforeEach } from "bun:test";
import { roadmapCommand } from "../roadmap-commands";

describe("roadmap-commands.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("roadmapCommand", () => {
    it("should execute successfully and return success status", async () => {
      const openMock = jest.fn();
      (globalThis as unknown as { window: { open: typeof openMock } }).window = {
        open: openMock,
      };

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
        delete (globalThis as unknown as { window?: unknown }).window;
      }
    });
  });
});
