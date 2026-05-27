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
          return;
        }
        router.replace(gateLevelRoute(status.currentLevel));
      })
      .catch(() => {
        router.replace("/gate/1");
      });
  }, [router]);

  return (
    <div className="text-center">
      <p className="text-neutral-500">Loading gate status...</p>
      <GateProgress
        currentLevel={1}
        completedLevels={[]}
      />
    </div>
  );
}
