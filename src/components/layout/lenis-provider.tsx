"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { type ReactNode, useEffect, useRef } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

/**
 * Properties for the Lenis smooth scrolling context provider.
 * @property {ReactNode} children - Child elements and layout nodes wrapped by the smooth scroll provider.
 */
interface LenisProviderProps {
  children: ReactNode;
}

/**
 * Root smooth scrolling provider using Lenis that dynamically configures lerp, duration, and raf loops based on user accessibility preferences (`prefers-reduced-motion`).
 * @param {LenisProviderProps} props - The component properties.
 * @param {ReactNode} props.children - Child elements to wrap with the smooth scrolling root instance.
 * @returns {ReactNode} The ReactLenis root scroll provider element.
 */
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
