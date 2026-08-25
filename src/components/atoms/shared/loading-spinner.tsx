"use client";

import { useTheme } from "@/hooks/use-theme";
import type { JSX, HTMLAttributes } from "react";

/**
 * Props for the {@link LoadingSpinner} component.
 *
 * @interface LoadingSpinnerProps
 * @extends {HTMLAttributes<HTMLDivElement>}
 * @property {"sm" | "md" | "lg"} [size] - Size dimension preset controlling spinner size and typography.
 * @property {string} [text] - Optional status message displayed alongside the spinner indicator.
 * @property {string} [className] - Optional additional CSS classes for container layout.
 */
interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

/**
 * Loading spinner atom component.
 *
 * @description
 * Renders an accessible circular rotating spinner styled using the current theme's accent color,
 * optionally displaying an accompanying pulsing status label.
 *
 * @param {LoadingSpinnerProps} props - Component properties.
 * @param {"sm" | "md" | "lg"} [props.size] - The size variant of the spinner.
 * @param {string} [props.text] - Optional loading status message.
 * @param {string} [props.className] - Custom classes for layout adjustment.
 * @returns {JSX.Element} The rendered loading spinner element.
 */
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
