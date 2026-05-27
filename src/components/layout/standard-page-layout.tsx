import { type JSX, type ReactNode } from "react";
import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";

interface StandardPageLayoutProps {
  children: ReactNode;
  title?: string;
}

export function StandardPageLayout({
  children,
}: StandardPageLayoutProps): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <SiteNav />
      <main
        id="main-content"
        className="flex-1"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
