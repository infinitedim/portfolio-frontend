import { type JSX } from "react";

/**
 * Represents an individual engineering highlight or technical milestone for a project.
 */
export interface ProjectHighlight {
  /**
   * Unique identifier for the highlight entry.
   */
  readonly id: string;
  /**
   * Category or domain tag (e.g. "Architecture", "Performance", "Security").
   */
  readonly category: string;
  /**
   * Brief headline describing the engineering accomplishment.
   */
  readonly title: string;
  /**
   * Optional extended technical detail or contextual explanation.
   */
  readonly detail?: string;
}

/**
 * Properties for the {@link ProjectEngineeringHighlights} component.
 */
interface ProjectEngineeringHighlightsProps {
  /**
   * List of engineering highlight items to display.
   */
  readonly highlights?: readonly ProjectHighlight[];
  /**
   * Optional CSS class names for custom container styling.
   */
  readonly className?: string;
}

/**
 * Renders a terminal-styled engineering highlights section showcasing architecture decisions,
 * performance optimizations, and key implementation notes for a project.
 *
 * @param {ProjectEngineeringHighlightsProps} props - Component properties.
 * @param {readonly ProjectHighlight[]} [props.highlights] - List of engineering highlights.
 * @param {string} [props.className] - Optional extra CSS class names.
 * @returns {JSX.Element | null} Rendered highlights list or `null` if no highlights are provided.
 */
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
