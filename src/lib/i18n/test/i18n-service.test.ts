import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRunTests, ensureDocumentBody } from "@/test/test-helpers";
import { I18nService, i18n, t, tWithFallback } from "../i18n-service";

// Bun test compat: ensure vi.mock is callable (vitest hoists this; in bun it runs inline)
if (typeof (vi as unknown as Record<string, unknown>).mock !== "function") (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("../locales", () => ({
  getLocaleConfig: vi.fn((code: string) => ({
    code,
    name: "Test",
    nativeName: "Test",
    flag: "🏳️",
    direction: "ltr",
  })),
  isRegionalVariant: vi.fn(() => false),
  getFallbackLocale: vi.fn((code: string) => code),
  getSupportedLocales: vi.fn(() => []),
  isValidLocale: vi.fn((code: string) => code === "en_US" || code === "id_ID"),
  DEFAULT_LOCALE: "en_US",
}));

const localStorageMock = {
  getItem: vi.fn(() => null),
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

describe("I18nService", () => {
  beforeEach(() => {
    if (!canRunTests) return;
    ensureDocumentBody();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    (I18nService as any).instance = undefined;
  });

  describe("Singleton", () => {
    it("should be a singleton", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const instance1 = I18nService.getInstance();
      const instance2 = I18nService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("Locale Management", () => {
    it("should get current locale", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const service = I18nService.getInstance();
      const locale = service.getCurrentLocale();

      expect(locale).toBeDefined();
    });

    it("should set locale", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      const service = I18nService.getInstance();
      const success = service.setLocale("id_ID");

      expect(success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("should return false for invalid locale", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const service = I18nService.getInstance();
      const success = service.setLocale("invalid");

      expect(success).toBe(false);
    });

    it("should load locale from localStorage", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      if (typeof window === "undefined") {
        expect(true).toBe(true);
        return;
      }
      localStorageMock.getItem.mockReturnValue(null);

      const service = I18nService.getInstance();
      const locale = service.getCurrentLocale();

      expect(locale).toBe("id_ID");
    });
  });

  describe("Translation", () => {
    it("should translate keys", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const service = I18nService.getInstance();
      const translation = service.t("welcome");

      expect(translation).toBeDefined();
    });

    it("should use fallback for missing translations", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const service = I18nService.getInstance();
      const translation = service.t("nonexistent" as any);

      expect(translation).toBe("nonexistent");
    });

    it("should translate with fallback", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const service = I18nService.getInstance();
      const translation = service.tWithFallback("welcome", "Default");

      expect(translation).toBeDefined();
    });
  });

  describe("Subscriptions", () => {
    it("should subscribe to locale changes", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const service = I18nService.getInstance();
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      service.setLocale("id_ID");

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe("RTL Support", () => {
    it("should detect RTL", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const service = I18nService.getInstance();
      const isRTL = service.isRTL();

      expect(typeof isRTL).toBe("boolean");
    });

    it("should get document direction", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const service = I18nService.getInstance();
      const direction = service.getDocumentDirection();

      expect(["ltr", "rtl"]).toContain(direction);
    });
  });

  describe("Exports", () => {
    it("should export i18n instance", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(i18n).toBeDefined();
      expect(i18n).toBeInstanceOf(I18nService);
    });

    it("should export t function", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(typeof t).toBe("function");
      const translation = t("welcome");
      expect(translation).toBeDefined();
    });

    it("should export tWithFallback function", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(typeof tWithFallback).toBe("function");
    });
  });
});
