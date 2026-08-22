import { describe, it, expect, beforeEach, afterEach, jest } from "bun:test";
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

const mockRemove = jest.fn();
const mockQuerySelectorAll = jest.fn(() => {
  return Array.from({ length: 0 }, () => ({ remove: mockRemove }));
});

describe("CustomizationService", () => {
  let originalDocument: Document;
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    originalDocument = globalThis.document;
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

    (CustomizationService as unknown as { instance: unknown })["instance"] =
      undefined;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "document", {
      value: originalDocument,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  });

  it("returns built-in themes plus custom themes via getAllThemes", () => {
    const svc = CustomizationService.getInstance();

    localStorageMock.removeItem("terminal-custom-themes");

    const all = svc.getAllThemes();
    expect(Array.isArray(all)).toBe(true);

    expect(all.length).toBeGreaterThan(0);
  });

  it("manages settings and resetToDefaults", () => {
    const svc = CustomizationService.getInstance();

    svc.saveSettings({ currentTheme: "matrix" });

    const settings = svc.getSettings();
    expect(settings).toHaveProperty("currentTheme");

    svc.resetToDefaults();

    const after = svc.getSettings();
    expect(after.currentTheme).toBe("dark");
  });
});
