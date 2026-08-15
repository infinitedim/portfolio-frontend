"use client";

import { useEffect, Suspense, type JSX } from "react";
import { usePathname } from "next/navigation";
import { recordPageview } from "@/lib/services/analytics-service";

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

export function PageviewBeacon(): JSX.Element {
  return (
    <Suspense fallback={null}>
      <PageviewBeaconInner />
    </Suspense>
  );
}

