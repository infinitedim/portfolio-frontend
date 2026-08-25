import { type JSX } from "react";

/**
 * Props for the {@link LandingSectionSkeleton} component.
 */
export interface LandingSectionSkeletonProps {
  /**
   * Number of skeleton placeholder lines to render in the content body.
   * @defaultValue 3
   */
  lines?: number;
  /**
   * Custom CSS height or min-height class applied to the skeleton wrapper.
   * @defaultValue "min-h-[240px]"
   */
  heightClass?: string;
}

/**
 * Fallback loading skeleton for landing page sections during asynchronous data fetching.
 *
 * @description
 * Renders an accessible placeholder with animated pulse bars simulating section headers
 * and multi-line content to prevent Cumulative Layout Shift (CLS) during streaming/hydration.
 *
 * @param props - The component props.
 * @param props.lines - Number of animated body lines to render. Defaults to `3`.
 * @param props.heightClass - Tailwind height/min-height styling class. Defaults to `"min-h-[240px]"`.
 * @returns The rendered section skeleton JSX element.
 */
export function LandingSectionSkeleton({
  lines = 3,
  heightClass = "min-h-[240px]",
}: LandingSectionSkeletonProps): JSX.Element {
  return (
    <div
      className={`mx-auto w-full max-w-6xl px-4 py-12 ${heightClass}`}
      aria-hidden="true"
    >
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-neutral-800" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 animate-pulse rounded bg-neutral-800/80"
            style={{ width: `${Math.max(55, 100 - index * 12)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
