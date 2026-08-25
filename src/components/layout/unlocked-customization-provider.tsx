"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useFont } from "@/hooks/use-font";
import { useGateStatus } from "@/hooks/use-gate-status";

/**
 * Client provider component that manages gate customization features.
 *
 * Initializes custom theme (`useTheme`) and font (`useFont`) management hooks,
 * queries the current easter-egg gate completion status via `useGateStatus`, and synchronizes
 * the `"data-gate-unlocked"` attribute on `document.documentElement` when unlocked.
 *
 * @param {object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements wrapped by the provider.
 * @returns {JSX.Element} A React fragment containing the child nodes.
 */
export function UnlockedCustomizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUnlocked } = useGateStatus();
  useTheme();
  useFont();

  useEffect(() => {
    if (isUnlocked && typeof document !== "undefined") {
      document.documentElement.setAttribute("data-gate-unlocked", "true");
    }
  }, [isUnlocked]);

  return <>{children}</>;
}

