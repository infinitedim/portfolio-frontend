"use client";

import { useState, type JSX } from "react";
import { gateClient } from "@/lib/gate/gate-client";
import { GateLevel } from "./gate-level";

type Step = 1 | 2 | 3;

export function PharUploadSimulator({
  onPassed,
}: {
  onPassed: (nextLevel?: number) => void;
}): JSX.Element {
  const [step, setStep] = useState<Step>(1);
  const [stubContent, setStubContent] = useState("<?php __HALT_COMPILER(); ?>");
  const [md5, setMd5] = useState("");
  const [filename, setFilename] = useState("shell.php");
  const [signature, setSignature] = useState("");
  const [triggerPath, setTriggerPath] = useState("phar://gate.phar/test.txt");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runStub = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await gateClient.l2Stub({ content: stubContent });
      setMd5(result.md5);
      setFilename(result.suggestedFilename);
      setSignature(result.md5);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stub failed");
    } finally {
      setLoading(false);
    }
  };

  const runManifest = async () => {
    setLoading(true);
    setError(null);
    try {
      await gateClient.l2Manifest({ filename, signature });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Manifest failed");
    } finally {
      setLoading(false);
    }
  };

  const runTrigger = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await gateClient.l2Trigger({ filename: triggerPath });
      setToken(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trigger failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <pre className="overflow-x-auto rounded border border-neutral-800 bg-black/60 p-3 font-mono text-xs text-neutral-400">
        {`// Executor.php (pseudocode)
if (md5_file($_FILES['file']['tmp_name']) === $expected) {
    include("phar://" . $_FILES['file']['name'] . "/test.txt");
}`}
      </pre>

      {step >= 1 && (
        <div className="rounded border border-neutral-800 p-4">
          <h3 className="mb-2 font-mono text-xs text-amber-400">
            Step 1 — Upload stub
          </h3>
          <textarea
            value={stubContent}
            onChange={(e) => setStubContent(e.target.value)}
            rows={4}
            className="w-full rounded border border-neutral-700 bg-neutral-950 p-2 font-mono text-xs text-green-400"
          />
          <button
            type="button"
            onClick={runStub}
            disabled={loading}
            className="mt-2 rounded border border-green-400/40 px-3 py-1 font-mono text-xs text-green-400"
          >
            Compute MD5
          </button>
          {md5 && (
            <p className="mt-2 font-mono text-xs text-neutral-400">
              md5: {md5}
            </p>
          )}
        </div>
      )}

      {step >= 2 && (
        <div className="rounded border border-neutral-800 p-4">
          <h3 className="mb-2 font-mono text-xs text-amber-400">
            Step 2 — Register manifest
          </h3>
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="mb-2 w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 font-mono text-xs"
            placeholder="filename"
          />
          <input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 font-mono text-xs"
            placeholder="signature (md5)"
          />
          <button
            type="button"
            onClick={runManifest}
            disabled={loading}
            className="mt-2 rounded border border-green-400/40 px-3 py-1 font-mono text-xs text-green-400"
          >
            Store manifest
          </button>
        </div>
      )}

      {step >= 3 && (
        <div className="rounded border border-neutral-800 p-4">
          <h3 className="mb-2 font-mono text-xs text-amber-400">
            Step 3 — Trigger phar://
          </h3>
          <input
            value={triggerPath}
            onChange={(e) => setTriggerPath(e.target.value)}
            className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 font-mono text-xs"
          />
          <button
            type="button"
            onClick={runTrigger}
            disabled={loading}
            className="mt-2 rounded border border-green-400/40 px-3 py-1 font-mono text-xs text-green-400"
          >
            Trigger
          </button>
          {token && (
            <p className="mt-2 font-mono text-xs text-green-400">
              Token: {token}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="font-mono text-xs text-red-400">{error}</p>
      )}

      {token && (
        <GateLevel
          level={2}
          onPassed={onPassed}
        />
      )}
    </div>
  );
}
