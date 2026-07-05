"use client";

import { useCallback, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { streamAiChat, type ChatTurn } from "@/lib/services/ai-service";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);

    const history: ChatTurn[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();

    try {
      await streamAiChat(
        { message: text, history },
        (token) => {
          assistantText += token;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: assistantText,
            };
            return next;
          });
        },
        abortRef.current.signal,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get AI response";
      setError(message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-green-400/40 bg-neutral-950 text-green-400 shadow-lg transition-transform hover:scale-105"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 flex h-105 w-[min(100vw-3rem,360px)] flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-2xl">
          <header className="border-b border-neutral-800 px-4 py-3">
            <h2 className="font-mono text-sm font-semibold text-green-400">
              Portfolio Assistant
            </h2>
            <p className="text-xs text-neutral-500">
              Ask about projects, blog posts, and skills
            </p>
          </header>

          <div
            data-lenis-prevent
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {messages.length === 0 && (
              <p className="text-xs text-neutral-500">
                Try: &ldquo;What projects have you built?&rdquo;
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "ml-6 bg-green-400/10 text-neutral-100"
                    : "mr-6 bg-neutral-900 text-neutral-300"
                }`}
              >
                {msg.content ||
                  (streaming && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
            {error && (
              <p
                className="text-xs text-red-400"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <div className="border-t border-neutral-800 p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Ask a question…"
                disabled={streaming}
                className="flex-1 resize-none rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-green-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={streaming || !input.trim()}
                className="self-end rounded border border-green-400/40 px-3 py-2 text-green-400 transition-colors hover:bg-green-400/10 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
