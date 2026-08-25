"use client";

import { useState, useCallback, type FormEvent, type JSX } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { gateClient } from "@/lib/gate/gate-client";
import { GateProgress } from "@/components/molecules/gate/gate-progress";
import type { GateStatus } from "@/lib/gate/types";

/**
 * Properties for configuring the GateLevel3Client puzzle component.
 */
interface GateLevel3ClientProps {
  /** Current gate progression status and completed level history */
  status: GateStatus;
  /** Encoded ciphertext string to be reversed/decoded by user */
  encodedSecret: string;
  /** PHP/pseudocode implementation demonstrating the forward encoding algorithm */
  algorithm: string;
}

/**
 * Interactive client component for the Level 3 gate puzzle.
 *
 * Displays the reversible encoding algorithm source code, the target encoded ciphertext,
 * and a submission form that verifies decoded plaintext via the backend API.
 *
 * @param props - Component properties.
 * @param props.status - Gate progression status.
 * @param props.encodedSecret - Encoded string to reverse.
 * @param props.algorithm - Algorithm implementation source code.
 * @returns Rendered Level 3 gate challenge interface.
 */
export function GateLevel3Client({
  status,
  encodedSecret,
  algorithm,
}: GateLevel3ClientProps): JSX.Element {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(encodedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } // eslint-disable-next-line no-empty
    catch {}
  }, [encodedSecret]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!secret.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    setHint(null);

    try {
      const result = await gateClient.completeLevel3(secret.trim());

      if (result.passed) {
        await gateClient.unlock();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("gate_just_unlocked", "1");
        }
        router.push("/terminal");
      } else {
        setError("Access Denied: Invalid secret.");
        if (result.hint) {
          setHint(result.hint);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to verify secret.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="mb-6 text-center">
        <h1 className="mt-2 text-xl text-green-400">Decode the Secret</h1>
        <p className="mt-2 text-xs text-neutral-400">
          The source code below shows how the secret was encoded. Reverse the
          algorithm to recover the original string.
        </p>
      </header>

      <GateProgress
        currentLevel={status.currentLevel}
        completedLevels={status.completedLevels}
      />

      <div className="mx-auto max-w-lg space-y-4">
                                 
        <div className="rounded border border-neutral-800 bg-black/40 p-4">
          <p className="mb-2 font-mono text-xs text-neutral-500">
            Source code:
          </p>
          <pre
            className="overflow-x-auto font-mono text-xs leading-relaxed text-green-300/80"
            aria-label="Encoding algorithm source code"
          >
            <code>{algorithm}</code>
          </pre>
        </div>

                                    
        <div className="rounded border border-neutral-800 bg-black/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-xs text-neutral-500">
              Encoded output:
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded px-2 py-1 font-mono text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
              aria-label="Copy encoded string to clipboard"
            >
              {copied ? (
                <>
                  <Check size={12} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre
            className="break-all font-mono text-xs leading-relaxed text-amber-300/90"
            aria-label="Encoded secret string"
          >
            <code>{encodedSecret}</code>
          </pre>
        </div>

                           
        <form
          onSubmit={handleSubmit}
          className="rounded border border-neutral-800 bg-black/40 p-4"
        >
          <label
            htmlFor="gate-l3-secret"
            className="mb-2 block font-mono text-xs text-neutral-500"
          >
            Decoded secret:
          </label>
          <div className="flex gap-2">
            <input
              id="gate-l3-secret"
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter the decoded string..."
              autoComplete="off"
              spellCheck={false}
              aria-describedby="gate-l3-instructions"
              className="flex-1 rounded border border-neutral-700 bg-black/60 px-3 py-2 font-mono text-sm text-green-400 placeholder:text-neutral-600 focus:border-green-400/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !secret.trim()}
              className="rounded border border-green-400/40 bg-green-400/10 px-4 py-2 font-mono text-xs text-green-400 transition-colors hover:bg-green-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "..." : "Submit"}
            </button>
          </div>

          <p id="gate-l3-instructions" className="sr-only">
            Reverse the encoding algorithm shown above to decode the secret
            string. Enter the original plaintext value.
          </p>

          {error && (
            <p role="alert" className="mt-3 font-mono text-xs text-red-400">
              {error}
            </p>
          )}
          {hint && (
            <p className="mt-2 font-mono text-xs text-amber-400/80">
              Hint: {hint}
            </p>
          )}
        </form>
      </div>
    </>
  );
}
