"use client";

import { useState, type FormEvent, type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { gateClient } from "@/lib/gate/gate-client";

interface GateLevelProps {
  level: number;
  onPassed: (nextLevel?: number) => void;
  children?: React.ReactNode;
}

export function GateLevel({
  level,
  onPassed,
  children,
}: GateLevelProps): JSX.Element {
  const { t } = useI18n();
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !answer.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await gateClient.verify({ level, answer: answer.trim() });
      if (result.attempts !== undefined) {
        setAttempts(result.attempts);
      }
      if (result.hint) {
        setHint(result.hint);
      }
      if (result.passed) {
        onPassed(result.nextLevel);
      } else {
        setError("Incorrect. Try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {children}

      <form
        onSubmit={handleSubmit}
        className="rounded border border-neutral-800 bg-black/40 p-4"
      >
        <label className="block font-mono text-xs text-neutral-400">
          Submit password
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="mt-2 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-green-400 outline-none focus:border-green-400/50"
            autoComplete="off"
            spellCheck={false}
            disabled={submitting}
          />
        </label>

        <button
          type="submit"
          disabled={submitting || !answer.trim()}
          className="mt-3 rounded border border-green-400/40 bg-green-400/10 px-4 py-2 font-mono text-xs text-green-400 transition-colors hover:bg-green-400/20 disabled:opacity-50"
        >
          {submitting ? "..." : t("gateSubmit")}
        </button>

        {attempts > 0 && (
          <p className="mt-2 font-mono text-xs text-neutral-500">
            Attempts: {attempts}
          </p>
        )}
        {hint && (
          <p className="mt-2 font-mono text-xs text-amber-400/90">
            {t("gateHint")}: {hint}
          </p>
        )}
        {error && (
          <p className="mt-2 font-mono text-xs text-red-400">{error}</p>
        )}
      </form>
    </div>
  );
}
