"use client";

import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/services/newsletter-service";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SubmitEvent) => {
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
      className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row font-mono items-center"
    >
      <label
        htmlFor="newsletter-email"
        className="sr-only"
      >
        Email for newsletter
      </label>
      <div className="relative w-full flex-1 flex items-center">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-emerald-400 select-none pointer-events-none flex items-center justify-center"
          aria-hidden="true"
        >
          $
        </span>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900/90 pl-7 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors font-mono"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto rounded-lg bg-emerald-400 text-neutral-950 font-semibold px-4 py-2 text-xs hover:bg-emerald-300 transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/10 cursor-pointer select-none whitespace-nowrap"
      >
        {loading ? "$ Submitting..." : "$ dispatch --submit"}
      </button>
    </form>
  );
}
