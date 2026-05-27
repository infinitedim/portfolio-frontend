"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordPageview } from "@/lib/services/analytics-service";

export function PageviewBeacon(): null {
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
