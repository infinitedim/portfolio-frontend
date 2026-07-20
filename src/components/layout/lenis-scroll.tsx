"use client";

import { ReactLenis } from "lenis/react";
import { type ReactNode, type JSX } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

interface LenisScrollProps {
  children: ReactNode;
  className?: string;
}

/**
 * LenisScroll — nested scrollable container that utilizes a child Lenis instance.
 *
 * It uses `root={false}` to smooth-scroll this container independently.
 * Added `data-lenis-prevent` to prevent the root Lenis from hijacking its events.
 * Handled layout separation: we recommend keeping the wrapper style simple (e.g. overflow-y-auto)
 * and placing flex/padding/spacing on a child element to avoid conflict with Lenis's
 * internal wrapper structure.
 */
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
    autoRaf: true, // Let Lenis tick itself smoothly
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
