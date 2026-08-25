"use client";

import { useEffect, type JSX } from "react";
import { useRouter } from "next/navigation";
import { gateClient } from "@/lib/gate/gate-client";
import { gateLevelRoute } from "@/lib/gate/types";
import { GateProgress } from "@/components/molecules/gate/gate-progress";

/**
 * Root landing and router dispatcher page component for the `/gate` route.
 *
 * @description
 * Determines the user's progress through the interactive gate challenges upon initial visit.
 * If the gate is completely unlocked, routes the user directly to `/terminal`.
 * If challenges are in progress, redirects to the user's current level path (e.g., `/gate/1`, `/gate/2`, etc.).
 * Displays an initial loading state and level 1 placeholder progress bar while status is resolving.
 *
 * @returns {JSX.Element} The rendered gate progress placeholder view while routing completes.
 */
export default function GateIndexPage(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    gateClient
      .getStatus()
      .then((status) => {
        if (status.unlocked) {
          router.replace("/terminal");
          return undefined;
        }
        router.replace(gateLevelRoute(status.currentLevel));
        return undefined;
      })
      .catch(() => {
        router.replace("/gate/1");
      });
  }, [router]);

  return (
    <div className="text-center">
      <p className="text-neutral-400">Loading gate status...</p>
      <GateProgress
        currentLevel={1}
        completedLevels={[]}
      />
    </div>
  );
}
