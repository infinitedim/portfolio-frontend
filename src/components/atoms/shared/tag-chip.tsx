"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const tagChipVariants = cva(
  "inline-flex items-center rounded-full border font-medium transition-colors cursor-default select-none",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
      },
      active: {
        true: "bg-green-400/20 border-green-400 text-green-300",
        false:
          "border-gray-700 text-gray-400 hover:border-green-400/50 hover:text-green-400",
      },
    },
    defaultVariants: {
      size: "md",
      active: false,
    },
  },
);

export interface TagChipProps extends VariantProps<typeof tagChipVariants> {
  name: string;
  slug?: string;
  count?: number;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function TagChip({
  name,
  count,
  onClick,
  active,
  size,
  removable,
  onRemove,
  className,
}: TagChipProps) {
  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={clsx(
        tagChipVariants({ size, active }),
        onClick && "cursor-pointer",
        className,
      )}
    >
      <span>#{name}</span>
      {count !== undefined && (
        <span className="ml-1 opacity-60">({count})</span>
      )}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
          aria-label={`Remove tag ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
