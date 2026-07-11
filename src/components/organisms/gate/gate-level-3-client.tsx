"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { gateClient } from "@/lib/gate/gate-client";
import { GateProgress } from "@/components/molecules/gate/gate-progress";
import type { GateStatus } from "@/lib/gate/types";

interface GateLevel3ClientProps {
  status: GateStatus;
  refererGranted: boolean;
}

export function GateLevel3Client({
  status,
  refererGranted,
}: GateLevel3ClientProps): JSX.Element {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnterTerminal = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await gateClient.completeLevel3();
      await gateClient.unlock();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gate_just_unlocked", "1");
      }
      router.push("/terminal");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not unlock terminal. Check your Referer header.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          Level 3
        </p>
        <h1 className="mt-2 text-xl text-green-400">Referer check</h1>
        <p className="mt-2 text-xs text-neutral-400">
          This page checks where you came from.
        </p>
      </header>

      <GateProgress
        currentLevel={status.currentLevel}
        completedLevels={status.completedLevels}
      />

      <div className="mx-auto max-w-md rounded border border-neutral-800 bg-black/40 p-6 text-center font-mono text-sm">
        {refererGranted ? (
          <>
            <p className="text-green-400">Access granted.</p>
            <p className="mt-2 text-xs text-neutral-400">
              Referer validated. You may enter the terminal.
            </p>
            <button
              type="button"
              onClick={handleEnterTerminal}
              disabled={submitting}
              className="mt-4 rounded border border-green-400/40 bg-green-400/10 px-4 py-2 text-xs text-green-400 transition-colors hover:bg-green-400/20 disabled:opacity-50"
            >
              {submitting ? "..." : "Enter Terminal"}
            </button>
          </>
        ) : (
          <>
            <p className="text-red-400">Unauthorized</p>
            <p className="mt-2 text-xs text-neutral-400">
              Refresh this page with a valid Referer header pointing to
              /terminal.
            </p>
          </>
        )}
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>
    </>
  );
}
