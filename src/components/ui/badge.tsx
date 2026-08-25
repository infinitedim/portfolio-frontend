/**
 * @fileoverview Reusable Badge UI component with configurable color and style variants.
 * @module components/ui/badge
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/utils";

/**
 * Class-variance-authority variant definition for badge styling.
 * Supports multiple contextual variants: default, secondary, destructive, outline, success, warning, info, terminal.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
        info:
          "border-blue-500/30 bg-blue-500/10 text-blue-400",
        terminal:
          "border-(--terminal-border) bg-(--terminal-accent)/10 text-(--terminal-accent)",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Props for the Badge component.
 *
 * @interface BadgeProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 * @extends {VariantProps<typeof badgeVariants>}
 * @property {string} [className] - Additional CSS class names to apply.
 * @property {"default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "terminal"} [variant] - Visual variant of the badge.
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component for displaying tags, statuses, pills, and indicators.
 *
 * @param {BadgeProps} props - The component props including variant styling and standard HTML div attributes.
 * @returns {JSX.Element} The rendered badge element.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
