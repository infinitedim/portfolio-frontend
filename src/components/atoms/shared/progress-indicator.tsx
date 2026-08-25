"use client";

import { useTheme } from "@/hooks/use-theme";
import type { JSX } from "react";

/**
 * Props for the {@link ProgressIndicator} component.
 *
 * @interface ProgressIndicatorProps
 * @property {number} progress - Current completion percentage (0 - 100). Values outside this range will be clamped.
 * @property {string} [label] - Optional text label displayed above the progress bar.
 * @property {boolean} [showPercentage] - Whether to show the numeric percentage text.
 * @property {"sm" | "md" | "lg"} [size] - Size dimension preset controlling bar height and typography size.
 * @property {boolean} [animated] - Whether to enable pulse animation on the filled progress bar.
 */
interface ProgressIndicatorProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

/**
 * Progress indicator atom component.
 *
 * @description
 * Renders a themed linear progress bar with optional label and percentage indicators,
 * styled using active theme accent and border colors with smooth transition effects.
 *
 * @param {ProgressIndicatorProps} props - Component properties.
 * @param {number} props.progress - Progress percentage value.
 * @param {string} [props.label] - Optional title label.
 * @param {boolean} [props.showPercentage] - Toggle display of percentage number.
 * @param {"sm" | "md" | "lg"} [props.size] - Bar and text size preset.
 * @param {boolean} [props.animated] - Animation pulse toggle.
 * @returns {JSX.Element} The rendered progress indicator element.
 */
export function ProgressIndicator({
  progress,
  label,
  showPercentage = true,
  size = "md",
  animated = true,
}: ProgressIndicatorProps): JSX.Element {
  const { themeConfig, theme } = useTheme();

  const heights = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      key={`progress-indicator-${theme}`}
      className="w-full"
    >
      {(label || showPercentage) && (
        <div
          className={`flex justify-between items-center mb-1 ${textSizes[size]}`}
        >
          {label && (
            <span style={{ color: themeConfig.colors.text }}>{label}</span>
          )}
          {showPercentage && (
            <span style={{ color: themeConfig.colors.accent }}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full ${heights[size]} rounded-full overflow-hidden`}
        style={{ backgroundColor: `${themeConfig.colors.border}40` }}
      >
        <div
          className={`${heights[size]} rounded-full transition-all duration-500 ease-out ${
            animated ? "animate-pulse" : ""
          }`}
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: themeConfig.colors.accent,
            boxShadow: `0 0 10px ${themeConfig.colors.accent}40`,
          }}
        />
      </div>
    </div>
  );
}
