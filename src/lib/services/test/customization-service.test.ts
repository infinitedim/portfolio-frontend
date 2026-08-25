import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { CustomizationService } from "@/lib/services/customization-service";

const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) =>
    Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null,
  setItem: (k: string, v: string) => {
    storage[k] = v;
  },
  removeItem: (k: string) => {
    delete storage[k];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
};

describe("CustomizationService", () => {
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    originalWindow = globalThis.window;

    if (typeof window === "undefined") {
      Object.defineProperty(global, "window", {
        value: {},
        writable: true,
        configurable: true,
      });
    }
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    localStorageMock.clear();

    (CustomizationService as unknown as { instance: unknown })["instance"] =
      undefined;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  });

  it("returns built-in themes and fonts via getAllThemes and getAllFonts", () => {
    const svc = CustomizationService.getInstance();

    const themes = svc.getAllThemes();
    expect(themes.length).toBeGreaterThan(0);
    expect(themes[0]).toHaveProperty("id");

    const fonts = svc.getAllFonts();
    expect(fonts.length).toBeGreaterThan(0);
    expect(fonts[0]).toHaveProperty("family");
  });

  it("manages settings and resetToDefaults", () => {
    const svc = CustomizationService.getInstance();

    svc.saveSettings({ currentTheme: "matrix" });

    const settings = svc.getSettings();
    expect(settings.currentTheme).toBe("matrix");

    svc.resetToDefaults();

    const after = svc.getSettings();
    expect(after.currentTheme).toBe("dark");
  });

  it("manages background settings and handles corrupted JSON fallback", () => {
    const svc = CustomizationService.getInstance();

    svc.saveBackgroundSettings({ type: "letter-glitch" });
    const bg = svc.getBackgroundSettings();
    expect(bg.type).toBe("letter-glitch");

                   
    localStorageMock.setItem("terminal-background-settings", "{invalid-json");
    const fallbackBg = svc.getBackgroundSettings();
    expect(fallbackBg.type).toBe("letter-glitch");

    localStorageMock.setItem("terminal-customization-settings", "{invalid-json");
    const fallbackSettings = svc.getSettings();
    expect(fallbackSettings.currentTheme).toBe("dark");
  });
});
