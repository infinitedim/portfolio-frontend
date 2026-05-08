"use client";

import { JSX, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/molecules/admin/protected-route";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { useTheme } from "@/hooks/use-theme";
import {
  disableTwoFactor,
  getTwoFactorStatus,
  setupTwoFactor,
  verifyTwoFactor,
  type SetupTwoFAResponse,
} from "@/lib/services/twofa-service";

type Stage =
  | { kind: "loading" }
  | { kind: "disabled" } // 2FA off, ready to start setup
  | {
      kind: "setup";
      data: SetupTwoFAResponse;
      code: string;
      acknowledgedCodes: boolean;
    } // setup in progress
  | { kind: "enabled"; backupRemaining: number };

export default function AdminTwoFactorPage(): JSX.Element {
  const { themeConfig } = useTheme();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Disable form
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
      toast.success("Two-factor authentication enabled");
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
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: themeConfig.colors.bg,
          color: themeConfig.colors.text,
        }}
      >
        <TerminalHeader />

        <div className="flex-1 p-6">
          <div
            className="max-w-3xl mx-auto"
            style={{
              backgroundColor: themeConfig.colors.bg,
              border: `1px solid ${themeConfig.colors.border}`,
              borderRadius: "8px",
              boxShadow: `0 4px 20px ${themeConfig.colors.border}20`,
            }}
          >
            <div
              className="flex items-center justify-between p-3 border-b"
              style={{ borderColor: themeConfig.colors.border }}
            >
              <span
                className="text-sm font-mono"
                style={{ color: themeConfig.colors.muted }}
              >
                admin@portfolio:~$ 2fa
              </span>
              <button
                onClick={() => router.push("/admin")}
                className="px-3 py-1 text-xs font-mono rounded"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}20`,
                  color: themeConfig.colors.accent,
                  border: `1px solid ${themeConfig.colors.accent}`,
                }}
              >
                ← Back to dashboard
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h1
                  className="text-xl font-bold mb-1"
                  style={{ color: themeConfig.colors.accent }}
                >
                  🔐 Two-Factor Authentication
                </h1>
                <p
                  className="text-sm"
                  style={{ color: themeConfig.colors.muted }}
                >
                  Add a second factor (TOTP) to admin sign-in. After
                  enrollment, every login asks for a 6-digit code from your
                  authenticator app.
                </p>
              </div>

              {error && (
                <div
                  className="p-3 rounded border text-sm font-mono"
                  style={{
                    backgroundColor: `${themeConfig.colors.error}10`,
                    borderColor: themeConfig.colors.error,
                    color: themeConfig.colors.error,
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              {stage.kind === "loading" && (
                <div
                  className="text-sm font-mono"
                  style={{ color: themeConfig.colors.muted }}
                >
                  Loading current 2FA status…
                </div>
              )}

              {stage.kind === "disabled" && (
                <div
                  className="p-4 rounded border space-y-3"
                  style={{ borderColor: themeConfig.colors.border }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded text-xs font-mono"
                      style={{
                        backgroundColor: `${themeConfig.colors.warning}20`,
                        color: themeConfig.colors.warning,
                      }}
                    >
                      DISABLED
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      2FA is currently off for your account.
                    </span>
                  </div>
                  <button
                    onClick={handleStartSetup}
                    disabled={busy}
                    className="px-4 py-2 font-mono text-sm rounded disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: `${themeConfig.colors.accent}20`,
                      color: themeConfig.colors.accent,
                      border: `1px solid ${themeConfig.colors.accent}`,
                    }}
                  >
                    {busy ? "⏳ Generating…" : "🚀 Start setup"}
                  </button>
                </div>
              )}

              {stage.kind === "setup" && (
                <SetupPanel
                  stage={stage}
                  busy={busy}
                  themeConfig={themeConfig}
                  onChangeCode={(code) => setStage({ ...stage, code })}
                  onAcknowledgeCodes={() =>
                    setStage({ ...stage, acknowledgedCodes: true })
                  }
                  onCopy={copyToClipboard}
                  onVerify={handleVerifySetup}
                  onCancel={() => setStage({ kind: "disabled" })}
                />
              )}

              {stage.kind === "enabled" && (
                <div className="space-y-4">
                  <div
                    className="p-4 rounded border"
                    style={{ borderColor: themeConfig.colors.border }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-mono"
                        style={{
                          backgroundColor: `${themeConfig.colors.success}20`,
                          color: themeConfig.colors.success,
                        }}
                      >
                        ENABLED
                      </span>
                      <span
                        className="text-sm"
                        style={{ color: themeConfig.colors.muted }}
                      >
                        {stage.backupRemaining} backup code
                        {stage.backupRemaining === 1 ? "" : "s"} remaining
                      </span>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      Future logins will require a 6-digit TOTP code after
                      your password.
                    </p>
                  </div>

                  <div
                    className="p-4 rounded border space-y-3"
                    style={{ borderColor: themeConfig.colors.border }}
                  >
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: themeConfig.colors.accent }}
                    >
                      Disable 2FA
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      Confirm with your password and a current TOTP/backup
                      code to turn 2FA off and wipe enrollment data.
                    </p>

                    <input
                      type="password"
                      placeholder="Current password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full bg-transparent border rounded px-3 py-2 font-mono text-sm outline-none"
                      style={{
                        borderColor: themeConfig.colors.border,
                        color: themeConfig.colors.text,
                      }}
                    />

                    <input
                      type="text"
                      inputMode={disableUseBackup ? "text" : "numeric"}
                      placeholder={
                        disableUseBackup ? "Backup code" : "6-digit code"
                      }
                      value={disableCode}
                      onChange={(e) => {
                        const v = disableUseBackup
                          ? e.target.value.trim()
                          : e.target.value.replace(/\D/g, "").slice(0, 6);
                        setDisableCode(v);
                      }}
                      className="w-full bg-transparent border rounded px-3 py-2 font-mono text-sm outline-none tracking-widest"
                      style={{
                        borderColor: themeConfig.colors.border,
                        color: themeConfig.colors.text,
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setDisableUseBackup((v) => !v);
                        setDisableCode("");
                      }}
                      className="text-xs underline"
                      style={{ color: themeConfig.colors.accent }}
                    >
                      {disableUseBackup
                        ? "Use 6-digit authenticator code"
                        : "Use a backup code instead"}
                    </button>

                    <button
                      onClick={handleDisable}
                      disabled={
                        busy ||
                        !disablePassword.trim() ||
                        !disableCode.trim()
                      }
                      className="px-4 py-2 font-mono text-sm rounded disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: `${themeConfig.colors.error}20`,
                        color: themeConfig.colors.error,
                        border: `1px solid ${themeConfig.colors.error}`,
                      }}
                    >
                      {busy ? "⏳ Disabling…" : "Disable 2FA"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface SetupPanelProps {
  stage: Extract<Stage, { kind: "setup" }>;
  busy: boolean;
  themeConfig: ReturnType<typeof useTheme>["themeConfig"];
  onChangeCode: (code: string) => void;
  onAcknowledgeCodes: () => void;
  onCopy: (text: string, label: string) => void;
  onVerify: (code: string) => void;
  onCancel: () => void;
}

function SetupPanel({
  stage,
  busy,
  themeConfig,
  onChangeCode,
  onAcknowledgeCodes,
  onCopy,
  onVerify,
  onCancel,
}: SetupPanelProps) {
  const { data, code, acknowledgedCodes } = stage;

  return (
    <div className="space-y-6">
      <div
        className="p-4 rounded border space-y-4"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: themeConfig.colors.accent }}
        >
          Step 1 — Scan the QR with your authenticator app
        </h3>
        <p
          className="text-xs"
          style={{ color: themeConfig.colors.muted }}
        >
          Use Google Authenticator, 1Password, Authy, or any RFC-6238 TOTP
          app. If you can't scan, use the manual key below.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div
            className="p-3 rounded bg-white"
            style={{ border: `1px solid ${themeConfig.colors.border}` }}
          >
            <QRCodeSVG
              value={data.otpauthUri}
              size={176}
              level="M"
              includeMargin={false}
            />
          </div>

          <div className="flex-1 space-y-2 w-full">
            <div className="text-xs font-mono">
              <span style={{ color: themeConfig.colors.muted }}>
                Manual key:{" "}
              </span>
              <span
                className="break-all"
                style={{ color: themeConfig.colors.text }}
              >
                {data.secret}
              </span>
            </div>
            <button
              onClick={() => onCopy(data.secret, "Secret")}
              className="text-xs underline"
              style={{ color: themeConfig.colors.accent }}
            >
              Copy secret
            </button>
            <div>
              <button
                onClick={() => onCopy(data.otpauthUri, "otpauth URI")}
                className="text-xs underline"
                style={{ color: themeConfig.colors.accent }}
              >
                Copy otpauth URI
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="p-4 rounded border space-y-3"
        style={{
          borderColor: themeConfig.colors.warning,
          backgroundColor: `${themeConfig.colors.warning}08`,
        }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: themeConfig.colors.warning }}
        >
          Step 2 — Save your backup codes
        </h3>
        <p
          className="text-xs"
          style={{ color: themeConfig.colors.muted }}
        >
          Each code can be used once if you lose access to your authenticator.
          They will not be shown again.
        </p>
        <div
          className="grid grid-cols-2 gap-2 font-mono text-xs p-3 rounded"
          style={{
            backgroundColor: `${themeConfig.colors.bg}`,
            border: `1px dashed ${themeConfig.colors.warning}`,
          }}
        >
          {data.backupCodes.map((c) => (
            <code
              key={c}
              className="select-all"
              style={{ color: themeConfig.colors.text }}
            >
              {c}
            </code>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              onCopy(data.backupCodes.join("\n"), "Backup codes")
            }
            className="text-xs underline"
            style={{ color: themeConfig.colors.accent }}
          >
            Copy all
          </button>
          <button
            onClick={onAcknowledgeCodes}
            disabled={acknowledgedCodes}
            className="text-xs underline disabled:opacity-50"
            style={{ color: themeConfig.colors.success }}
          >
            {acknowledgedCodes ? "✓ Saved" : "I have saved them"}
          </button>
        </div>
      </div>

      <div
        className="p-4 rounded border space-y-3"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: themeConfig.colors.accent }}
        >
          Step 3 — Enter the current 6-digit code to enable 2FA
        </h3>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) =>
            onChangeCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="123456"
          className="w-full bg-transparent border rounded px-3 py-2 font-mono text-sm outline-none tracking-widest"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.text,
          }}
        />
        <div className="flex gap-3">
          <button
            onClick={() => onVerify(code)}
            disabled={busy || code.length !== 6 || !acknowledgedCodes}
            className="flex-1 px-4 py-2 font-mono text-sm rounded disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: `${themeConfig.colors.accent}20`,
              color: themeConfig.colors.accent,
              border: `1px solid ${themeConfig.colors.accent}`,
            }}
          >
            {busy ? "⏳ Verifying…" : "🚀 Verify and enable"}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 font-mono text-xs"
            style={{
              color: themeConfig.colors.muted,
              border: `1px solid ${themeConfig.colors.border}`,
            }}
          >
            Cancel
          </button>
        </div>
        {!acknowledgedCodes && (
          <p
            className="text-xs"
            style={{ color: themeConfig.colors.warning }}
          >
            Confirm you have saved the backup codes before enabling.
          </p>
        )}
      </div>
    </div>
  );
}
