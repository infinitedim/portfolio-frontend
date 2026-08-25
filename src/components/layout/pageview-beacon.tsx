"use client";

import { useEffect, Suspense, type JSX } from "react";
import { usePathname } from "next/navigation";
import { recordPageview } from "@/lib/services/analytics-service";

/**
 * Internal tracking worker component that listens to route pathname mutations, parses blog slug parameters, and dispatches analytics pageview events.
 * @returns {null} Renders nothing to the DOM.
 */
function PageviewBeaconInner(): null {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const slugMatch = pathname.match(/^\/blog\/([^/]+)$/);
    recordPageview({
      path: pathname,
      slug: slugMatch?.[1],
    });
  }, [pathname]);

  return null;
}

/**
 * Suspense-wrapped analytics beacon component that automatically records pageviews and blog article impressions upon client navigation.
 * @returns {JSX.Element} The Suspense container rendering the pageview beacon worker.
 */
export function PageviewBeacon(): JSX.Element {
  return (
    <Suspense fallback={null}>
      <PageviewBeaconInner />
    </Suspense>
  );
}

