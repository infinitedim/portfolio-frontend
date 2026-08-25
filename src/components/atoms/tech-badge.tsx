"use client";

import { type JSX } from "react";
import { getTechConfig } from "./tech-icon-registry";
import { X } from "lucide-react";

/**
 * Properties for the modern, accessible terminal-styled TechBadge component.
 *
 * @interface TechBadgeProps
 * @property name - Canonical name or key of the technology to display (e.g., "React", "Rust", "TypeScript").
 * @property size - Size preset affecting padding, typography, icon dimensions, and remove button sizing.
 * @property variant - Visual style variant determining borders, background fills, and hover highlights.
 * @property removable - Whether to render an interactive remove/delete button.
 * @property onRemove - Callback invoked when the user clicks the remove button.
 * @property className - Additional CSS class names to apply to the root badge container.
 */
export interface TechBadgeProps {
  readonly name: string;
  readonly size?: "sm" | "md" | "lg";
  readonly variant?: "default" | "minimal" | "outline";
  readonly removable?: boolean;
  readonly onRemove?: () => void;
  readonly className?: string;
}

/**
 * Renders a terminal-themed technology badge featuring an official brand icon, animated hover effects, and optional removal action.
 *
 * @param props - The component properties.
 * @param props.name - The technology name to resolve and render.
 * @param props.size - The size variant of the badge.
 * @param props.variant - The visual style variant.
 * @param props.removable - Whether the badge displays a dismiss button.
 * @param props.onRemove - Callback triggered upon clicking the remove button.
 * @param props.className - Additional custom class names.
 * @returns {JSX.Element} The rendered technology badge element with icon and label.
 */
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

                           
  const variantConfig = {
    default:
      "border border-(--terminal-border) bg-(--terminal-bg)/60 text-(--terminal-text) backdrop-blur-sm hover:border-(--terminal-accent)/60 hover:bg-(--terminal-bg)/80 hover:text-(--terminal-accent)",
    minimal:
      "bg-(--terminal-border)/40 text-(--terminal-text) hover:bg-(--terminal-border)/70 hover:text-(--terminal-accent)",
    outline:
      "border border-(--terminal-border) bg-transparent text-(--terminal-text) hover:border-(--terminal-accent) hover:text-(--terminal-accent)",
  }[variant];

  return (
    <span
      className={`group/tech inline-flex items-center rounded-md font-mono transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--terminal-accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--terminal-bg) motion-reduce:transform-none motion-reduce:transition-none ${sizeConfig.badge} ${variantConfig} ${className}`}
      style={{
                                                                    
        "--tech-color": color,
      } as React.CSSProperties}
    >
                                                        
      <Icon
        className={`shrink-0 transition-transform ${sizeConfig.icon} ${hoverAnimation} motion-reduce:transform-none motion-reduce:transition-none`}
        style={{ color }}
        aria-hidden="true"
        focusable="false"
      />

                              
      <span className="truncate">{label}</span>

                                                            
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className={`ml-1 flex items-center justify-center rounded text-(--terminal-muted) hover:bg-(--terminal-border) hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 min-h-6 min-w-6 sm:min-h-0 sm:min-w-0 ${sizeConfig.removeBtn}`}
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
