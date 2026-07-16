import { describe, it, expect, vi } from "vitest";

if (
  typeof (globalThis as { Bun?: unknown }).Bun !== "undefined" ||
  typeof (vi as unknown as Record<string, unknown>).mock !== "function"
)
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/lib/services/customizationService", () => {
  const mock = {
    getInstance: () => ({
      getAllThemes: () => [{ id: "t1", name: "Built", source: "built-in" }],
      getAllFonts: () => [
        {
          id: "f1",
          name: "JetBrains",
          source: "system",
          ligatures: true,
          size: 0,
        },
      ],
    }),
  };
  return { CustomizationService: mock };
});

import { themesCommand, fontsCommand } from "../customization-commands";

describe("customizationCommands", () => {
  it("themes default returns success", async () => {
    const out = await themesCommand.execute([]);
    expect(out.type).toBe("success");
  });

  it("fonts list returns success", async () => {
    const out = await fontsCommand.execute([]);
    expect(out.type).toBe("success");
  });
});
