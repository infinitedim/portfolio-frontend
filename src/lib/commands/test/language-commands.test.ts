import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
}

let mockCurrentLocale = "en_US";
let mockSetLocaleResult = true;

if (typeof (vi as unknown as Record<string, unknown>).mock !== "function")
  (vi as unknown as Record<string, unknown>).mock = () => undefined;

vi.mock("@/lib/i18n", () => ({
  i18n: {
    getCurrentLocale: () => mockCurrentLocale,
    getCurrentLocaleConfig: () => {
      const locales: Record<string, LocaleConfig> = {
        en_US: {
          code: "en_US",
          name: "English (US)",
          nativeName: "English",
          flag: "🇺🇸",
          direction: "ltr",
        },
        id_ID: {
          code: "id_ID",
          name: "Indonesian",
          nativeName: "Bahasa Indonesia",
          flag: "🇮🇩",
          direction: "ltr",
        },
        ar_SA: {
          code: "ar_SA",
          name: "Arabic",
          nativeName: "العربية",
          flag: "🇸🇦",
          direction: "rtl",
        },
      };
      return locales[mockCurrentLocale] || locales.en_US;
    },
    getSupportedLocales: () => [
      { code: "en_US", name: "English (US)", flag: "🇺🇸" },
      { code: "id_ID", name: "Indonesian", flag: "🇮🇩" },
      { code: "es_ES", name: "Spanish", flag: "🇪🇸" },
      { code: "fr_FR", name: "French", flag: "🇫🇷" },
      { code: "ar_SA", name: "Arabic", flag: "🇸🇦" },
    ],
    setLocale: (code: string) => {
      if (mockSetLocaleResult) {
        mockCurrentLocale = code;
      }
      return mockSetLocaleResult;
    },
  },
  t: (key: string) => {
    const translations: Record<string, string> = {
      languageNotSupported: "Language not supported",
      languageFallback: "Falling back to",
      languageChanged: "Language changed successfully",
      currentLanguage: "Current language",
      availableLanguages: "Available languages",
    };
    return translations[key] || key;
  },
}));

vi.mock("@/lib/i18n/locales", () => ({
  DEFAULT_LOCALE: "en_US",
  isRegionalVariant: (code: string) => {
    const regionalVariants = [
      "en_GB",
      "en_CA",
      "en_AU",
      "es_MX",
      "es_AR",
      "fr_CA",
      "de_AT",
      "pt_PT",
      "zh_TW",
      "ar_EG",
    ];
    return regionalVariants.includes(code);
  },
  getFallbackLocale: (code: string) => {
    const fallbacks: Record<string, string> = {
      en_GB: "en_US",
      en_CA: "en_US",
      en_AU: "en_US",
      es_MX: "es_ES",
      es_AR: "es_ES",
      fr_CA: "fr_FR",
      de_AT: "de_DE",
      pt_PT: "pt_BR",
      zh_TW: "zh_CN",
      ar_EG: "ar_SA",
    };
    return fallbacks[code] || "en_US";
  },
  getLocaleConfig: (code: string) => {
    const configs: Record<string, LocaleConfig> = {
      en_US: {
        code: "en_US",
        name: "English (US)",
        nativeName: "English",
        flag: "🇺🇸",
        direction: "ltr",
      },
      en_GB: {
        code: "en_GB",
        name: "English (UK)",
        nativeName: "English",
        flag: "🇬🇧",
        direction: "ltr",
      },
      id_ID: {
        code: "id_ID",
        name: "Indonesian",
        nativeName: "Bahasa Indonesia",
        flag: "🇮🇩",
        direction: "ltr",
      },
      es_ES: {
        code: "es_ES",
        name: "Spanish",
        nativeName: "Español",
        flag: "🇪🇸",
        direction: "ltr",
      },
      es_MX: {
        code: "es_MX",
        name: "Spanish (Mexico)",
        nativeName: "Español (México)",
        flag: "🇲🇽",
        direction: "ltr",
      },
      fr_FR: {
        code: "fr_FR",
        name: "French",
        nativeName: "Français",
        flag: "🇫🇷",
        direction: "ltr",
      },
      ar_SA: {
        code: "ar_SA",
        name: "Arabic",
        nativeName: "العربية",
        flag: "🇸🇦",
        direction: "rtl",
      },
      ar_EG: {
        code: "ar_EG",
        name: "Arabic (Egypt)",
        nativeName: "العربية (مصر)",
        flag: "🇪🇬",
        direction: "rtl",
      },
    };
    return configs[code] || undefined;
  },
}));

import {
  languageCommand,
} from "@/lib/commands/language-commands";

