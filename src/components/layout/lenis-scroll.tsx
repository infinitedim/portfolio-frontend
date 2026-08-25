"use client";

import { ReactLenis } from "lenis/react";
import { type ReactNode, type JSX } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

/**
 * Properties for the isolated nested LenisScroll container component.
 * @property {ReactNode} children - Child content to be rendered inside the scoped scroll container.
 * @property {string} [className] - Optional CSS classes applied to the nested Lenis scroll viewport.
 */
interface LenisScrollProps {
  children: ReactNode;
  className?: string;
}

/**
 * Nested smooth scrolling container (non-root) that isolates wheel and touch event propagation while applying smooth inertial scrolling adjusted for accessibility preferences.
 * @param {LenisScrollProps} props - The component properties.
 * @param {ReactNode} props.children - Child elements rendered inside the scrollable container.
 * @param {string} [props.className] - Additional class names for layout and sizing.
 * @returns {JSX.Element} The isolated nested scroll container element.
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
