"use client";

import { useEffect, useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { gateClient } from "@/lib/gate/gate-client";
import type { GateStatus } from "@/lib/gate/types";
import { gateLevelRoute } from "@/lib/gate/types";
import { GateProgress } from "@/components/molecules/gate/gate-progress";
import { UppercaseShell } from "@/components/organisms/gate/uppercase-shell";

export default function GateLevel1Page(): JSX.Element {
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus | null>(null);

  useEffect(() => {
    gateClient
      .getStatus()
      .then((s) => {
        if (s.unlocked) {
          router.replace("/terminal");
          return;
        }
        if (s.currentLevel > 1) {
          router.replace(gateLevelRoute(s.currentLevel));
          setStatus(s);
        }
        return;
      })
      .catch(() =>
        setStatus({ unlocked: false, currentLevel: 1, completedLevels: [] }),
      );
  }, [router]);

  const handlePassed = (nextLevel?: number) => {
    if (nextLevel) {
      router.push(gateLevelRoute(nextLevel));
    }
  };

  if (!status) {
    return <p className="text-neutral-500">Initializing Bandit shell...</p>;
  }

  return (
    <>
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-600">
          Level 1
        </p>
        <h1 className="mt-2 text-xl text-green-400">Bandit 32 → 33</h1>
        <p className="mt-2 text-xs text-neutral-500">
          Escape the uppercase shell. Read the password file.
        </p>
      </header>

      <GateProgress
        currentLevel={status.currentLevel}
        completedLevels={status.completedLevels}
      />

      <UppercaseShell onPassed={handlePassed} />
    </>
  );
}
