import type { JSX, ReactNode } from "react";

interface PageHeaderProps {
  /** The route/section title (e.g. "about", "projects", "blog", "contact", "roadmap") */
  title: string;
  /** Optional subtitle or description text below the title */
  description?: string;
  /** Optional action elements to display on the right (e.g. RSS button) */
  actions?: ReactNode;
  /** Optional additional elements below the description (e.g. badges, search bar, tags) */
  children?: ReactNode;
  /** Custom additional container class names */
  className?: string;
}

/**
 * Standardized Terminal Page Header component across all routes.
 * Enforces left-alignment, ~/ green prefix notation, lowercase route name,
 * and unified typography hierarchy.
 */
export function PageHeader({
  title,
  description,
  actions,
  children,
  className = "",
}: PageHeaderProps): JSX.Element {
  const normalizedTitle = title.toLowerCase();

  return (
    <header className={`mb-8 text-left ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          <span className="text-green-400">~/</span>
          {normalizedTitle}
        </h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {description && (
        <p className="mt-3 max-w-3xl font-mono text-base leading-relaxed text-neutral-400 sm:text-lg">
          {description}
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
