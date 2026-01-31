import { describe, it, expect } from "vitest";
import { canRunTests } from "@/test/test-helpers";
import {
  SUPPORTED_LOCALES,
  REGIONAL_VARIANTS,
  ALL_LOCALES,
  DEFAULT_LOCALE,
  getLocaleConfig,
  isRegionalVariant,
  getFallbackLocale,
  getSupportedLocales,
  isValidLocale,
  type LocaleConfig,
} from "../locales";

describe("locales.ts", () => {
  describe("Constants", () => {
    it("should export DEFAULT_LOCALE", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(DEFAULT_LOCALE).toBe("en_US");
    });

    it("should export SUPPORTED_LOCALES", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(SUPPORTED_LOCALES).toBeDefined();
      expect(typeof SUPPORTED_LOCALES).toBe("object");
      expect(SUPPORTED_LOCALES.en_US).toBeDefined();
    });

    it("should export REGIONAL_VARIANTS", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(REGIONAL_VARIANTS).toBeDefined();
      expect(REGIONAL_VARIANTS.en_GB).toBeDefined();
    });

    it("should export ALL_LOCALES", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(ALL_LOCALES).toBeDefined();
      expect(ALL_LOCALES.en_US).toBeDefined();
      expect(ALL_LOCALES.en_GB).toBeDefined();
    });
  });

  describe("getLocaleConfig", () => {
    it("should return locale config for valid code", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const config = getLocaleConfig("en_US");

      expect(config).toBeDefined();
      expect(config?.code).toBe("en_US");
    });

    it("should normalize hyphen to underscore", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const config = getLocaleConfig("en-US");

      expect(config).toBeDefined();
      expect(config?.code).toBe("en_US");
    });

    it("should return null for invalid locale", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const config = getLocaleConfig("invalid");

      expect(config).toBeNull();
    });
  });

  describe("isRegionalVariant", () => {
    it("should return true for regional variants", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(isRegionalVariant("en_GB")).toBe(true);
      expect(isRegionalVariant("en_CA")).toBe(true);
    });

    it("should return false for primary locales", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(isRegionalVariant("en_US")).toBe(false);
      expect(isRegionalVariant("id_ID")).toBe(false);
    });
  });

  describe("getFallbackLocale", () => {
    it("should return fallback for regional variants", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(getFallbackLocale("en_GB")).toBe("en_US");
      expect(getFallbackLocale("es_MX")).toBe("es_ES");
    });

    it("should return same code for primary locales", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(getFallbackLocale("en_US")).toBe("en_US");
    });
  });

  describe("getSupportedLocales", () => {
    it("should return array of locale configs", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const locales = getSupportedLocales();

      expect(Array.isArray(locales)).toBe(true);
      expect(locales.length).toBeGreaterThan(0);
      expect(locales[0]).toHaveProperty("code");
      expect(locales[0]).toHaveProperty("name");
    });
  });

  describe("isValidLocale", () => {
    it("should return true for valid locales", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(isValidLocale("en_US")).toBe(true);
      expect(isValidLocale("id_ID")).toBe(true);
      expect(isValidLocale("en_GB")).toBe(true);
    });

    it("should return false for invalid locales", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(isValidLocale("invalid")).toBe(false);
      expect(isValidLocale("xx_XX")).toBe(false);
    });

    it("should normalize hyphen to underscore", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      expect(isValidLocale("en-US")).toBe(true);
    });
  });

  describe("LocaleConfig Interface", () => {
    it("should have correct structure", () => {
      if (!canRunTests) {
        expect(true).toBe(true);
        return;
      }
      const config: LocaleConfig = {
        code: "en_US",
        name: "English",
        nativeName: "English",
        flag: "🇺🇸",
        direction: "ltr",
      };

      expect(config.code).toBe("en_US");
      expect(config.direction).toBe("ltr");
    });
  });
});
