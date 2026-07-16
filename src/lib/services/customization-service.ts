import type {
  CustomFont,
  CustomTheme,
  CustomizationSettings,
  BackgroundSettings,
} from "@/types/customization";
import { themes } from "@/lib/themes/theme-config";
import { fonts } from "@/lib/fonts/font-config";

export class CustomizationService {
  private static instance: CustomizationService;
  private readonly SETTINGS_KEY = "terminal-customization-settings";
  private readonly BACKGROUND_KEY = "terminal-background-settings";

  static getInstance(): CustomizationService {
    if (!CustomizationService.instance) {
      CustomizationService.instance = new CustomizationService();
    }
    return CustomizationService.instance;
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  }

  getAllThemes(): CustomTheme[] {
    const builtInThemes: CustomTheme[] = Object.entries(themes).map(
      ([id, config]) => ({
        id,
        name: config.name,
        colors: {
          bg: config.colors.bg,
          text: config.colors.text,
          accent: config.colors.accent,
          border: config.colors.border,
          prompt: config.colors.prompt ?? config.colors.accent,
          success: config.colors.success ?? "#10b981",
          error: config.colors.error ?? "#ef4444",
        },
        source: "built-in" as const,
        createdAt: new Date("2024-01-01"),
      }),
    );

    return builtInThemes;
  }

  getAllFonts(): CustomFont[] {
    const builtInFonts: CustomFont[] = Object.entries(fonts).map(
      ([id, config]) => ({
        id,
        name: config.name,
        family: config.family,
        source: "system" as const,
        ligatures: config.ligatures,
        weight: config.weight,
        style: "normal" as const,
        createdAt: new Date("2024-01-01"),
      }),
    );

    return builtInFonts;
  }

  getSettings(): CustomizationSettings {
    try {
      const storage = this.getStorage();
      if (!storage) return this.getDefaultSettings();
      const stored = storage.getItem(this.SETTINGS_KEY);
      if (!stored) return this.getDefaultSettings();

      const parsed = JSON.parse(stored);

      if (typeof parsed === "object" && parsed !== null) {
        return { ...this.getDefaultSettings(), ...parsed };
      }

      return this.getDefaultSettings();
    } catch (error) {
      console.error("Failed to load customization settings:", error);
      return this.getDefaultSettings();
    }
  }

  saveSettings(settings: Partial<CustomizationSettings>) {
    const storage = this.getStorage();
    if (!storage) return;
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    storage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
  }

  private getDefaultSettings(): CustomizationSettings {
    return {
      currentTheme: "dark",
      currentFont: "jetbrains-mono",
      autoSave: true,
      previewMode: false,
      animations: true,
      fontSize: 16,
      lineHeight: 1.6,
      letterSpacing: 0,
    };
  }

  resetToDefaults() {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.SETTINGS_KEY);
      storage.removeItem(this.BACKGROUND_KEY);
    }
  }

  getBackgroundSettings(): BackgroundSettings {
    try {
      const storage = this.getStorage();
      if (!storage) return this.getDefaultBackgroundSettings();
      const stored = storage.getItem(this.BACKGROUND_KEY);
      if (!stored) return this.getDefaultBackgroundSettings();

      const parsed = JSON.parse(stored);

      if (typeof parsed === "object" && parsed !== null) {
        return { ...this.getDefaultBackgroundSettings(), ...parsed };
      }

      return this.getDefaultBackgroundSettings();
    } catch (error) {
      console.error("Failed to load background settings:", error);
      return this.getDefaultBackgroundSettings();
    }
  }

  saveBackgroundSettings(settings: Partial<BackgroundSettings>) {
    const storage = this.getStorage();
    if (!storage) return;
    const currentSettings = this.getBackgroundSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    storage.setItem(this.BACKGROUND_KEY, JSON.stringify(updatedSettings));
  }

  private getDefaultBackgroundSettings(): BackgroundSettings {
    return {
      type: "letter-glitch",
      letterGlitch: {
        glitchColors: ["#2b4539", "#61dca3", "#61b3dc"],
        glitchSpeed: 50,
        centerVignette: false,
        outerVignette: true,
        smooth: true,
        characters:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ",
      },
    };
  }
}
