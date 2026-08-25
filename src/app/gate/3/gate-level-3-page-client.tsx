"use client";

import { useEffect, useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { gateClient } from "@/lib/gate/gate-client";
import type { GateStatus, Level3Challenge } from "@/lib/gate/types";
import { gateLevelRoute } from "@/lib/gate/types";
import { GateLevel3Client } from "@/components/organisms/gate/gate-level-3-client";

/**
 * Client-side component that manages state and challenge data loading for Gate Level 3 (Natas 5).
 *
 * @description
 * Fetches the current gate progression status and Level 3 cryptographic challenge payload.
 * Redirects already unlocked sessions to the terminal (`/terminal`) and incomplete progression
 * to earlier gate levels. Once challenge parameters (encoded secret and algorithm) are retrieved,
 * renders the interactive Level 3 challenge solver client component.
 *
 * @returns {JSX.Element} The rendered Gate Level 3 client interface or a loading fallback message.
 */
export function GateLevel3PageClient(): JSX.Element {
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus | null>(null);
  const [challenge, setChallenge] = useState<Level3Challenge | null>(null);

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
        return gateClient.getLevel3Challenge();
      })
      .then((c) => {
        if (c) setChallenge(c);
        return undefined;
      })
      .catch(() => router.replace("/gate/1"));
  }, [router]);

  if (!status || !challenge) {
    return <p className="text-neutral-400">Loading gate...</p>;
  }

  return (
    <GateLevel3Client
      status={status}
      encodedSecret={challenge.encodedSecret}
      algorithm={challenge.algorithm}
    />
  );
}
