"use client";

import { useEffect, useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { gateClient } from "@/lib/gate/gate-client";
import type { GateStatus } from "@/lib/gate/types";
import { gateLevelRoute } from "@/lib/gate/types";
import { GateLevel3Client } from "@/components/organisms/gate/gate-level-3-client";

interface GateLevel3PageClientProps {
  refererGranted: boolean;
}

export function GateLevel3PageClient({
  refererGranted,
}: GateLevel3PageClientProps): JSX.Element {
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus | null>(null);

  useEffect(() => {
    gateClient
      .getStatus()
      .then((s) => {
        if (s.unlocked) {
          router.replace("/terminal");
          return undefined;
        }
        if (s.currentLevel < 3) {
          router.replace(gateLevelRoute(s.currentLevel));
          return undefined;
        }
        setStatus(s);
        return undefined;
      })
      .catch(() => router.replace("/gate/1"));
  }, [router]);

  if (!status) {
    return <p className="text-neutral-500">Loading gate...</p>;
  }

  return (
    <GateLevel3Client
      status={status}
      refererGranted={refererGranted}
    />
  );
}
