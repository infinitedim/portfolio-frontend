"use client";

import { useState, type JSX } from "react";
import { gateClient } from "@/lib/gate/gate-client";
import { GateLevel } from "./gate-level";

const OFFSET = 528;
const RET_ADDR = "e0d7ffff";
const NOP_COUNT = 200;
const SHELLCODE_HEX =
  "909090909031c066bb7a696689e6ff0e6683c905894c241c8d542408cd80c3";

function buildFuzzPattern(): string {
  let pattern = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < OFFSET + 4; i++) {
    pattern += chars[i % chars.length];
  }
  return pattern + "BBBB";
}

export function OverflowPayloadBuilder({
  onPassed,
}: {
  onPassed: (nextLevel?: number) => void;
}): JSX.Element {
  const [offset, setOffset] = useState<number | null>(null);
  const [payload, setPayload] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fuzz = async () => {
    setLoading(true);
    setError(null);
    try {
      const input = buildFuzzPattern();
      const result = await gateClient.l3Crash({ input });
      setOffset(result.eipOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crash failed");
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = () => {
    const pad = "A".repeat(OFFSET);
    const nops = "90".repeat(NOP_COUNT);
    const hex = pad + RET_ADDR + nops + SHELLCODE_HEX;
    setPayload(hex);
  };

  const runPayload = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await gateClient.l3Run({ payload });
      setPassword(result.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded border border-neutral-800 p-4 font-mono text-xs">
        <p className="mb-2 text-neutral-400">Stack layout:</p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded bg-blue-900/40 px-2 py-1 text-blue-300">
            buffer {OFFSET}
          </span>
          <span className="rounded bg-red-900/40 px-2 py-1 text-red-300">
            EIP 4
          </span>
          <span className="rounded bg-yellow-900/40 px-2 py-1 text-yellow-300">
            NOP {NOP_COUNT}
          </span>
          <span className="rounded bg-green-900/40 px-2 py-1 text-green-300">
            shellcode
          </span>
        </div>
      </div>

      <div className="rounded border border-neutral-800 p-4">
        <button
          type="button"
          onClick={fuzz}
          disabled={loading}
          className="rounded border border-amber-400/40 px-3 py-1 font-mono text-xs text-amber-300"
        >
          Fuzz for offset
        </button>
        {offset !== null && (
          <p className="mt-2 font-mono text-xs text-green-400">
            EIP offset: {offset} — Segmentation fault at 0x42424242
          </p>
        )}
      </div>

      <div className="rounded border border-neutral-800 p-4">
        <p className="mb-2 font-mono text-xs text-neutral-500">
          Shellcode (read-only):
        </p>
        <code className="block break-all font-mono text-xs text-neutral-600">
          {SHELLCODE_HEX}
        </code>
        <button
          type="button"
          onClick={buildPayload}
          className="mt-3 rounded border border-neutral-600 px-3 py-1 font-mono text-xs text-neutral-300"
        >
          Build payload template
        </button>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded border border-neutral-700 bg-neutral-950 p-2 font-mono text-xs text-green-400"
          placeholder="hex payload..."
        />
        <p className="mt-1 font-mono text-xs text-neutral-600">
          Length: {payload.length} chars
        </p>
        <button
          type="button"
          onClick={runPayload}
          disabled={loading || !payload}
          className="mt-2 rounded border border-green-400/40 px-3 py-1 font-mono text-xs text-green-400"
        >
          Execute payload
        </button>
        {password && (
          <p className="mt-2 font-mono text-xs text-green-400">
            Password obtained — submit below.
          </p>
        )}
      </div>

      {error && (
        <p className="font-mono text-xs text-red-400">{error}</p>
      )}

      {password && (
        <GateLevel
          level={3}
          onPassed={onPassed}
        />
      )}
    </div>
  );
}
