"use client";

import { useState } from "react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/services/newsletter-service";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const result = await subscribeNewsletter(email.trim());
      toast.success(
        result.message || "Check your inbox to confirm subscription.",
      );
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Subscription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <label
        htmlFor="newsletter-email"
        className="sr-only"
      >
        Email for newsletter
      </label>
      <input
        id="newsletter-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        disabled={loading}
        className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-100 placeholder-neutral-500 focus:border-green-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded border border-green-400/40 px-4 py-2 font-mono text-xs text-green-400 transition-colors hover:bg-green-400/10 disabled:opacity-50"
      >
        {loading ? "…" : "Subscribe"}
      </button>
    </form>
  );
}
