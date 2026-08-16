import { type JSX, type ReactNode } from "react";
import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";
import { PageviewBeacon } from "./pageview-beacon";

interface StandardPageLayoutProps {
  children: ReactNode;
  title?: string;
}

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
