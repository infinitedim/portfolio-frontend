"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useFont } from "@/hooks/use-font";
import { useGateStatus } from "@/hooks/use-gate-status";

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
