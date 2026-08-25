"use client";

import { useState, useEffect } from "react";
import { gateClient } from "@/lib/gate/gate-client";

/**
 * Represents the current status and security level of the interactive gate challenge.
 */
export interface GateStatusState {
  /** Whether the security gate has been successfully unlocked. */
  isUnlocked: boolean;
  /** Current clearance level or completed stage number within the gate challenge. */
  level: number;
  /** Indicates whether the gate status verification request is currently in progress. */
  isLoading: boolean;
}

/**
 * Custom React hook to asynchronously query and track the user's security gate authorization status.
 *
 * Communicates with {@link gateClient} on component mount to retrieve the unlock state
 * and current clearance level. Safely handles component unmounting during asynchronous queries.
 *
 * @returns The current {@link GateStatusState} reflecting unlock status, level, and loading state.
 *
 * @example
 * ```tsx
 * const { isUnlocked, level, isLoading } = useGateStatus();
 *
 * if (isLoading) return <Spinner />;
 * if (isUnlocked) return <SecretTerminal level={level} />;
 * return <GateLogin />;
 * ```
 */
export function useGateStatus(): GateStatusState {
  const [state, setState] = useState<GateStatusState>({
    isUnlocked: false,
    level: 0,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    /**
     * Queries the backend gate verification endpoint and updates the component authorization state.
     * @returns {Promise<void>}
     */
    async function checkStatus() {
      try {
        const res = await gateClient.getStatus();
        if (isMounted) {
          setState({
            isUnlocked: Boolean(res.unlocked),
            level: res.currentLevel ?? 0,
            isLoading: false,
          });
        }
      } catch {
        if (isMounted) {
          setState({
            isUnlocked: false,
            level: 0,
            isLoading: false,
          });
        }
      }
    }

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
