"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

interface FadeInProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  className?: string;
  distance?: number;
  viewportMargin?: string;
}

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
      { threshold: 0.1 }
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

interface StaggerContainerProps {
  children: ReactNode;
  delayChildren?: number;
  staggerChildren?: number;
  className?: string;
  viewportMargin?: string;
}

export function StaggerContainer({
  children,
  className = "",
}: StaggerContainerProps): ReactNode {
  return <div className={className}>{children}</div>;
}

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export function HoverCard({
  children,
  className = "",
}: HoverCardProps): ReactNode {
  const { isReducedMotion } = useAccessibility();

  if (isReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`transition-transform duration-200 ease-out hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] ${className}`}
    >
      {children}
    </div>
  );
}
