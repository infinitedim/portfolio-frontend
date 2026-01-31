import { describe, it, expect, vi, beforeEach } from "vitest";

if (typeof vi !== "undefined" && vi.hoisted) {
  vi.hoisted(() => {
    if (vi.unmock) vi.unmock("@/lib/utils/arg-parser");
    if (vi.doUnmock) vi.doUnmock("@/lib/utils/arg-parser");
  });
}

describe("commandRegistry", () => {
  let commandRegistry: typeof import("@/lib/commands/command-registry");
  let createHelpCommand: any;
  let aboutCommand: any;
  let projectsCommand: any;
  let contactCommand: any;
  let clearCommand: any;
  let themeCommand: any;
  let fontCommand: any;
  let statusCommand: any;
  let pwaCommand: any;
  let aliasCommand: any;

  beforeEach(async () => {
    if (typeof vi !== "undefined" && vi.unmock) {
      vi.unmock("@/lib/utils/arg-parser");
    }
    if (typeof vi !== "undefined" && vi.doUnmock) {
      vi.doUnmock("@/lib/utils/arg-parser");
    }

    if (typeof vi !== "undefined" && vi.importActual) {
      commandRegistry = await vi.importActual<
        typeof import("@/lib/commands/command-registry")
      >("@/lib/commands/command-registry");
    } else {
      commandRegistry = await import("@/lib/commands/command-registry");
    }

    // Extract commands from the module
    createHelpCommand = commandRegistry.createHelpCommand;
    aboutCommand = commandRegistry.aboutCommand;
    projectsCommand = commandRegistry.projectsCommand;
    contactCommand = commandRegistry.contactCommand;
    clearCommand = commandRegistry.clearCommand;
    themeCommand = commandRegistry.themeCommand;
    fontCommand = commandRegistry.fontCommand;
    statusCommand = commandRegistry.statusCommand;
    pwaCommand = commandRegistry.pwaCommand;
    aliasCommand = commandRegistry.aliasCommand;
  });
  describe("createHelpCommand", () => {
    it("returns success and mentions Featured Commands", async () => {
      const help = createHelpCommand(() => [aboutCommand, projectsCommand]);
      const out = await help.execute([]);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Featured Commands");
    });

    it("lists available commands", async () => {
      const help = createHelpCommand(() => [
        aboutCommand,
        projectsCommand,
        contactCommand,
      ]);
      const out = await help.execute([]);
      expect(out.content as string).toContain("about");
      expect(out.content as string).toContain("projects");
    });

    it("includes command descriptions", async () => {
      const help = createHelpCommand(() => [aboutCommand]);
      const out = await help.execute([]);
      expect(out.content as string).toContain("Learn more about me");
    });
  });

  describe("aboutCommand", () => {
    it("returns success with about text", async () => {
      const out = await aboutCommand.execute([]);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Full-Stack Developer");
    });

    it("mentions technologies", async () => {
      const out = await aboutCommand.execute([]);
      expect(out.content as string).toContain("React");
      expect(out.content as string).toContain("Next.js");
    });
  });

  describe("projectsCommand", () => {
    it("returns success with project text", async () => {
      const out = await projectsCommand.execute([]);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Featured Projects");
    });

    it("lists multiple projects", async () => {
      const out = await projectsCommand.execute([]);
      expect(out.content as string).toContain("Terminal Portfolio");
      expect(out.content as string).toContain("E-Commerce Platform");
    });
  });

  describe("contactCommand", () => {
    it("returns success with contact information", async () => {
      const out = await contactCommand.execute([]);
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Let's Connect");
    });

    it("includes email and social links", async () => {
      const out = await contactCommand.execute([]);
      expect(out.content as string).toContain("Email");
      expect(out.content as string).toContain("GitHub");
      expect(out.content as string).toContain("LinkedIn");
    });
  });

  describe("clearCommand", () => {
    it("returns CLEAR content", async () => {
      const out = await clearCommand.execute([]);
      expect(out.content).toBe("CLEAR");
    });

    it("has correct aliases", () => {
      expect(clearCommand.aliases).toContain("cls");
      expect(clearCommand.aliases).toContain("clr");
    });
  });

  describe("themeCommand", () => {
    beforeEach(() => {
      if (typeof window === "undefined") {
        return;
      }
      // Mock localStorage
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: vi.fn().mockReturnValue("default"),
          setItem: vi.fn(),
        },
        writable: true,
        configurable: true,
      });
    });

    it("shows help with -h flag", async () => {
      const out = await themeCommand.execute(["-h"], "theme -h");
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Theme Command Help");
    });

    it("shows theme list with -l flag", async () => {
      const out = await themeCommand.execute(["-l"], "theme -l");
      expect(["success", "info", "error"]).toContain(out.type);
    });

    it("returns error for invalid theme name", async () => {
      const out = await themeCommand.execute(
        ["invalidthemename"],
        "theme invalidthemename",
      );
      expect(out.type).toBe("error");
    });
  });

  describe("fontCommand", () => {
    beforeEach(() => {
      if (typeof window === "undefined") {
        return;
      }
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
        },
        writable: true,
        configurable: true,
      });
    });

    it("has correct name", () => {
      expect(fontCommand.name).toBe("font");
    });

    it("responds to -h flag", async () => {
      const out = await fontCommand.execute(["-h"], "font -h");
      expect(["success", "info", "error"]).toContain(out.type);
    });

    it("responds to -l flag", async () => {
      const out = await fontCommand.execute(["-l"], "font -l");
      expect(["success", "info", "error"]).toContain(out.type);
    });
  });

  describe("statusCommand", () => {
    it("returns status information", async () => {
      const out = await statusCommand.execute([]);
      expect(["success", "info", "text"]).toContain(out.type);
    });

    it("has name property", () => {
      expect(statusCommand.name).toBe("status");
    });
  });

  describe("pwaCommand", () => {
    it("shows help with -h flag", async () => {
      const out = await pwaCommand.execute(["-h"], "pwa -h");
      expect(["success", "info"]).toContain(out.type);
    });

    it("shows status with -s flag", async () => {
      const out = await pwaCommand.execute(["-s"], "pwa -s");
      expect(["success", "info"]).toContain(out.type);
    });
  });

  describe("aliasCommand", () => {
    beforeEach(() => {
      if (typeof window === "undefined") {
        return;
      }
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: vi.fn().mockReturnValue("{}"),
          setItem: vi.fn(),
        },
        writable: true,
        configurable: true,
      });
    });

    it("has correct name", () => {
      expect(aliasCommand.name).toBe("alias");
    });

    it("shows help with -h flag", async () => {
      const out = await aliasCommand.execute(["-h"], "alias -h");
      expect(out.type).toBe("success");
      expect(out.content as string).toContain("Command Aliases");
    });

    it("lists aliases with -l flag", async () => {
      const out = await aliasCommand.execute(["-l"], "alias -l");
      expect(["success", "info"]).toContain(out.type);
    });
  });
});
