"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { useTheme } from "@/hooks/use-theme";
import {
  broadcastNewsletter,
  listNewsletterSubscribers,
  type NewsletterSubscriber,
} from "@/lib/services/newsletter-service";
import { toast } from "sonner";

export default function AdminNewsletterPage() {
  const { themeConfig } = useTheme();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNewsletterSubscribers();
      setSubscribers(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (
      !confirm(
        `Send broadcast to ${subscribers.filter((s) => s.confirmed).length} confirmed subscribers?`,
      )
    ) {
      return;
    }

    setBroadcasting(true);
    try {
      const result = await broadcastNewsletter({
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success(`Sent: ${result.sent}, failed: ${result.failed}`);
      setSubject("");
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Broadcast failed");
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text,
        }}
      >
        <TerminalHeader />

        <div className="flex-1 p-6">
          <div
            className="mx-auto max-w-4xl rounded-lg border p-6"
            style={{ borderColor: themeConfig.colors.border }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: themeConfig.colors.accent }}
                >
                  Newsletter
                </h1>
                <p className="text-sm opacity-70">
                  {total} subscriber{total === 1 ? "" : "s"} ·{" "}
                  {subscribers.filter((s) => s.confirmed).length} confirmed
                </p>
              </div>
              <Link
                href="/admin"
                className="text-sm font-mono opacity-70 hover:opacity-100"
              >
                ← Dashboard
              </Link>
            </div>

            <section className="mb-8">
              <h2
                className="mb-3 text-lg font-semibold"
                style={{ color: themeConfig.colors.accent }}
              >
                Broadcast
              </h2>
              <form onSubmit={(e) => void handleBroadcast(e)} className="space-y-3">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  required
                  className="w-full rounded border bg-transparent px-3 py-2 text-sm font-mono"
                  style={{ borderColor: themeConfig.colors.border }}
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Email body (plain text)"
                  rows={6}
                  required
                  className="w-full resize-none rounded border bg-transparent px-3 py-2 text-sm font-mono"
                  style={{ borderColor: themeConfig.colors.border }}
                />
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="rounded border px-4 py-2 font-mono text-sm disabled:opacity-50"
                  style={{
                    borderColor: themeConfig.colors.accent,
                    color: themeConfig.colors.accent,
                  }}
                >
                  {broadcasting ? "Sending…" : "Send broadcast"}
                </button>
              </form>
            </section>

            <section>
              <h2
                className="mb-3 text-lg font-semibold"
                style={{ color: themeConfig.colors.accent }}
              >
                Subscribers
              </h2>
              {loading ? (
                <p className="text-sm opacity-60">Loading…</p>
              ) : subscribers.length === 0 ? (
                <p className="text-sm opacity-60">No subscribers yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b opacity-60" style={{ borderColor: themeConfig.colors.border }}>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2">Subscribed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr
                          key={sub.id}
                          className="border-b"
                          style={{ borderColor: themeConfig.colors.border }}
                        >
                          <td className="py-2 pr-4 font-mono">{sub.email}</td>
                          <td className="py-2 pr-4">
                            {sub.confirmed ? (
                              <span style={{ color: themeConfig.colors.success }}>
                                Confirmed
                              </span>
                            ) : (
                              <span style={{ color: themeConfig.colors.warning }}>
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-xs opacity-70">
                            {new Date(sub.subscribedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
