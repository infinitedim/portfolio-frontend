"use client";

import { useEffect, useState } from "react";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";

export interface PointerDeviceInfo {
  isFinePointer: boolean;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean;
  isCustomCursorSupported: boolean;
}

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
