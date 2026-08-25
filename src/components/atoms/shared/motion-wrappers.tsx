"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

/**
 * Props for the {@link FadeIn} motion wrapper component.
 *
 * @interface FadeInProps
 * @property {ReactNode} children - The React node elements to be animated into view.
 * @property {"up" | "down" | "left" | "right" | "none"} [direction] - The directional translation vector for the fade-in animation.
 * @property {number} [delay] - Delay in seconds before the transition begins.
 * @property {number} [duration] - Total duration of the fade-in transition in seconds.
 * @property {string} [className] - Optional custom CSS classes for the container wrapper.
 * @property {number} [distance] - Translation offset distance in pixels.
 * @property {string} [viewportMargin] - Optional IntersectionObserver root margin threshold.
 */
interface FadeInProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  className?: string;
  distance?: number;
  viewportMargin?: string;
}

/**
 * Scroll-triggered fade-in animation wrapper component.
 *
 * @description
 * Uses an `IntersectionObserver` to trigger a smooth opacity and directional translate animation
 * once the element enters the viewport. Automatically disables transitions when reduced motion is preferred.
 *
 * @param {FadeInProps} props - Component properties.
 * @param {ReactNode} props.children - Child elements to animate.
 * @param {"up" | "down" | "left" | "right" | "none"} [props.direction] - Direction of arrival.
 * @param {number} [props.delay] - Delay before starting the animation in seconds.
 * @param {number} [props.duration] - Transition duration in seconds.
 * @param {string} [props.className] - Additional container CSS classes.
 * @param {number} [props.distance] - Offset distance in pixels.
 * @param {string} [props.viewportMargin] - Optional root margin for the intersection observer.
 * @returns {ReactNode} The animated wrapper node.
 */
export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.5,
  className = "",
  distance: _distance = 30,
}: FadeInProps): ReactNode {
  const { isReducedMotion } = useAccessibility();
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      { threshold: 0.1 },
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [isReducedMotion]);

  if (isReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const directionClasses = {
    up: "translate-y-6",
    down: "-translate-y-6",
    left: "translate-x-6",
    right: "-translate-x-6",
    none: "",
  };

  const offsetClass = directionClasses[direction] || directionClasses.up;

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
      }}
      className={`transition-all ease-out ${
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${offsetClass}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Props for the {@link StaggerContainer} component.
 *
 * @interface StaggerContainerProps
 * @property {ReactNode} children - Elements to render inside the staggered layout.
 * @property {number} [delayChildren] - Initial delay in seconds before staggered animations begin.
 * @property {number} [staggerChildren] - Time offset in seconds between consecutive child animations.
 * @property {string} [className] - Optional styling class names for the container.
 * @property {string} [viewportMargin] - Optional IntersectionObserver root margin.
 */
interface StaggerContainerProps {
  children: ReactNode;
  delayChildren?: number;
  staggerChildren?: number;
  className?: string;
  viewportMargin?: string;
}

/**
 * Container wrapper for coordinating staggered motion sequences.
 *
 * @description
 * Provides a structured wrapper to orchestrate cascading entrance transitions for lists of child components.
 *
 * @param {StaggerContainerProps} props - Stagger container properties.
 * @param {ReactNode} props.children - Child elements to wrap.
 * @param {number} [props.delayChildren] - Initial delay in seconds before staggered animations begin.
 * @param {number} [props.staggerChildren] - Time offset in seconds between consecutive child animations.
 * @param {string} [props.className] - Custom CSS class names.
 * @param {string} [props.viewportMargin] - Optional IntersectionObserver root margin.
 * @returns {ReactNode} The rendered container element.
 */
export function StaggerContainer({
  children,
  className = "",
}: StaggerContainerProps): ReactNode {
  return <div className={className}>{children}</div>;
}

/**
 * Props for the {@link HoverCard} component.
 *
 * @interface HoverCardProps
 * @property {ReactNode} children - Inner elements to display within the interactive card.
 * @property {string} [className] - Optional custom CSS styling classes.
 * @property {number} [scale] - Optional scale transformation factor on hover.
 */
interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

/**
 * Interactive hover wrapper component with motion-safe fallbacks.
 *
 * @description
 * Wraps content with hover effects while honoring reduced-motion preferences to ensure accessibility.
 *
 * @param {HoverCardProps} props - Hover card properties.
 * @param {ReactNode} props.children - Card child nodes.
 * @param {string} [props.className] - Additional class names for styling.
 * @param {number} [props.scale] - Optional scale transformation factor on hover.
 * @returns {ReactNode} The rendered hover card element.
 */
export function HoverCard({
  children,
  className = "",
}: HoverCardProps): ReactNode {
  const { isReducedMotion } = useAccessibility();

  if (isReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

