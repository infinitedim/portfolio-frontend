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
          className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-(--terminal-accent) select-none pointer-events-none flex items-center justify-center"
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
          className="w-full rounded-lg border border-(--terminal-border) bg-(--terminal-bg) pl-7 pr-3 py-2 text-xs text-(--terminal-text) placeholder-(--terminal-muted)/60 focus:border-(--terminal-accent) focus:ring-1 focus:ring-(--terminal-accent) focus:outline-none transition-colors font-mono"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto rounded-lg bg-(--terminal-accent) text-(--terminal-bg) font-semibold px-4 py-2 text-xs hover:opacity-90 transition-colors disabled:opacity-50 shadow-md shadow-(--terminal-accent)/10 cursor-pointer select-none whitespace-nowrap"
      >
        {loading ? "$ Submitting..." : "$ dispatch --submit"}
      </button>
    </form>
  );
}
