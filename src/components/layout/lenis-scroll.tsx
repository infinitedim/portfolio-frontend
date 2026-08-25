"use client";

import { ReactLenis } from "lenis/react";
import { type ReactNode, type JSX } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

interface LenisScrollProps {
  children: ReactNode;
  className?: string;
}

   
                                                                                  
  
                                                                        
                                                                                  
                                                                                                  
                                                                                     
                              
   
export function LenisScroll({
  children,
  className,
}: LenisScrollProps): JSX.Element {
  const { isReducedMotion } = useAccessibility();

  const options = {
    lerp: isReducedMotion ? 1.0 : 0.1,
    duration: isReducedMotion ? 0 : 1.2,
    smoothWheel: !isReducedMotion,
    syncTouch: !isReducedMotion,
    autoRaf: true,                                  
    overscroll: false,
  };

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="contents"
    >
      <ReactLenis
        root={false}
        options={options}
        className={className}
        style={{ overscrollBehavior: "contain" }}
      >
        {children}
      </ReactLenis>
    </div>
  );
}
