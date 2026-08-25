import { describe, it, expect } from "bun:test";
import { themes } from "../theme-config";

/**
 * Converts a 3-character or 6-character hexadecimal color string into an RGB component object.
 *
 * @param hex - Hexadecimal color string (with or without leading '#').
 * @returns Object containing numerical `r`, `g`, `b` values (0-255), or null if the hex format is invalid.
 */
function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(
    shorthandRegex,
    (m, r, g, b) => r + r + g + g + b + b,
  );
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Computes the relative luminance of an sRGB color according to the WCAG 2.1 standard formula.
 *
 * @param rgb - RGB color components normalized to the 0-255 range.
 * @param rgb.r - Red component (0-255).
 * @param rgb.g - Green component (0-255).
 * @param rgb.b - Blue component (0-255).
 * @returns Relative luminance value between 0.0 (darkest black) and 1.0 (lightest white).
 */
function getLuminance(rgb: { r: number; g: number; b: number }) {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates the WCAG contrast ratio between two hexadecimal colors.
 *
 * @param hex1 - First hexadecimal color string (e.g. foreground/muted text color).
 * @param hex2 - Second hexadecimal color string (e.g. background color).
 * @returns Contrast ratio number ranging from 1.0 (no contrast) to 21.0 (maximum contrast), or 0 if parsing fails.
 */
function getContrastRatio(hex1: string, hex2: string) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

describe("WCAG Color Contrast Validation", () => {
  it("should have a contrast ratio of at least 4.5:1 for muted text against bg in all 21 themes", () => {
    console.log("=== Verification of Contrast Ratios ===");
    for (const theme of Object.values(themes)) {
      const bg = theme.colors.bg;
      const muted = theme.colors.muted;
      const ratio = getContrastRatio(muted, bg);
      console.log(
        `${theme.name}: muted ${muted} on bg ${bg} -> ratio: ${ratio.toFixed(2)}`,
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});
