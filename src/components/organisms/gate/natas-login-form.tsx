"use client";

import { useState, type SubmitEvent, type JSX } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { gateClient } from "@/lib/gate/gate-client";
import { GATE_L1_USERNAME, GATE_L2_USERNAME } from "@/lib/gate/types";
import { runRecruiterBypass } from "@/lib/gate/gate-bypass-helper";

/**
 * Properties for configuring the NatasLoginForm puzzle component.
 */
interface NatasLoginFormProps {
  /** Target puzzle level (1 or 2) */
  level: 1 | 2;
  /** Callback fired when the level challenge is successfully passed */
  onPassed: (nextLevel?: number) => void;
  /** Whether to display explicit login credentials helper banner */
  showCredentials?: boolean;
  /** Optional contextual hint message displayed above the form */
  hint?: string;
}

/**
 * NATAS-style challenge authentication form for gate levels 1 and 2.
 *
 * Provides username/password submission, attempt counters, dynamic hint alerts,
 * and a development-only recruiter auto-unlock bypass action.
 *
 * @param props - Component properties.
 * @param props.level - Gate level identifier (1 or 2).
 * @param props.onPassed - Callback invoked upon successful authentication.
 * @param props.showCredentials - Whether to show credential hints.
 * @param props.hint - Contextual level hint text.
 * @returns Rendered challenge login form interface.
 */
export function NatasLoginForm({
  level,
  onPassed,
  showCredentials = false,
  hint,
}: NatasLoginFormProps): JSX.Element {
  const router = useRouter();
  const { t } = useI18n();
  const defaultUsername = level === 1 ? GATE_L1_USERNAME : GATE_L2_USERNAME;
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);
  const [bypassStatus, setBypassStatus] = useState("");

  const handleBypass = async () => {
    setBypassLoading(true);
    setError(null);
    try {
      await runRecruiterBypass((progress) => {
        setBypassStatus(progress.message);
      });
      router.push("/terminal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bypass failed");
      setBypassLoading(false);
    }
  };

  const handleSubmit = async (e: SubmitEvent) => {
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

      {level === 1 && (
        <div className="mt-6 border-t border-neutral-800 pt-6 text-center space-y-3">
          <p className="text-xs text-neutral-500 font-mono">
            Looking for the standard portfolio?
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full rounded border border-neutral-700 bg-neutral-900/80 px-4 py-2.5 font-mono text-xs text-neutral-300 transition-all hover:border-green-400/50 hover:text-green-400"
          >
            <ArrowLeft size={14} />
            $ cd / --standard
          </Link>

          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              onClick={handleBypass}
              disabled={submitting || bypassLoading}
              className="w-full rounded border border-amber-400/40 bg-amber-400/10 px-4 py-2 font-mono text-xs text-amber-400 transition-all hover:bg-amber-400/20 disabled:opacity-50 cursor-pointer"
            >
              {bypassLoading ? bypassStatus : "[DEV ONLY] Auto Unlock Gate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
