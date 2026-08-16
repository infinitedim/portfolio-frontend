"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/use-theme";
import {
  broadcastNewsletter,
  listNewsletterSubscribers,
  type NewsletterSubscriber,
} from "@/lib/services/newsletter-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/molecules/admin/confirm-dialog";
import { toast } from "sonner";
import { Mail, Send, Download, Search, RefreshCw, ArrowLeft, Eye, Edit3, CheckCircle2, Clock } from "lucide-react";

export default function AdminNewsletterPage() {
  const { themeConfig } = useTheme();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Broadcast Form & Preview
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastConfirmOpen, setBroadcastConfirmOpen] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending">("all");

  // LocalStorage draft autosave key
  const DRAFT_KEY = "portfolio_newsletter_broadcast_draft";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const { subject: s, body: b } = JSON.parse(saved);
        if (s) setSubject(s);
        if (b) setBody(b);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveDraftLocally = (subVal: string, bodyVal: string) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ subject: subVal, body: bodyVal }));
    } catch {
      // Ignore
    }
  };

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNewsletterSubscribers();
      setSubscribers(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load subscribers",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscribers();
  }, [loadSubscribers]);

  const handleBroadcastConfirm = async () => {
    if (!subject.trim() || !body.trim()) return;

    setBroadcasting(true);
    try {
      const result = await broadcastNewsletter({
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success(`Broadcast sent! Delivered: ${result.sent}, Failed: ${result.failed}`);
      setSubject("");
      setBody("");
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Ignore
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.error("No subscribers available to export");
      return;
    }

    const headers = ["ID", "Email", "Status", "Subscribed At"];
    const rows = subscribers.map((s) => [
      s.id,
      s.email,
      s.confirmed ? "Confirmed" : "Pending",
      new Date(s.subscribedAt).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Subscribers exported to CSV");
  };

  const confirmedCount = subscribers.filter((s) => s.confirmed).length;

  const filteredSubscribers = subscribers.filter((s) => {
    const matchesSearch = s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "confirmed" && s.confirmed) ||
      (statusFilter === "pending" && !s.confirmed);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-sm">
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
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-(--terminal-accent)">
              Newsletter & Audience Broadcast
            </h1>
            <p className="text-xs text-(--terminal-muted)">
              {total} subscriber{total === 1 ? "" : "s"} · {confirmedCount} confirmed double opt-in
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="h-8 gap-2 border-(--terminal-border)">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 gap-1.5 border-(--terminal-border)"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Broadcast Email Composer */}
      <div
        className="p-6 rounded-lg border space-y-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex items-center justify-between border-b pb-3 border-(--terminal-border)">
          <h2 className="text-base font-bold text-(--terminal-accent) flex items-center gap-2">
            <Send className="h-4 w-4" /> Broadcast Email Composer
          </h2>

          <div className="flex items-center gap-1 rounded bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTab === "edit"
                  ? "bg-(--terminal-accent)/20 text-(--terminal-accent) font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Edit3 size={13} /> Edit Body
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                activeTab === "preview"
                  ? "bg-(--terminal-accent)/20 text-(--terminal-accent) font-bold"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Eye size={13} /> Rendered Preview
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!subject.trim() || !body.trim()) {
              toast.error("Subject and body cannot be empty");
              return;
            }
            setBroadcastConfirmOpen(true);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-subject">Broadcast Subject Line *</Label>
            <Input
              id="broadcast-subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                saveDraftLocally(e.target.value, body);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault(); // Prevent accidental submission
              }}
              placeholder="e.g. Portfolio Update: New Engineering Articles Released"
              required
            />
          </div>

          {activeTab === "edit" ? (
            <div className="space-y-1.5">
              <Label htmlFor="broadcast-body">Email Body Text (Plain Text / Markdown) *</Label>
              <Textarea
                id="broadcast-body"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  saveDraftLocally(subject, e.target.value);
                }}
                rows={8}
                placeholder="Write your broadcast message here..."
                required
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Rendered Email Preview</Label>
              <div className="p-6 rounded-lg border border-(--terminal-border) bg-black/40 text-sm leading-relaxed whitespace-pre-wrap font-mono min-h-[180px]">
                <div className="border-b pb-3 mb-3 text-xs text-(--terminal-muted)">
                  <strong>To:</strong> All {confirmedCount} Confirmed Subscribers<br />
                  <strong>Subject:</strong> {subject || "(No Subject)"}
                </div>
                {body || "No email body text entered yet."}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-(--terminal-muted)">
              Draft auto-saved locally in browser storage.
            </span>
            <Button
              type="submit"
              variant="terminal"
              disabled={broadcasting || !subject.trim() || !body.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {broadcasting ? "Sending Broadcast..." : `Send Broadcast (${confirmedCount} Recipient${confirmedCount === 1 ? "" : "s"})`}
            </Button>
          </div>
        </form>
      </div>

      {/* Subscriber Management Section */}
      <div
        className="p-6 rounded-lg border space-y-4"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3 border-(--terminal-border)">
          <h2 className="text-base font-bold text-(--terminal-accent) flex items-center gap-2">
            <Mail className="h-4 w-4" /> Subscriber Directory ({filteredSubscribers.length})
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-(--terminal-muted)" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subscriber email..."
                className="pl-8 h-8 text-xs w-48"
              />
            </div>

            <div className="flex items-center gap-1 rounded bg-black/20 p-1 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  statusFilter === "all" ? "bg-(--terminal-accent)/20 text-(--terminal-accent) font-bold" : "text-(--terminal-muted)"
                }`}
              >
                All ({subscribers.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("confirmed")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  statusFilter === "confirmed" ? "bg-emerald-500/20 text-emerald-400 font-bold" : "text-(--terminal-muted)"
                }`}
              >
                Confirmed ({confirmedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  statusFilter === "pending" ? "bg-amber-500/20 text-amber-400 font-bold" : "text-(--terminal-muted)"
                }`}
              >
                Pending ({subscribers.length - confirmedCount})
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={loadSubscribers} disabled={loading} className="h-8 gap-1 border-(--terminal-border)">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subscriber Email</TableHead>
              <TableHead>Double Opt-In Status</TableHead>
              <TableHead>Subscribed Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-xs text-(--terminal-muted)">
                  Loading subscriber directory...
                </TableCell>
              </TableRow>
            ) : filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12 text-xs text-(--terminal-muted)">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No subscribers matching search criteria.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-mono text-xs text-(--terminal-text)">
                    {sub.email}
                  </TableCell>
                  <TableCell>
                    {sub.confirmed ? (
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Confirmed
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1 text-[10px]">
                        <Clock className="h-3 w-3" /> Pending Opt-In
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-(--terminal-muted)">
                    {new Date(sub.subscribedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Broadcast Dialog */}
      <ConfirmDialog
        open={broadcastConfirmOpen}
        onOpenChange={setBroadcastConfirmOpen}
        title="Send Newsletter Broadcast"
        description={`Are you sure you want to send this broadcast email to all ${confirmedCount} confirmed subscribers?`}
        confirmLabel="Send Broadcast Now"
        variant="default"
        onConfirm={handleBroadcastConfirm}
        isLoading={broadcasting}
      />
    </div>
  );
}
