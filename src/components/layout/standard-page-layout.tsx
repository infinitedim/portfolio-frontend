import { type JSX, type ReactNode } from "react";
import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";
import { PageviewBeacon } from "./pageview-beacon";
// import { DeferredAiChatWidget } from "./deferred-ai-chat-widget";

interface StandardPageLayoutProps {
  children: ReactNode;
  title?: string;
}

export function StandardPageLayout({
  children,
}: StandardPageLayoutProps): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <PageviewBeacon />
      <SiteNav />
      <main
        id="main-content"
        className="flex-1"
      >
        {children}
      </main>
      <SiteFooter />
      {/* <DeferredAiChatWidget /> */}
    </div>
  );
}
