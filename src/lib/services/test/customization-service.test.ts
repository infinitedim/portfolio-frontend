import { describe, it, expect, beforeEach, vi } from "vitest";
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

const mockRemove = vi.fn();
const mockQuerySelectorAll = vi.fn(() => {
  return Array.from({ length: 0 }, () => ({ remove: mockRemove }));
});

describe("CustomizationService", () => {
  beforeEach(() => {
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

    if (typeof document !== "undefined") {
      Object.defineProperty(document, "querySelectorAll", {
        value: mockQuerySelectorAll,
        writable: true,
        configurable: true,
      });
    } else {
      Object.defineProperty(global, "document", {
        value: {
          querySelectorAll: mockQuerySelectorAll,
        },
        writable: true,
        configurable: true,
      });
    }

    mockQuerySelectorAll.mockReturnValue(
      Array.from({ length: 0 }, () => ({ remove: mockRemove })),
    );
    mockRemove.mockClear();
    localStorageMock.clear();

    (CustomizationService as any).instance = undefined;
  });

  it("returns built-in themes plus custom themes via getAllThemes", () => {
    const svc = CustomizationService.getInstance();

    localStorageMock.removeItem("terminal-custom-themes");

    const all = svc.getAllThemes();
    expect(Array.isArray(all)).toBe(true);

    expect(all.length).toBeGreaterThan(0);
  });

  it("can save, update, delete, and duplicate a custom theme", () => {
    if (typeof window === "undefined" || !window.localStorage) {
      expect(true).toBe(true);
      return;
    }
    const svc = CustomizationService.getInstance();

    const saved = svc.saveCustomTheme({
      name: "My Theme",
      description: "A test theme",
      source: "custom",
      colors: {
        bg: "#000000",
        text: "#ffffff",
        prompt: "#111",
        success: "#0f0",
        error: "#f00",
        accent: "#0ea5e9",
        border: "#222",
      },
    } as any);

    expect(saved).toHaveProperty("id");
    expect(saved.name).toBe("My Theme");

    const updated = svc.updateCustomTheme(saved.id, { name: "My Theme v2" });
    expect(updated).toBe(true);

    const duplicate = svc.duplicateTheme(saved.id, "Copied Theme");
    expect(duplicate).not.toBeNull();
    expect(duplicate?.name).toBe("Copied Theme");

    const deleted = svc.deleteCustomTheme(saved.id);
    expect(deleted).toBe(true);

    expect(svc.deleteCustomTheme(saved.id)).toBe(false);
  });

  it("manages settings and resetToDefaults", () => {
    const svc = CustomizationService.getInstance();

    svc.saveSettings({ currentTheme: "matrix" } as any);

    const settings = svc.getSettings();
    expect(settings).toHaveProperty("currentTheme");

    svc.resetToDefaults();

    const after = svc.getSettings();
    expect(after.currentTheme).toBe("dark");
  });
});
