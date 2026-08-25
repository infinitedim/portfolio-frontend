"use client";

import { useEffect, useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { gateClient } from "@/lib/gate/gate-client";
import type { GateStatus } from "@/lib/gate/types";
import { gateLevelRoute } from "@/lib/gate/types";
import { GateProgress } from "@/components/molecules/gate/gate-progress";
import { NatasLoginForm } from "@/components/organisms/gate/natas-login-form";

/**
 * Client-side page component for Gate Level 2 (Natas 3 challenge).
 *
 * @description
 * Verifies the user's progress through the security gate challenges upon mounting.
 * If the gate is fully unlocked, redirects to `/terminal`.
 * If the user's progress is below level 2 or ahead of it, redirects to the corresponding level route.
 * Renders the challenge title, progress status bar, and interactive login verification form.
 *
 * @returns {JSX.Element} The rendered Gate Level 2 challenge interface or loading fallback.
 */
export default function GateLevel2Page(): JSX.Element {
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
        if (s.currentLevel < 2) {
          router.replace("/gate/1");
          return undefined;
        }
        if (s.currentLevel > 2) {
          router.replace(gateLevelRoute(s.currentLevel));
          return undefined;
        }
        setStatus(s);
        return undefined;
      })
      .catch(() => router.replace("/gate/1"));
  }, [router]);

  /**
   * Navigates the user to the next gate level route upon successfully solving the challenge.
   *
   * @param {number} [nextLevel] - The sequential level identifier to navigate toward.
   * @returns {void}
   */
  const handlePassed = (nextLevel?: number) => {
    if (nextLevel) {
      router.push(gateLevelRoute(nextLevel));
    }
  };

  if (!status) {
    return <p className="text-neutral-400">Loading gate...</p>;
  }

  return (
    <>
      <header className="mb-6 text-center">
        <h1 className="mt-2 text-xl text-green-400">Natas 3</h1>
        <p className="mt-2 text-xs text-neutral-400">
          Find the hidden directory. Read users.txt for the password.
        </p>
      </header>

      <GateProgress
        currentLevel={status.currentLevel}
        completedLevels={status.completedLevels}
      />

      <NatasLoginForm
        level={2}
        hint="There is nothing on this page. Try exploring hidden paths."
        onPassed={handlePassed}
      />
    </>
  );
}
