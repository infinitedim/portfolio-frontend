"use client";

import { useCallback, useEffect, useState, type JSX } from "react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import {
  listMessages,
  markMessageRead,
  deleteMessage,
  bulkMarkMessagesRead,
  bulkDeleteMessages,
  type AdminContactMessage,
  type AdminMessagesListResponse,
} from "@/lib/services/admin-messages-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/molecules/admin/confirm-dialog";
import {
  Inbox,
  Mail,
  MailOpen,
  Trash2,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  User,
  Clock,
  Send,
} from "lucide-react";

const PAGE_SIZE = 15;

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
  const { themeConfig } = useTheme();
  const [data, setData] = useState<AdminMessagesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<AdminContactMessage | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Mobile View Toggle ("list" vs "detail")
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  // Confirm Delete Dialog state
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<AdminContactMessage | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Clear checkedIds on page or filter change (fixes pagination bulk action leak)
  useEffect(() => {
    setCheckedIds(new Set());
  }, [page, unreadOnly, searchQuery]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMessages({
        page,
        pageSize: PAGE_SIZE,
        unreadOnly,
      });
      setData(result);
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
    setMobileView("detail");
    if (!msg.read) {
      try {
        const updated = await markMessageRead(msg.id, true);
        setSelected(updated);
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
        toast.error("Failed to mark message as read");
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
              items: prev.items.map((m) => (m.id === updated.id ? updated : m)),
              unread: prev.unread + (updated.read ? -1 : 1),
            }
          : prev,
      );
      toast.success(updated.read ? "Marked as read" : "Marked as unread");
    } catch {
      toast.error("Failed to update message");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmMsg) return;
    try {
      await deleteMessage(deleteConfirmMsg.id);
      setSelected((s) => (s && s.id === deleteConfirmMsg.id ? null : s));
      setCheckedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteConfirmMsg.id);
        return next;
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((m) => m.id !== deleteConfirmMsg.id),
              total: Math.max(0, prev.total - 1),
              unread: prev.unread - (deleteConfirmMsg.read ? 0 : 1),
            }
          : prev,
      );
      setDeleteConfirmMsg(null);
      if (mobileView === "detail") setMobileView("list");
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = Array.from(checkedIds);
    if (ids.length === 0) return;
    try {
      await bulkDeleteMessages(ids);
      setCheckedIds(new Set());
      if (selected && ids.includes(selected.id)) {
        setSelected(null);
        setMobileView("list");
      }
      toast.success(`Deleted ${ids.length} messages`);
      setBulkDeleteConfirmOpen(false);
      await refresh();
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  const handleBulkRead = async () => {
    const ids = Array.from(checkedIds);
    if (ids.length === 0) return;
    try {
      await bulkMarkMessagesRead(ids);
      setCheckedIds(new Set());
      toast.success(`Marked ${ids.length} messages as read`);
      await refresh();
    } catch {
      toast.error("Bulk mark read failed");
    }
  };

  const toggleChecked = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const items = data?.items ?? [];
  const filteredItems = searchQuery.trim()
    ? items.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.message.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const allOnPageChecked =
    items.length > 0 && items.every((m) => checkedIds.has(m.id));

  const toggleAllOnPage = () => {
    if (allOnPageChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        items.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        items.forEach((m) => next.add(m.id));
        return next;
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono text-sm">
      {/* Header Bar */}
      <div
        className="p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-(--terminal-accent)/10 text-(--terminal-accent)">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-(--terminal-accent)">
              Contact Messages Inbox
            </h1>
            <p className="text-xs text-(--terminal-muted)">
              Review, filter, search, and respond to inquiries sent via contact form.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="terminal" className="text-xs px-2.5 py-1">
            Unread: {data?.unread ?? 0} / Total: {data?.total ?? 0}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="gap-2 border-(--terminal-border)"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="p-4 rounded-lg border flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--terminal-muted)" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sender, email, or message body..."
              className="pl-9 text-xs"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setUnreadOnly(!unreadOnly);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
              unreadOnly
                ? "border-amber-400 bg-amber-500/15 text-amber-300 font-bold"
                : "border-(--terminal-border) text-(--terminal-muted) hover:text-(--terminal-text)"
            }`}
          >
            {unreadOnly ? "● Unread Only" : "All Messages"}
          </button>
        </div>

        {/* Bulk Actions */}
        {checkedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-(--terminal-accent) font-semibold">
              {checkedIds.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRead}
              className="h-8 text-xs border-(--terminal-border)"
            >
              Mark Read
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteConfirmOpen(true)}
              className="h-8 text-xs"
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Main Master-Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[600px]">
        {/* List Pane (col-span-2 desktop, mobileView === 'list' mobile) */}
        <div
          className={`lg:col-span-2 border rounded-lg overflow-hidden flex flex-col ${
            mobileView === "detail" ? "hidden lg:flex" : "flex"
          }`}
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          {/* List Header */}
          <div className="p-3 border-b flex items-center justify-between text-xs bg-(--terminal-accent)/5 border-(--terminal-border)">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={allOnPageChecked}
                onChange={toggleAllOnPage}
                className="w-4 h-4 rounded accent-(--terminal-accent)"
              />
              Select Page ({items.length})
            </label>
            <span className="text-(--terminal-muted)">
              Page {page} of {totalPages}
            </span>
          </div>

          {/* List Body */}
          <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-(--terminal-border)/40">
            {loading ? (
              <div className="p-8 text-center text-xs text-(--terminal-muted) animate-pulse">
                Loading messages inbox...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-xs text-(--terminal-muted) space-y-2">
                <Inbox className="h-10 w-10 mx-auto text-(--terminal-muted) opacity-30" />
                <p>No messages found in inbox.</p>
                <div className="pt-2">
                  <Badge variant="outline" className="text-[10px]">
                    queue.status :: empty
                  </Badge>
                </div>
              </div>
            ) : (
              filteredItems.map((msg) => {
                const isSelected = selected?.id === msg.id;
                const isChecked = checkedIds.has(msg.id);
                return (
                  <button
                    key={msg.id}
                    type="button"
                    className={`w-full text-left p-3 transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-(--terminal-accent)/15 border-l-4 border-l-(--terminal-accent)"
                        : !msg.read
                        ? "bg-(--terminal-accent)/5 font-bold"
                        : "hover:bg-(--terminal-accent)/5"
                    }`}
                    onClick={() => handleSelect(msg)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleChecked(msg.id);
                      }}
                      className="mt-1 w-4 h-4 rounded accent-(--terminal-accent)"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`truncate ${!msg.read ? "text-(--terminal-accent) font-bold" : "text-(--terminal-text)"}`}>
                          {msg.name}
                        </span>
                        <span className="text-[10px] text-(--terminal-muted) shrink-0 ml-2">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>

                      <div className="text-xs truncate text-(--terminal-text)">
                        {msg.subject || "(No Subject)"}
                      </div>

                      <div className="text-[11px] text-(--terminal-muted) truncate">
                        {msg.message}
                      </div>
                    </div>

                    {!msg.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" title="Unread" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* List Pagination */}
          <div className="p-3 border-t flex items-center justify-between text-xs border-(--terminal-border) bg-(--terminal-bg)">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-7 text-xs gap-1 border-(--terminal-border)"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <span className="text-(--terminal-muted)">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="h-7 text-xs gap-1 border-(--terminal-border)"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Detail Pane (col-span-3 desktop, mobileView === 'detail' mobile) */}
        <div
          className={`lg:col-span-3 border rounded-lg overflow-hidden flex flex-col ${
            mobileView === "list" ? "hidden lg:flex" : "flex"
          }`}
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.border,
          }}
        >
          {selected ? (
            <div className="flex-1 flex flex-col min-h-[600px]">
              {/* Detail Toolbar */}
              <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3 border-(--terminal-border) bg-(--terminal-accent)/5">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileView("list")}
                    className="lg:hidden h-8 text-xs gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Inbox
                  </Button>
                  <Badge variant={selected.read ? "outline" : "warning"}>
                    {selected.read ? "READ" : "UNREAD"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleRead(selected)}
                    className="h-8 text-xs gap-1 border-(--terminal-border)"
                  >
                    {selected.read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
                    {selected.read ? "Mark Unread" : "Mark Read"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirmMsg(selected)}
                    className="h-8 text-xs gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>

              {/* Detail Content */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="space-y-3 border-b pb-4 border-(--terminal-border)">
                  <h2 className="text-lg font-bold text-(--terminal-accent)">
                    {selected.subject || "(No Subject)"}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-(--terminal-muted)">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-(--terminal-accent)" />
                      <span>Sender: <strong className="text-(--terminal-text)">{selected.name}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-(--terminal-accent)" />
                      <span>Email: <a href={`mailto:${selected.email}`} className="text-(--terminal-accent) underline">{selected.email}</a></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-(--terminal-accent)" />
                      <span>Received: <strong className="text-(--terminal-text)">{formatDate(selected.createdAt)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-4 rounded-lg border border-(--terminal-border) bg-black/30 text-sm leading-relaxed whitespace-pre-wrap text-(--terminal-text) font-mono">
                  {selected.message}
                </div>

                {/* Inline Quick Reply Action */}
                <div className="pt-4 border-t border-(--terminal-border) space-y-2">
                  <h3 className="font-bold text-xs text-(--terminal-accent)">
                    Quick Reply Action
                  </h3>
                  <Button variant="terminal" size="sm" asChild className="gap-2">
                    <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Contact Inquiry")}`}>
                      <Send className="h-4 w-4" /> Reply via Mail Client ({selected.email})
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-(--terminal-muted) space-y-2">
              <Mail className="h-10 w-10 text-(--terminal-muted) opacity-40" />
              <p>Select a contact message from the list to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Single Message */}
      <ConfirmDialog
        open={Boolean(deleteConfirmMsg)}
        onOpenChange={(open) => !open && setDeleteConfirmMsg(null)}
        title="Delete Contact Message"
        description={`Are you sure you want to delete the message from "${deleteConfirmMsg?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Message"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Confirm Bulk Delete */}
      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        title="Delete Selected Messages"
        description={`Are you sure you want to delete ${checkedIds.size} selected message(s)? This action cannot be undone.`}
        confirmLabel="Delete Selected"
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
