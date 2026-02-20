"use client";

import { useTheme } from "@/hooks/use-theme";
import type { JSX, HTMLAttributes } from "react";

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  text,
  className = "",
  ...props
}: LoadingSpinnerProps): JSX.Element {
  const { themeConfig, theme } = useTheme();

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      key={`loading-spinner-${theme}`}
      className={`flex items-center gap-2 ${className}`}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <div
        className={`${sizeClasses[size]} border-2 border-transparent border-t-current rounded-full animate-spin`}
        style={{ borderTopColor: themeConfig.colors.accent }}
        aria-hidden="true"
      />
      {text && (
        <span
          className={`${textSizes[size]} font-mono animate-pulse`}
          style={{ color: themeConfig.colors.text }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
