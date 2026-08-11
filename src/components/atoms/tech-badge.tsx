"use client";

import { type JSX } from "react";
import { getTechConfig } from "./tech-icon-registry";
import { X } from "lucide-react";

export interface TechBadgeProps {
  readonly name: string;
  readonly size?: "sm" | "md" | "lg";
  readonly variant?: "default" | "minimal" | "outline";
  readonly removable?: boolean;
  readonly onRemove?: () => void;
  readonly className?: string;
}

export function TechBadge({
  name,
  size = "sm",
  variant = "default",
  removable = false,
  onRemove,
  className = "",
}: TechBadgeProps): JSX.Element {
  const config = getTechConfig(name);
  const { Icon, label, color, hoverAnimation } = config;

  // Size styling variants
  const sizeConfig = {
    sm: {
      badge: "px-2 py-1 text-xs gap-1.5",
      icon: "h-3.5 w-3.5",
      removeBtn: "h-3.5 w-3.5 p-0.5",
    },
    md: {
      badge: "px-3 py-1.5 text-sm gap-2",
      icon: "h-4 w-4",
      removeBtn: "h-4 w-4 p-0.5",
    },
    lg: {
      badge: "px-3.5 py-2 text-sm gap-2.5",
      icon: "h-5 w-5",
      removeBtn: "h-4.5 w-4.5 p-0.5",
    },
  }[size];

  // Visual variant styling
  const variantConfig = {
    default:
      "border border-neutral-800 bg-neutral-900/60 text-neutral-300 backdrop-blur-sm hover:border-neutral-600 hover:bg-neutral-800/80 hover:text-white",
    minimal:
      "bg-neutral-800/70 text-neutral-300 hover:bg-neutral-800 hover:text-white",
    outline:
      "border border-neutral-700/60 bg-transparent text-neutral-300 hover:border-neutral-500 hover:text-white",
  }[variant];

  return (
    <span
      className={`group/tech inline-flex items-center rounded-md font-mono transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transform-none motion-reduce:transition-none ${sizeConfig.badge} ${variantConfig} ${className}`}
      style={{
        // Dynamically expose --tech-color for CSS hover glow effect
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ["--tech-color" as any]: color,
      }}
    >
      {/* SVG Icon with per-category micro-animation */}
      <Icon
        className={`shrink-0 transition-transform ${sizeConfig.icon} ${hoverAnimation} motion-reduce:transform-none motion-reduce:transition-none`}
        style={{ color }}
        aria-hidden="true"
        focusable="false"
      />

      {/* Technology Label */}
      <span className="truncate">{label}</span>

      {/* Optional Removable Button for Admin Tag Editor */}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className={`ml-1 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-700 hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 min-h-6 min-w-6 sm:min-h-0 sm:min-w-0 ${sizeConfig.removeBtn}`}
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
