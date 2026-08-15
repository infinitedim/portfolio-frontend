"use client";

import { useState, useEffect } from "react";
import { gateClient } from "@/lib/gate/gate-client";

export interface GateStatusState {
  isUnlocked: boolean;
  level: number;
  isLoading: boolean;
}

export function useGateStatus(): GateStatusState {
  const [state, setState] = useState<GateStatusState>({
    isUnlocked: false,
    level: 0,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

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