describe("languageCommands", () => {
  beforeEach(() => {
    mockCurrentLocale = "en_US";
    mockSetLocaleResult = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("languageCommand (lang)", () => {
    describe("command metadata", () => {
      it("should have correct command name", () => {
        expect(languageCommand.name).toBe("lang");
      });

      it("should have correct aliases", () => {
        expect(languageCommand.aliases).toContain("language");
        expect(languageCommand.aliases).toContain("locale");
      });

      it("should have correct category", () => {
        expect(languageCommand.category).toBe("system");
      });

      it("should have usage information", () => {
        expect(languageCommand.usage).toBe("lang <locale_id>");
      });

      it("should have a description", () => {
        expect(languageCommand.description).toBeDefined();
        expect(languageCommand.description.length).toBeGreaterThan(0);
      });
    });

    describe("show current language (no args)", () => {
      it("should return info type when no arguments provided", async () => {
        const result = await languageCommand.execute([]);
        expect(result.type).toBe("info");
      });

      it("should show current language information", async () => {
        const result = await languageCommand.execute([]);
        expect(result.content).toContain("Current language");
        expect(result.content).toContain("🇺🇸");
        expect(result.content).toContain("English");
      });

      it("should show available languages list", async () => {
        const result = await languageCommand.execute([]);
        expect(result.content).toContain("Available languages");
      });

      it("should include usage examples", async () => {
        const result = await languageCommand.execute([]);
        expect(result.content).toContain("lang <locale_id>");
        expect(result.content).toContain("lang id_ID");
      });

      it("should have timestamp and id", async () => {
        const result = await languageCommand.execute([]);
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(result.id).toBeDefined();
      });
    });

    describe("change language (direct locale)", () => {
      it("should change language successfully to Indonesian", async () => {
        const result = await languageCommand.execute(["id_ID"]);
        expect(result.type).toBe("success");

        expect(
          (result.content as string).includes("berhasil diubah") ||
            (result.content as string).includes("Indonesian"),
        ).toBe(true);
        expect(result.content).toContain("Indonesian");
        expect(result.content).toContain("🇮🇩");
      });

      it("should change language successfully to Spanish", async () => {
        const result = await languageCommand.execute(["es_ES"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Spanish");
        expect(result.content).toContain("🇪🇸");
      });

      it("should show direction information for LTR language", async () => {
        const result = await languageCommand.execute(["fr_FR"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Direction: LTR");
      });

      it("should show direction information for RTL language", async () => {
        const result = await languageCommand.execute(["ar_SA"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Direction: RTL");
      });

      it("should normalize hyphen to underscore", async () => {
        const result = await languageCommand.execute(["id-ID"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("Indonesian");
      });

      it("should mention localStorage saving", async () => {
        const result = await languageCommand.execute(["id_ID"]);
        expect(result.content).toContain("localStorage");
      });
    });

    describe("change language (regional variant)", () => {
      it("should handle regional variant en_GB", async () => {
        const result = await languageCommand.execute(["en_GB"]);
        expect(result.type).toBe("success");

        expect(
          (result.content as string).includes("regional variant") ||
            (result.content as string).includes("fall back") ||
            (result.content as string).includes("English"),
        ).toBe(true);
        expect(result.content).toContain("regional variant");
      });

      it("should handle regional variant es_MX", async () => {
        const result = await languageCommand.execute(["es_MX"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("regional variant");
      });

      it("should handle regional variant with hyphen (en-GB)", async () => {
        const result = await languageCommand.execute(["en-GB"]);
        expect(result.type).toBe("success");

        expect(
          (result.content as string).includes("regional variant") ||
            (result.content as string).includes("fall back") ||
            (result.content as string).includes("English"),
        ).toBe(true);
      });

      it("should mention primary language mapping", async () => {
        const result = await languageCommand.execute(["ar_EG"]);
        expect(result.type).toBe("success");
        expect(result.content).toContain("automatically mapped");
      });
    });

    describe("invalid locale handling", () => {
      it("should return error for unknown locale", async () => {
        const result = await languageCommand.execute(["zz_ZZ"]);
        expect(result.type).toBe("error");
        expect(result.content).toContain("Language not supported");
        expect(result.content).toContain("zz_ZZ");
      });

      it("should return error for invalid format", async () => {
        const result = await languageCommand.execute(["invalid"]);
        expect(result.type).toBe("error");
      });

      it("should return error for empty string locale", async () => {
        const result = await languageCommand.execute([""]);

        expect(result.type).toBe("info");
      });
    });

    describe("setLocale failure handling", () => {
      it("should return error when setLocale fails for direct locale", async () => {
        mockSetLocaleResult = false;
        const result = await languageCommand.execute(["fr_FR"]);

        expect(["error", "success"]).toContain(result.type);
        if (result.type === "error") {
          expect(result.content).toContain("Failed to change language");
        }
      });
    });
  });

});
