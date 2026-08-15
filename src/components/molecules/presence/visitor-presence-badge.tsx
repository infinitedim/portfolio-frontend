"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api/get-api-url";

function wsUrl(): string {
  const api = getApiUrl();
  const url = new URL(api);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/presence";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function VisitorPresenceBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      (/lighthouse|chrome-lighthouse/i.test(navigator.userAgent) ||
        navigator.webdriver)
    ) {
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let closed = false;
    let hasInteracted = false;

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(wsUrl());
      } catch {
        return;
      }

      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: "join", room: "site" }));
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            totalConnections?: number;
            count?: number;
          };
          if (
            msg.type === "welcome" &&
            typeof msg.totalConnections === "number"
          ) {
            setCount(msg.totalConnections);
          }
          if (msg.type === "roomCount" && typeof msg.count === "number") {
            setCount(msg.count);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (pingInterval) clearInterval(pingInterval);
        if (!closed) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };
    };

    const interactionEvents = ["mousemove", "touchstart", "keydown", "scroll"];
    const onInteract = () => {
      if (hasInteracted || closed) return;
      hasInteracted = true;
      connect();
      interactionEvents.forEach((evt) =>
        window.removeEventListener(evt, onInteract),
      );
    };

    interactionEvents.forEach((evt) =>
      window.addEventListener(evt, onInteract, { once: true }),
    );

    const handleUnload = () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingInterval) clearInterval(pingInterval);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingInterval) clearInterval(pingInterval);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
      interactionEvents.forEach((evt) =>
        window.removeEventListener(evt, onInteract),
      );
    };
  }, []);

  if (count === null || count <= 1) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/5 px-2 py-0.5 font-mono text-xs text-green-400"
      title="Visitors currently on site"
    >
      <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
      {count} online
    </span>
  );
}
