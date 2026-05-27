"use client";

import { useEffect, useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { gateClient } from "@/lib/gate/gate-client";
import type { GateStatus } from "@/lib/gate/types";
import { gateLevelRoute } from "@/lib/gate/types";
import { GateProgress } from "@/components/molecules/gate/gate-progress";
import { OverflowPayloadBuilder } from "@/components/organisms/gate/overflow-payload-builder";

export default function GateLevel3Page(): JSX.Element {
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

  const handlePassed = async () => {
    try {
      await gateClient.unlock();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gate_just_unlocked", "1");
      }
      router.push("/terminal");
    } catch {
      router.push("/terminal");
    }
  };

  if (!status) {
    return <p className="text-neutral-500">Loading Behemoth challenge...</p>;
  }

  return (
    <>
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-600">
          Level 3
        </p>
        <h1 className="mt-2 text-xl text-green-400">Behemoth 7</h1>
        <p className="mt-2 text-xs text-neutral-500">
          Buffer overflow at offset 528. Build your payload.
        </p>
      </header>

      <GateProgress
        currentLevel={status.currentLevel}
        completedLevels={status.completedLevels}
      />

      <OverflowPayloadBuilder onPassed={handlePassed} />
    </>
  );
}
