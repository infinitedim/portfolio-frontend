"use client";

import { useTheme } from "@/hooks/use-theme";
import type { JSX } from "react";

interface ProgressIndicatorProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

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
          className={`${heights[size]} rounded-full transition-all duration-500 ease-out ${animated ? "animate-pulse" : ""
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
