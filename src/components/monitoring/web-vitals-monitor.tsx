

"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/logger/web-vitals";

export function WebVitalsMonitor(): null {
  useEffect(() => {
    
    initWebVitals();
  }, []);

  
  return null;
}

export default WebVitalsMonitor;
