"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { type ReactNode, useEffect, useRef } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

interface LenisProviderProps {
  children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps): ReactNode {
  const { isReducedMotion } = useAccessibility();
  // Keep a reference to the Lenis instance using proper typings
  const lenisRef = useRef<LenisRef | null>(null);

  useEffect(() => {
    // Whenever isReducedMotion changes, update the lenis instance status
    if (lenisRef.current?.lenis) {
      if (isReducedMotion) {
        lenisRef.current.lenis.destroy();
      } else {
        lenisRef.current.lenis.start();
      }
    }
  }, [isReducedMotion]);

  // Options configuration
  const lenisOptions = {
    lerp: isReducedMotion ? 1.0 : 0.1, // instant scroll if reduced motion
    duration: isReducedMotion ? 0 : 1.2,
    smoothWheel: !isReducedMotion,
    autoRaf: !isReducedMotion,
  };

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={lenisOptions}
    >
      {children}
    </ReactLenis>
  );
}
