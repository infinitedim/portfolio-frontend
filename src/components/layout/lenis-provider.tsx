"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { type ReactNode, useEffect, useRef } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

interface LenisProviderProps {
  children: ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps): ReactNode {
  const { isReducedMotion } = useAccessibility();
                                                                
  const lenisRef = useRef<LenisRef | null>(null);

  useEffect(() => {
                                                                         
    if (lenisRef.current?.lenis) {
      if (isReducedMotion) {
        lenisRef.current.lenis.destroy();
      } else {
        lenisRef.current.lenis.start();
      }
    }
  }, [isReducedMotion]);

                          
  const lenisOptions = {
    lerp: isReducedMotion ? 1.0 : 0.1,                                    
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
