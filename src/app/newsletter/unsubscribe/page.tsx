"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { unsubscribeNewsletter } from "@/lib/services/newsletter-service";
import { toast } from "sonner";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    try {
      const result = await unsubscribeNewsletter(token.trim());
      setMessage(result.message);
      setDone(true);
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unsubscribe failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-4 text-2xl font-bold text-green-400">Unsubscribe</h1>
      {done ? (
        <p className="text-gray-300">{message}</p>
      ) : (
        <form
          onSubmit={(e) => void handleUnsubscribe(e)}
          className="space-y-4"
        >
          <p className="text-sm text-gray-400">
            Enter your unsubscribe token from the newsletter email, or use the
            link provided in the message.
          </p>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Unsubscribe token"
            required
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-green-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded border border-red-400/40 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 disabled:opacity-50"
          >
            {loading ? "Processing…" : "Unsubscribe"}
          </button>
        </form>
      )}
      <Link
        href="/"
        className="mt-8 inline-block text-green-400 hover:text-green-300"
      >
        ← Back to home
      </Link>
    </div>
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <StandardPageLayout>
      <Suspense
        fallback={
          <div className="py-16 text-center text-gray-400">Loading…</div>
        }
      >
        <UnsubscribeContent />
      </Suspense>
    </StandardPageLayout>
  );
}
