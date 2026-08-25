"use client";

import { useEffect, useState } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

/**
 * Hardware pointer capabilities and motion preference descriptors.
 */
export interface PointerDeviceInfo {
  /** True if the primary input mechanism is a precise pointing device such as a mouse. */
  isFinePointer: boolean;
  /** True if the device relies primarily on touch input and has a mobile-tier viewport. */
  isTouchDevice: boolean;
  /** True if OS settings or app accessibility settings request reduced animations. */
  prefersReducedMotion: boolean;
  /** True if custom interactive cursors can be safely rendered without interfering with touch UX or accessibility. */
  isCustomCursorSupported: boolean;
}

/**
 * Custom React hook for querying pointing device characteristics, touch capabilities, and motion preferences.
 *
 * Integrates CSS media queries (`prefers-reduced-motion`), viewport width, touch capability checks,
 * and user accessibility overrides to determine whether features like custom cursors should be enabled.
 *
 * @returns A {@link PointerDeviceInfo} object with computed pointer and motion parameters.
 *
 * @example
 * ```tsx
 * const { isCustomCursorSupported, isTouchDevice } = usePointerDevice();
 *
 * return (
 *   <>
 *     {isCustomCursorSupported && <CustomCursor />}
 *     <MainContent touchMode={isTouchDevice} />
 *   </>
 * );
 * ```
 */
export function usePointerDevice(): PointerDeviceInfo {
  const { isReducedMotion: accessibilityReducedMotion } = useAccessibility();

  const [deviceInfo, setDeviceInfo] = useState<PointerDeviceInfo>({
    isFinePointer: true,
    isTouchDevice: false,
    prefersReducedMotion: false,
    isCustomCursorSupported: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateDeviceInfo = () => {
      const isMobileTouch = window.innerWidth < 768 && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
      const isReduced = reducedMotionQuery.matches || accessibilityReducedMotion;
      const isSupported = !isMobileTouch && !isReduced;

      setDeviceInfo({
        isFinePointer: !isMobileTouch,
        isTouchDevice: isMobileTouch,
        prefersReducedMotion: isReduced,
        isCustomCursorSupported: isSupported,
      });
    };

    updateDeviceInfo();
    window.addEventListener("resize", updateDeviceInfo);
    reducedMotionQuery.addEventListener("change", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      reducedMotionQuery.removeEventListener("change", updateDeviceInfo);
    };
  }, [accessibilityReducedMotion]);

  return deviceInfo;
}
