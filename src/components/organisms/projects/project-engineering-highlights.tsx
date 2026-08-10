import { type JSX } from "react";

export interface ProjectHighlight {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly detail?: string;
}

interface ProjectEngineeringHighlightsProps {
  readonly highlights?: readonly ProjectHighlight[];
  readonly className?: string;
}

export function ProjectEngineeringHighlights({
  highlights,
  className = "",
}: ProjectEngineeringHighlightsProps): JSX.Element | null {
  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <section aria-label="Engineering Highlights" className={className}>
      <h2 className="mb-5 font-mono text-xl font-bold text-white">
        <span className="text-emerald-400">$</span> cat --highlights
      </h2>
      <div className="space-y-4">
        {highlights.map((highlight) => (
          <div
            key={highlight.id}
            className="relative border-l-2 border-emerald-400/30 pl-4"
          >
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">
              {highlight.category}
            </span>
            <p className="mt-0.5 text-sm font-medium text-neutral-200">
              {highlight.title}
            </p>
            {highlight.detail && (
              <p className="mt-0.5 font-mono text-xs text-neutral-500">
                {highlight.detail}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
