"use client";

import { useEffect, type JSX } from "react";
import { useRouter } from "next/navigation";
import { gateClient } from "@/lib/gate/gate-client";
import { gateLevelRoute } from "@/lib/gate/types";
import { GateProgress } from "@/components/molecules/gate/gate-progress";

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
