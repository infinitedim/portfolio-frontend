"use client";

import { useEffect, type ReactNode, type JSX } from "react";
import { useRouter } from "next/navigation";
import { useMobile } from "@/hooks/use-mobile";

/**
 * Root client layout wrapper for all `/gate/*` challenge sub-routes.
 *
 * @description
 * Enforces desktop-only device requirements for the interactive security gate experience.
 * Uses the `useMobile` hook to detect mobile viewports. If accessed from a mobile device,
 * automatically redirects users back to the root homepage (`/`) and suppresses rendering.
 *
 * @param {object} props - Component properties.
 * @param {ReactNode} props.children - Child routes and components rendered within the gate section.
 * @returns {JSX.Element | null} The rendered children for desktop devices, or `null` while redirecting mobile visitors.
 */
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
