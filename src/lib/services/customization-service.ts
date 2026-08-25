import type {
  CustomFont,
  CustomTheme,
  CustomizationSettings,
  BackgroundSettings,
} from "@/types/customization";
import { themes } from "@/lib/themes/theme-config";
import { fonts } from "@/lib/fonts/font-config";


/**
 * Service managing user preferences for themes, typography, background animations,
 * and display customization with persistence in localStorage.
 *
 * @class CustomizationService
 */
export class CustomizationService {
  /**
   * Singleton instance holder.
   */
  private static instance: CustomizationService;

  /**
   * LocalStorage key for typography and general theme customization settings.
   */
  private readonly SETTINGS_KEY = "terminal-customization-settings";

  /**
   * LocalStorage key for background visual effects and canvas animation settings.
   */
  private readonly BACKGROUND_KEY = "terminal-background-settings";

  /**
   * Retrieves the singleton instance of the CustomizationService.
   *
   * @static
   * @returns {CustomizationService} The shared service instance.
   */
  static getInstance(): CustomizationService {
    if (!CustomizationService.instance) {
      CustomizationService.instance = new CustomizationService();
    }
    return CustomizationService.instance;
  }

  /**
   * Safely accesses browser `window.localStorage` if available in the current runtime environment.
   *
   * @private
   * @returns {Storage | null} Browser localStorage object, or null in SSR/unsupported environments.
   */
  private getStorage(): Storage | null {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  }

  /**
   * Retrieves all available built-in theme presets mapped into the `CustomTheme` structure.
   *
   * @returns {CustomTheme[]} Array of available theme definition objects.
   */
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

  /**
   * Retrieves all available typography and monospace font configurations.
   *
   * @returns {CustomFont[]} Array of configured font option objects.
   */
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

  /**
   * Loads saved customization preferences from localStorage, merging with default values.
   *
   * @returns {CustomizationSettings} The active or stored customization settings.
   */
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

  /**
   * Persists partial updates to customization settings in localStorage.
   *
   * @param {Partial<CustomizationSettings>} settings - Subset of settings to update.
   * @returns {void}
   */
  saveSettings(settings: Partial<CustomizationSettings>): void {
    const storage = this.getStorage();
    if (!storage) return;
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    storage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
  }

  /**
   * Returns default fallback typography and appearance settings.
   *
   * @private
   * @returns {CustomizationSettings} Default customization options.
   */
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

  /**
   * Removes saved customization and background settings from localStorage to restore factory defaults.
   *
   * @returns {void}
   */
  resetToDefaults(): void {
    const storage = this.getStorage();
    if (storage) {
      storage.removeItem(this.SETTINGS_KEY);
      storage.removeItem(this.BACKGROUND_KEY);
    }
  }

  /**
   * Loads saved terminal background animation configuration from localStorage.
   *
   * @returns {BackgroundSettings} Saved or default background settings.
   */
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

  /**
   * Saves partial updates to background animation settings in localStorage.
   *
   * @param {Partial<BackgroundSettings>} settings - Subset of background settings to update.
   * @returns {void}
   */
  saveBackgroundSettings(settings: Partial<BackgroundSettings>): void {
    const storage = this.getStorage();
    if (!storage) return;
    const currentSettings = this.getBackgroundSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    storage.setItem(this.BACKGROUND_KEY, JSON.stringify(updatedSettings));
  }

  /**
   * Returns default background animation settings with letter-glitch matrix presets.
   *
   * @private
   * @returns {BackgroundSettings} Default background configuration object.
   */
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
