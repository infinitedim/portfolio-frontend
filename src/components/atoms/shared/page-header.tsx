import type { JSX, ReactNode } from "react";

/**
 * Props for the {@link PageHeader} atom component.
 *
 * @interface PageHeaderProps
 * @property {string} title - Main header title string, rendered in lowercase with terminal `~/` prefix.
 * @property {string} [description] - Optional descriptive subtitle or summary displayed beneath the title.
 * @property {ReactNode} [actions] - Optional action buttons or controls rendered on the header's right side.
 * @property {ReactNode} [children] - Optional arbitrary children nodes rendered below description.
 * @property {string} [className] - Optional additional CSS classes for header container.
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Page header atom component designed with terminal aesthetics.
 *
 * @description
 * Displays a standardized page title formatted with a monospace `~/` prompt prefix,
 * accompanied by optional subtitle description, action buttons, and secondary child elements.
 *
 * @param {PageHeaderProps} props - Header properties.
 * @param {string} props.title - Primary title text.
 * @param {string} [props.description] - Subtitle description.
 * @param {ReactNode} [props.actions] - Header action elements.
 * @param {ReactNode} [props.children] - Additional content rendered below description.
 * @param {string} [props.className] - Custom CSS class names.
 * @returns {JSX.Element} The rendered page header element.
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
        <h1 className="font-mono text-3xl font-bold tracking-tight text-(--terminal-text) sm:text-4xl md:text-5xl">
          <span className="text-(--terminal-accent)">~/</span>
          {normalizedTitle}
        </h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {description && (
        <p className="mt-3 max-w-3xl font-mono text-base leading-relaxed text-(--terminal-muted) sm:text-lg">
          {description}
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
