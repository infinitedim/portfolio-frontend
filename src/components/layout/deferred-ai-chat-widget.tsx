"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type JSX } from "react";

const AiChatWidget = dynamic(
  () =>
    import("@/components/molecules/ai/ai-chat-widget").then((mod) => ({
      default: mod.AiChatWidget,
    })),
  { ssr: false },
);

export function DeferredAiChatWidget(): JSX.Element | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setMounted(true), {
        timeout: 4000,
      });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(() => setMounted(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  return <AiChatWidget />;
}
