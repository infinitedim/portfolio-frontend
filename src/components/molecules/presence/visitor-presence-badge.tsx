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
      /lighthouse|chrome-lighthouse/i.test(navigator.userAgent)
    ) {
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(wsUrl());
      } catch {
        return;
      }

      ws.onopen = () => {
        ws?.send(JSON.stringify({ type: "join", room: "site" }));
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
        if (!closed) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  if (count === null || count <= 1) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/5 px-2 py-0.5 font-mono text-xs text-green-400"
      title="Visitors currently on site"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
      </span>
      {count} online
    </span>
  );
}
