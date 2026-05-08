"use client";

import { useCallback, useEffect, useState, type JSX } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { useTheme } from "@/hooks/use-theme";
import {
  listMessages,
  markMessageRead,
  deleteMessage,
  type AdminContactMessage,
  type AdminMessagesListResponse,
} from "@/lib/services/admin-messages-service";

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMessagesPage(): JSX.Element {
  return (
    <ProtectedRoute>
      <MessagesInbox />
    </ProtectedRoute>
  );
}

function MessagesInbox(): JSX.Element {
  const { themeConfig } = useTheme();
  const [data, setData] = useState<AdminMessagesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<AdminContactMessage | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMessages({
        page,
        pageSize: PAGE_SIZE,
        unreadOnly,
      });
      setData(result);
      // Keep the selected message in sync with whatever the server returned —
      // matters when the inbox refreshes while a message is open.
      if (selected) {
        const updated = result.items.find((m) => m.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly, selected]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, unreadOnly]);

  const handleSelect = async (msg: AdminContactMessage) => {
    setSelected(msg);
    if (!msg.read) {
      try {
        const updated = await markMessageRead(msg.id, true);
        setSelected(updated);
        // Optimistically reflect the change in the list rather than refetch.
        setData((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((m) => (m.id === updated.id ? updated : m)),
                unread: Math.max(0, prev.unread - 1),
              }
            : prev,
        );
      } catch {
        toast.error("Failed to mark as read");
      }
    }
  };

  const handleToggleRead = async (msg: AdminContactMessage) => {
    try {
      const updated = await markMessageRead(msg.id, !msg.read);
      setSelected((s) => (s && s.id === updated.id ? updated : s));
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((m) =>
                m.id === updated.id ? updated : m,
              ),
              unread: prev.unread + (updated.read ? -1 : 1),
            }
          : prev,
      );
    } catch {
      toast.error("Failed to update message");
    }
  };

  const handleDelete = async (msg: AdminContactMessage) => {
    if (!confirm(`Delete message from ${msg.name}? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteMessage(msg.id);
      setSelected((s) => (s && s.id === msg.id ? null : s));
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((m) => m.id !== msg.id),
              total: Math.max(0, prev.total - 1),
              unread: prev.unread - (msg.read ? 0 : 1),
            }
          : prev,
      );
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: themeConfig.colors.bg,
        color: themeConfig.colors.text,
      }}
    >
      <TerminalHeader />

      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1
                className="text-2xl font-bold font-mono"
                style={{ color: themeConfig.colors.accent }}
              >
                $ inbox
              </h1>
              <p
                className="text-sm font-mono mt-1"
                style={{ color: themeConfig.colors.muted }}
              >
                {data
                  ? `${data.total} total · ${data.unread} unread`
                  : "loading..."}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              <label
                className="flex items-center gap-2 text-xs font-mono cursor-pointer"
                style={{ color: themeConfig.colors.muted }}
              >
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => {
                    setUnreadOnly(e.target.checked);
                    setPage(1);
                  }}
                />
                unread only
              </label>
              <button
                onClick={refresh}
                disabled={loading}
                className="text-xs font-mono px-3 py-1 rounded"
                style={{
                  border: `1px solid ${themeConfig.colors.border}`,
                  color: themeConfig.colors.text,
                }}
              >
                refresh
              </button>
              <Link
                href="/admin"
                className="text-xs font-mono"
                style={{ color: themeConfig.colors.accent }}
              >
                back to admin
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MessageList
              data={data}
              loading={loading}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
            />
            <MessageDetail
              message={selected}
              onToggleRead={handleToggleRead}
              onDelete={handleDelete}
            />
          </div>

          {data && data.total > PAGE_SIZE && (
            <nav className="mt-4 flex justify-center gap-2 text-sm font-mono">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded disabled:opacity-40"
                style={{ border: `1px solid ${themeConfig.colors.border}` }}
              >
                prev
              </button>
              <span style={{ color: themeConfig.colors.muted }}>
                page {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded disabled:opacity-40"
                style={{ border: `1px solid ${themeConfig.colors.border}` }}
              >
                next
              </button>
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}

function MessageList({
  data,
  loading,
  selectedId,
  onSelect,
}: {
  data: AdminMessagesListResponse | null;
  loading: boolean;
  selectedId: string | null;
  onSelect: (msg: AdminContactMessage) => void;
}): JSX.Element {
  const { themeConfig } = useTheme();

  return (
    <div
      className="font-mono text-sm rounded"
      style={{
        border: `1px solid ${themeConfig.colors.border}`,
        backgroundColor: themeConfig.colors.bg,
        minHeight: "400px",
      }}
    >
      {loading && !data ? (
        <p
          className="p-6 text-center"
          style={{ color: themeConfig.colors.muted }}
        >
          loading messages...
        </p>
      ) : !data || data.items.length === 0 ? (
        <p
          className="p-6 text-center"
          style={{ color: themeConfig.colors.muted }}
        >
          no messages.
        </p>
      ) : (
        <ul className="divide-y" style={{ borderColor: themeConfig.colors.border }}>
          {data.items.map((msg) => {
            const isSelected = msg.id === selectedId;
            return (
              <li key={msg.id}>
                <button
                  onClick={() => onSelect(msg)}
                  className="w-full text-left p-3 transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? `${themeConfig.colors.accent}15`
                      : "transparent",
                    borderLeft: `3px solid ${
                      isSelected
                        ? themeConfig.colors.accent
                        : msg.read
                          ? "transparent"
                          : themeConfig.colors.warning
                    }`,
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      style={{
                        color: msg.read
                          ? themeConfig.colors.text
                          : themeConfig.colors.accent,
                        fontWeight: msg.read ? "normal" : "bold",
                      }}
                    >
                      {msg.name}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    className="text-xs mb-1"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    {msg.email}
                  </div>
                  {msg.subject && (
                    <div className="text-xs mb-1 truncate">
                      <span style={{ color: themeConfig.colors.muted }}>
                        re:{" "}
                      </span>
                      {msg.subject}
                    </div>
                  )}
                  <div
                    className="text-xs truncate"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    {msg.message.slice(0, 120)}
                    {msg.message.length > 120 ? "..." : ""}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MessageDetail({
  message,
  onToggleRead,
  onDelete,
}: {
  message: AdminContactMessage | null;
  onToggleRead: (msg: AdminContactMessage) => void;
  onDelete: (msg: AdminContactMessage) => void;
}): JSX.Element {
  const { themeConfig } = useTheme();

  if (!message) {
    return (
      <div
        className="font-mono text-sm rounded p-6 flex items-center justify-center"
        style={{
          border: `1px solid ${themeConfig.colors.border}`,
          color: themeConfig.colors.muted,
          minHeight: "400px",
        }}
      >
        select a message to read
      </div>
    );
  }

  return (
    <div
      className="font-mono text-sm rounded p-4 flex flex-col"
      style={{
        border: `1px solid ${themeConfig.colors.border}`,
        backgroundColor: themeConfig.colors.bg,
        minHeight: "400px",
      }}
    >
      <header className="mb-4 pb-3 border-b" style={{ borderColor: themeConfig.colors.border }}>
        <div className="flex items-center justify-between mb-2">
          <h2
            className="text-lg font-bold"
            style={{ color: themeConfig.colors.accent }}
          >
            {message.subject || "(no subject)"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => onToggleRead(message)}
              className="text-xs px-2 py-1 rounded"
              style={{ border: `1px solid ${themeConfig.colors.border}` }}
            >
              {message.read ? "mark unread" : "mark read"}
            </button>
            <button
              onClick={() => onDelete(message)}
              className="text-xs px-2 py-1 rounded"
              style={{
                border: `1px solid ${themeConfig.colors.error}`,
                color: themeConfig.colors.error,
              }}
            >
              delete
            </button>
          </div>
        </div>
        <div className="text-xs space-y-1">
          <div>
            <span style={{ color: themeConfig.colors.muted }}>from: </span>
            <span>
              {message.name} &lt;
              <a
                href={`mailto:${message.email}`}
                style={{ color: themeConfig.colors.accent }}
              >
                {message.email}
              </a>
              &gt;
            </span>
          </div>
          <div>
            <span style={{ color: themeConfig.colors.muted }}>at: </span>
            <span>{formatDate(message.createdAt)}</span>
          </div>
          {message.ipAddress && (
            <div>
              <span style={{ color: themeConfig.colors.muted }}>ip: </span>
              <span>{message.ipAddress}</span>
            </div>
          )}
          {message.userAgent && (
            <div className="truncate">
              <span style={{ color: themeConfig.colors.muted }}>ua: </span>
              <span>{message.userAgent}</span>
            </div>
          )}
        </div>
      </header>
      <pre
        className="whitespace-pre-wrap wrap-break-word flex-1 overflow-auto"
        style={{ color: themeConfig.colors.text }}
      >
        {message.message}
      </pre>
    </div>
  );
}
