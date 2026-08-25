"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

/**
 * Class variance authority (CVA) variant configuration for tag chip styling.
 *
 * @description
 * Defines styling rules for size variants ('sm', 'md') and active state highlighting
 * matching the terminal theme palette.
 */
const tagChipVariants = cva(
  "inline-flex items-center rounded-full border font-medium transition-colors cursor-default select-none",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
      },
      active: {
        true: "bg-terminal-accent/20 border-terminal-accent text-terminal-accent",
        false:
          "border-terminal-border text-terminal-muted hover:border-terminal-accent/50 hover:text-terminal-accent font-mono",
      },
    },
    defaultVariants: {
      size: "md",
      active: false,
    },
  },
);

/**
 * Props for the {@link TagChip} component.
 *
 * @interface TagChipProps
 * @extends {VariantProps<typeof tagChipVariants>}
 * @property {string} name - Display name/label of the tag (rendered with '#' prefix).
 * @property {string} [slug] - Optional URL-safe slug identifier for the tag.
 * @property {number} [count] - Optional numeric count badge to display alongside the tag name.
 * @property {() => void} [onClick] - Optional click handler callback. Enables button semantics and keyboard navigation.
 * @property {boolean} [removable] - Whether to render a removable '×' button.
 * @property {() => void} [onRemove] - Callback triggered when the removal button is clicked.
 * @property {string} [className] - Optional custom CSS classes.
 */
export interface TagChipProps extends VariantProps<typeof tagChipVariants> {
  name: string;
  slug?: string;
  count?: number;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

/**
 * Tag chip atom component.
 *
 * @description
 * Renders a pill-shaped tag badge prefixed with `#`, supporting count indicators,
 * keyboard accessibility, toggle states, and removal actions.
 *
 * @param {TagChipProps} props - Component properties.
 * @param {string} props.name - Tag label text.
 * @param {number} [props.count] - Associated item count.
 * @param {() => void} [props.onClick] - Click handler.
 * @param {boolean} [props.active] - Whether the tag is actively selected.
 * @param {"sm" | "md"} [props.size] - Size variant.
 * @param {boolean} [props.removable] - Removal button toggle.
 * @param {() => void} [props.onRemove] - Removal callback.
 * @param {string} [props.className] - Additional class names.
 * @returns {JSX.Element} The rendered tag chip element.
 */
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
