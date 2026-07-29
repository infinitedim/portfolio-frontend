"use client";

import { useEffect, type ReactNode, type JSX } from "react";
import { useRouter } from "next/navigation";
import { useMobile } from "@/hooks/use-mobile";

export default function GateLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element | null {
  const router = useRouter();
  const { isMobile } = useMobile();

  useEffect(() => {
    if (isMobile) {
      router.replace("/");
    }
  }, [isMobile, router]);

  if (isMobile) {
    return null;
  }

  return <>{children}</>;
}
