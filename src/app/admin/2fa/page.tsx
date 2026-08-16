"use client";

import { JSX, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ShieldAlert, KeyRound, Copy, CheckCircle2, ArrowLeft } from "lucide-react";
import {
  disableTwoFactor,
  getTwoFactorStatus,
  setupTwoFactor,
  verifyTwoFactor,
  type SetupTwoFAResponse,
} from "@/lib/services/twofa-service";

type Stage =
  | { kind: "loading" }
  | { kind: "disabled" }
  | {
      kind: "setup";
      data: SetupTwoFAResponse;
      code: string;
      acknowledgedCodes: boolean;
    }
  | { kind: "enabled"; backupRemaining: number };

export default function AdminTwoFactorPage(): JSX.Element {

  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableUseBackup, setDisableUseBackup] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await getTwoFactorStatus();
      setStage(
        s.enabled
          ? { kind: "enabled", backupRemaining: s.backupCodesRemaining }
          : { kind: "disabled" },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load 2FA status");
      setStage({ kind: "disabled" });
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleStartSetup = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await setupTwoFactor();
      setStage({
        kind: "setup",
        data,
        code: "",
        acknowledgedCodes: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start 2FA setup";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifySetup = async (code: string) => {
    setBusy(true);
    setError(null);
    try {
      await verifyTwoFactor(code);
      toast.success("Two-factor authentication enabled successfully");
      await refreshStatus();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setError(null);
    try {
      await disableTwoFactor(disablePassword, disableCode, disableUseBackup);
      toast.success("Two-factor authentication disabled");
      setDisablePassword("");
      setDisableCode("");
      setDisableUseBackup(false);
      await refreshStatus();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to disable 2FA";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Clipboard permission unavailable");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-mono text-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-(--terminal-border)">
        <div>
          <h1 className="text-xl font-bold text-(--terminal-accent) flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Two-Factor Authentication
          </h1>
          <p className="text-xs text-(--terminal-muted) mt-1">
            Enforce secondary TOTP verification for all administrator sign-ins.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="h-8 gap-2">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-xs">
          {error}
        </div>
      )}

      {stage.kind === "loading" && (
        <div className="p-8 text-center text-xs text-(--terminal-muted)">
          Loading 2FA status...
        </div>
      )}

      {stage.kind === "disabled" && (
        <div className="p-6 rounded-lg border border-(--terminal-border) bg-(--terminal-bg) space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-amber-400" />
              <div>
                <h3 className="font-semibold text-base">2FA Status: Disabled</h3>
                <p className="text-xs text-(--terminal-muted)">
                  Your admin account relies only on a single password for authentication.
                </p>
              </div>
            </div>
            <Badge variant="warning">DISABLED</Badge>
          </div>

          <div className="pt-2">
            <Button
              variant="terminal"
              onClick={handleStartSetup}
              disabled={busy}
            >
              {busy ? "Generating QR Key..." : "Start 2FA Setup"}
            </Button>
          </div>
        </div>
      )}

      {stage.kind === "setup" && (
        <SetupPanel
          stage={stage}
          busy={busy}
          onChangeCode={(code) => setStage({ ...stage, code })}
          onAcknowledgeCodes={() => setStage({ ...stage, acknowledgedCodes: true })}
          onCopy={copyToClipboard}
          onVerify={handleVerifySetup}
          onCancel={() => setStage({ kind: "disabled" })}
        />
      )}

      {stage.kind === "enabled" && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-emerald-500/40 bg-emerald-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-base text-emerald-400">2FA Active & Protected</h3>
                  <p className="text-xs text-(--terminal-muted)">
                    {stage.backupRemaining} single-use backup code{stage.backupRemaining === 1 ? "" : "s"} remaining.
                  </p>
                </div>
              </div>
              <Badge variant="success">ENABLED</Badge>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-(--terminal-border) bg-(--terminal-bg) space-y-4">
            <h3 className="text-base font-semibold text-red-400 flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Disable 2FA Protection
            </h3>
            <p className="text-xs text-(--terminal-muted)">
              Disabling 2FA removes the TOTP requirement. You must confirm your password and a valid code.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDisable();
              }}
              className="space-y-4 max-w-md pt-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="disable-pass">Current Password</Label>
                <Input
                  id="disable-pass"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="disable-code">
                  {disableUseBackup ? "Backup Code (8 chars)" : "TOTP Code (6 digits)"}
                </Label>
                <Input
                  id="disable-code"
                  type="text"
                  value={disableCode}
                  onChange={(e) => {
                    const v = disableUseBackup
                      ? e.target.value.trim()
                      : e.target.value.replace(/\D/g, "").slice(0, 6);
                    setDisableCode(v);
                  }}
                  placeholder={disableUseBackup ? "a1b2c3d4" : "123456"}
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setDisableUseBackup(!disableUseBackup);
                  setDisableCode("");
                }}
                className="text-xs text-(--terminal-accent) underline hover:no-underline"
              >
                {disableUseBackup ? "Use 6-digit TOTP code" : "Use a backup code instead"}
              </button>

              <div>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={busy || !disablePassword.trim() || !disableCode.trim()}
                >
                  {busy ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface SetupPanelProps {
  stage: Extract<Stage, { kind: "setup" }>;
  busy: boolean;
  onChangeCode: (code: string) => void;
  onAcknowledgeCodes: () => void;
  onCopy: (text: string, label: string) => void;
  onVerify: (code: string) => void;
  onCancel: () => void;
}

function SetupPanel({
  stage,
  busy,
  onChangeCode,
  onAcknowledgeCodes,
  onCopy,
  onVerify,
  onCancel,
}: SetupPanelProps) {
  const { data, code, acknowledgedCodes } = stage;

  return (
    <div className="space-y-6">
      {/* Step 1 */}
      <div className="p-6 rounded-lg border border-(--terminal-border) bg-(--terminal-bg) space-y-4">
        <h3 className="text-base font-semibold text-(--terminal-accent)">
          Step 1 — Scan QR Code with Authenticator App
        </h3>
        <p className="text-xs text-(--terminal-muted)">
          Use Google Authenticator, 1Password, Authy, or any TOTP authenticator app.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start pt-2">
          <div className="p-3 bg-white rounded-lg border border-(--terminal-border) shrink-0">
            <QRCodeSVG value={data.otpauthUri} size={160} level="M" />
          </div>

          <div className="space-y-3 flex-1 text-xs">
            <div>
              <span className="text-(--terminal-muted) block mb-1">Secret Key (Manual Entry):</span>
              <code className="px-2 py-1 bg-(--terminal-accent)/10 border border-(--terminal-accent)/30 rounded font-mono text-xs text-(--terminal-accent) break-all">
                {data.secret}
              </code>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => onCopy(data.secret, "Secret Key")} className="gap-1 text-xs">
                <Copy className="h-3 w-3" /> Copy Secret
              </Button>
              <Button variant="outline" size="sm" onClick={() => onCopy(data.otpauthUri, "otpauth URI")} className="gap-1 text-xs">
                <Copy className="h-3 w-3" /> Copy URI
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="p-6 rounded-lg border border-amber-500/40 bg-amber-500/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-amber-400">
            Step 2 — Backup Recovery Codes
          </h3>
          <Badge variant="warning">IMPORTANT</Badge>
        </div>
        <p className="text-xs text-(--terminal-muted)">
          Save these single-use codes in a password manager. If you lose your TOTP app, you need a backup code to log in.
        </p>

        <div className="grid grid-cols-2 gap-2 font-mono text-xs p-4 rounded-md bg-(--terminal-bg) border border-amber-500/30">
          {data.backupCodes.map((c) => (
            <code key={c} className="select-all text-amber-300">
              {c}
            </code>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => onCopy(data.backupCodes.join("\n"), "Backup codes")} className="gap-1 text-xs">
            <Copy className="h-3 w-3" /> Copy All Codes
          </Button>
          <Button
            variant={acknowledgedCodes ? "outline" : "default"}
            size="sm"
            onClick={onAcknowledgeCodes}
            disabled={acknowledgedCodes}
            className="text-xs"
          >
            {acknowledgedCodes ? "✓ Backup Codes Saved" : "I Have Saved These Codes"}
          </Button>
        </div>
      </div>

      {/* Step 3 */}
      <div className="p-6 rounded-lg border border-(--terminal-border) bg-(--terminal-bg) space-y-4">
        <h3 className="text-base font-semibold text-(--terminal-accent)">
          Step 3 — Verify TOTP Code & Enable
        </h3>
        <div className="max-w-xs space-y-2">
          <Label htmlFor="setup-totp-code">Enter 6-digit Code</Label>
          <Input
            id="setup-totp-code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => onChangeCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="tracking-widest font-bold"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="terminal"
            onClick={() => onVerify(code)}
            disabled={busy || code.length !== 6 || !acknowledgedCodes}
          >
            {busy ? "Verifying..." : "Verify & Enable 2FA"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        </div>

        {!acknowledgedCodes && (
          <p className="text-xs text-amber-400 font-semibold">
            ⚠️ You must click "I Have Saved These Codes" in Step 2 before enabling.
          </p>
        )}
      </div>
    </div>
  );
}
