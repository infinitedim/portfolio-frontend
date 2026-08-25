import { type JSX, type ReactNode } from "react";
import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";
import { PageviewBeacon } from "./pageview-beacon";

/**
 * Props for the StandardPageLayout component.
 *
 * @interface StandardPageLayoutProps
 * @property {ReactNode} children - The main page content to be wrapped within the standard layout.
 * @property {string} [title] - Optional document title or heading for the page.
 */
interface StandardPageLayoutProps {
  children: ReactNode;
  title?: string;
}

/**
 * Standard layout wrapper for standard content and documentation pages.
 *
 * Renders the full-height page shell including the pageview telemetry beacon,
 * top navigation bar (`SiteNav`), primary content region (`<main id="main-content">`),
 * and site footer (`SiteFooter`), styled with terminal-themed CSS variables.
 *
 * @param {StandardPageLayoutProps} props - Component properties.
 * @param {ReactNode} props.children - Child elements rendered inside the main content container.
 * @returns {JSX.Element} The rendered standard page layout.
 */
export function StandardPageLayout({
  children,
}: StandardPageLayoutProps): JSX.Element {
  return (
    <div className="content-theme flex min-h-screen flex-col bg-(--terminal-bg) text-(--terminal-text) transition-colors duration-300 font-mono selection:bg-(--terminal-accent)/30 selection:text-(--terminal-text)">
      <PageviewBeacon />
      <SiteNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

