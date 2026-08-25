"use client";

/**
 * Props for the {@link RoadmapProgressBar} component.
 */
interface RoadmapProgressBarProps {
  /** Explicit completion percentage (0 to 100) used when total/active segment counts are omitted. */
  percentage?: number;
  /** Total number of roadmap items or segments to measure progress against. */
  totalSegments?: number;
  /** Number of completed/active roadmap items or segments. */
  activeSegments?: number;
  /** Whether to show the terminal header text with execution percent and segment counts. Defaults to true. */
  showAscii?: boolean;
  /** Optional custom CSS classes for the progress bar container. */
  className?: string;
  /** Height size variant of the individual LED segment bars ('sm', 'md', 'lg'). Defaults to 'md'. */
  size?: "sm" | "md" | "lg";
  /** Optional custom status label override in place of the default `${pct}% EXECUTED` text. */
  label?: string;
}

/**
 * Renders an interactive terminal-styled segmented LED progress bar.
 *
 * @description Computes percentage from raw segment counts or explicit percentage values,
 * normalizes display segments into fixed or dynamic LED indicators with glowing terminal accent colors,
 * and renders an optional ASCII status headline.
 *
 * @param props - Component properties conforming to {@link RoadmapProgressBarProps}.
 * @param props.percentage - Explicit completion percentage (0 to 100) used when total/active segment counts are omitted.
 * @param props.totalSegments - Total number of roadmap items or segments to measure progress against.
 * @param props.activeSegments - Number of completed/active roadmap items or segments.
 * @param props.showAscii - Whether to show the terminal header text with execution percent and segment counts.
 * @param props.className - Optional custom CSS classes for the progress bar container.
 * @param props.size - Height size variant of the individual LED segment bars ('sm', 'md', 'lg').
 * @param props.label - Optional custom status label override in place of the default percent text.
 * @returns A JSX element containing the segmented LED bar and status header.
 */
export function RoadmapProgressBar({
  percentage,
  totalSegments: customTotal,
  activeSegments: customActive,
  showAscii = true,
  className = "",
  size = "md",
  label,
}: RoadmapProgressBarProps) {
  let pct: number;
  let topicText: string;
  let displayTotal: number;
  let displayActive: number;

  if (
    typeof customTotal === "number" &&
    customTotal > 0 &&
    typeof customActive === "number"
  ) {
    pct = Math.round((customActive / customTotal) * 100);
    topicText = `[${customActive}/${customTotal} TOPICS]`;

    if (customTotal <= 15) {
      displayTotal = customTotal;
      displayActive = customActive;
    } else {
      displayTotal = size === "lg" ? 30 : 25;
      displayActive = Math.round((pct / 100) * displayTotal);
    }
  } else {
    pct = Math.max(0, Math.min(100, Math.round(percentage ?? 0)));
    displayTotal = size === "lg" ? 30 : 25;
    displayActive = Math.round((pct / 100) * displayTotal);
    topicText = `[${displayActive}/${displayTotal} LEDS]`;
  }

  const isComplete = pct >= 100;
  const isStarted = pct > 0;

  const heightClasses = {
    sm: "h-2",
    md: "h-2.5",
    lg: "h-3",
  };

  /**
   * Resolves the styling classes for an active/illuminated LED segment.
   *
   * @returns Tailwind class string for active or inactive segments.
   */
  const getActiveStyle = () => {
    if (isComplete || isStarted) {
      return "bg-(--terminal-accent) shadow-[0_0_6px_var(--terminal-accent)] border-(--terminal-accent)/40";
    }
    return "bg-(--terminal-border)/80 border-(--terminal-border)";
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 font-mono ${className}`}>
      {showAscii && (
        <div className="flex items-center justify-between text-[11px] text-(--terminal-muted)">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="text-(--terminal-accent)">$</span>
            <span
              className={
                isComplete || isStarted
                  ? "text-(--terminal-accent)"
                  : "text-(--terminal-muted)"
              }
            >
              {label || `${pct}% EXECUTED`}
            </span>
          </div>
          <span className="text-[10px] text-(--terminal-muted)">{topicText}</span>
        </div>
      )}

      <div className="w-full flex items-center gap-1 p-1 rounded-lg bg-(--terminal-bg) border border-(--terminal-border) shadow-inner overflow-hidden">
        {Array.from({ length: displayTotal }).map((_, idx) => {
          const isActive = idx < displayActive;
          return (
            <div
              key={idx}
              className={`flex-1 rounded-[1px] border transition-colors ${heightClasses[size]} ${
                isActive
                  ? getActiveStyle()
                  : "bg-(--terminal-bg)/80 border-(--terminal-border)/50"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

