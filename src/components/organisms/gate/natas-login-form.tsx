"use client";

import { useState, type FormEvent, type JSX } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { gateClient } from "@/lib/gate/gate-client";
import { GATE_L1_USERNAME, GATE_L2_USERNAME } from "@/lib/gate/types";

interface NatasLoginFormProps {
  level: 1 | 2;
  onPassed: (nextLevel?: number) => void;
  showCredentials?: boolean;
  hint?: string;
}

export function NatasLoginForm({
  level,
  onPassed,
  showCredentials = false,
  hint,
}: NatasLoginFormProps): JSX.Element {
  const { t } = useI18n();
  const defaultUsername = level === 1 ? GATE_L1_USERNAME : GATE_L2_USERNAME;
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !password.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await gateClient.login({
        level,
        username: username.trim(),
        password: password.trim(),
      });
      if (result.attempts !== undefined) {
        setAttempts(result.attempts);
      }
      if (result.hint) {
        setHintText(result.hint);
      }
      if (result.passed) {
        onPassed(result.nextLevel);
      } else {
        setError("Login failed. Try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      {showCredentials && (
        <div className="rounded border border-green-400/30 bg-green-400/5 p-4 font-mono text-xs text-green-300">
          <p className="text-neutral-400">Hint: credentials for this level</p>
          <p className="mt-2">
            Username: <span className="text-green-400">{GATE_L1_USERNAME}</span>
          </p>
          <p>
            Password: <span className="text-green-400">{GATE_L1_USERNAME}</span>
          </p>
        </div>
      )}

      {hint && <p className="font-mono text-xs text-neutral-400">{hint}</p>}

      <form
        onSubmit={handleSubmit}
        className="rounded border border-neutral-800 bg-black/40 p-4"
      >
        <label className="block font-mono text-xs text-neutral-400">
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            readOnly={level === 2}
            className="mt-2 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-green-400 outline-none focus:border-green-400/50 read-only:opacity-70"
            autoComplete="off"
            spellCheck={false}
            disabled={submitting}
          />
        </label>

        <label className="mt-3 block font-mono text-xs text-neutral-400">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-green-400 outline-none focus:border-green-400/50"
            autoComplete="off"
            spellCheck={false}
            disabled={submitting}
          />
        </label>

        <button
          type="submit"
          disabled={submitting || !password.trim()}
          className="mt-4 rounded border border-green-400/40 bg-green-400/10 px-4 py-2 font-mono text-xs text-green-400 transition-colors hover:bg-green-400/20 disabled:opacity-50"
        >
          {submitting ? "..." : "Log in"}
        </button>

        {attempts > 0 && (
          <p className="mt-2 font-mono text-xs text-neutral-400">
            Attempts: {attempts}
          </p>
        )}
        {hintText && (
          <p className="mt-2 font-mono text-xs text-amber-400/90">
            {t("gateHint")}: {hintText}
          </p>
        )}
        {error && (
          <p className="mt-2 font-mono text-xs text-red-400">{error}</p>
        )}
      </form>
    </div>
  );
}
