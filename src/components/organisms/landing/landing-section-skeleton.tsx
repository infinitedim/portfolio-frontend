import { type JSX } from "react";

export function LandingSectionSkeleton({
  lines = 3,
  heightClass = "min-h-[240px]",
}: {
  lines?: number;
  heightClass?: string;
}): JSX.Element {
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
