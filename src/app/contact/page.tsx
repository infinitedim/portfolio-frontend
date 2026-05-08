"use client";

import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type JSX,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { TerminalHeader } from "@/components/molecules/admin/terminal-header";
import { useTheme } from "@/hooks/use-theme";
import {
  submitContactMessage,
  type ContactSubmission,
} from "@/lib/services/contact-service";

const MIN_MESSAGE_LEN = 10;
const MAX_MESSAGE_LEN = 5000;

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot — kept in component state so we can submit it as-is. */
  website: string;
}

const EMPTY: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

function isPlausibleEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  // Mirror the backend check: exactly one `@`, non-empty local + domain,
  // and a dot somewhere in the domain. Server-side is authoritative.
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (!domain.includes(".")) return false;
  if (/[\s<>,]/.test(trimmed)) return false;
  return true;
}

function validate(form: FormState): string | null {
  if (!form.name.trim()) return "Name is required";
  if (form.name.length > 100) return "Name is too long";
  if (!isPlausibleEmail(form.email)) return "Please enter a valid email";
  if (form.subject.length > 200) return "Subject is too long";
  if (form.message.trim().length < MIN_MESSAGE_LEN) {
    return `Message must be at least ${MIN_MESSAGE_LEN} characters`;
  }
  if (form.message.length > MAX_MESSAGE_LEN) {
    return `Message must be at most ${MAX_MESSAGE_LEN} characters`;
  }
  return null;
}

export default function ContactPage(): JSX.Element {
  const { themeConfig } = useTheme();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const error = validate(form);
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    const submission: ContactSubmission = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      subject: form.subject.trim() || undefined,
      message: form.message.trim(),
      website: form.website,
    };

    const result = await submitContactMessage(submission);
    setSubmitting(false);

    if (result.ok) {
      setSubmitted(true);
      setForm(EMPTY);
      toast.success("Message sent. I'll get back to you soon.");
    } else if (result.status === 429) {
      toast.error("Too many requests. Please slow down and try again later.");
    } else if (result.status >= 400 && result.status < 500) {
      toast.error(result.error);
    } else {
      toast.error("Server error. Please try again in a moment.");
    }
  };

  const charsRemaining = MAX_MESSAGE_LEN - form.message.length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: themeConfig.colors.bg,
        color: themeConfig.colors.text,
      }}
    >
      <TerminalHeader />

      <main className="flex-1 flex items-start justify-center p-4 py-10">
        <div
          className="w-full max-w-2xl"
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
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: themeConfig.colors.error }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: themeConfig.colors.warning }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: themeConfig.colors.success }}
                />
              </div>
              <span
                className="text-xs ml-3 font-mono"
                style={{ color: themeConfig.colors.muted }}
              >
                contact@portfolio:~$
              </span>
            </div>
            <Link
              href="/"
              className="text-xs font-mono hover:underline"
              style={{ color: themeConfig.colors.accent }}
            >
              back
            </Link>
          </div>

          <div className="p-6 font-mono text-sm">
            <header className="mb-6">
              <h1
                className="text-2xl font-bold mb-2"
                style={{ color: themeConfig.colors.accent }}
              >
                Get in touch
              </h1>
              <p style={{ color: themeConfig.colors.muted }}>
                Send a message and I will reply via email. All fields except
                subject are required.
              </p>
            </header>

            {submitted ? (
              <div
                className="p-4 rounded border"
                style={{
                  borderColor: themeConfig.colors.success,
                  color: themeConfig.colors.success,
                }}
              >
                <p className="font-semibold mb-2">Message sent.</p>
                <p style={{ color: themeConfig.colors.text }}>
                  Thanks for reaching out — I review every message and reply
                  within a few days.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs underline"
                  style={{ color: themeConfig.colors.accent }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                noValidate
              >
                <Field
                  label="name"
                  required
                >
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    maxLength={100}
                    autoComplete="name"
                    className="w-full bg-transparent outline-none font-mono"
                    style={{
                      color: themeConfig.colors.text,
                      borderBottom: `1px solid ${themeConfig.colors.border}`,
                      padding: "4px 0",
                    }}
                    disabled={submitting}
                  />
                </Field>

                <Field
                  label="email"
                  required
                >
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    maxLength={254}
                    autoComplete="email"
                    className="w-full bg-transparent outline-none font-mono"
                    style={{
                      color: themeConfig.colors.text,
                      borderBottom: `1px solid ${themeConfig.colors.border}`,
                      padding: "4px 0",
                    }}
                    disabled={submitting}
                  />
                </Field>

                <Field label="subject">
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => update("subject", e.target.value)}
                    maxLength={200}
                    className="w-full bg-transparent outline-none font-mono"
                    style={{
                      color: themeConfig.colors.text,
                      borderBottom: `1px solid ${themeConfig.colors.border}`,
                      padding: "4px 0",
                    }}
                    disabled={submitting}
                  />
                </Field>

                <Field
                  label="message"
                  required
                >
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    maxLength={MAX_MESSAGE_LEN}
                    rows={8}
                    className="w-full bg-transparent outline-none font-mono resize-y"
                    style={{
                      color: themeConfig.colors.text,
                      border: `1px solid ${themeConfig.colors.border}`,
                      borderRadius: "4px",
                      padding: "8px",
                    }}
                    disabled={submitting}
                  />
                  <div
                    className="text-xs text-right mt-1"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    {charsRemaining} chars left
                  </div>
                </Field>

                {/*
                  Honeypot. Hidden from users, but bots that fill every
                  visible-looking field will trip it. Tab-index removed
                  and aria-hidden so assistive tech ignores it.
                */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-10000px",
                    top: "auto",
                    width: "1px",
                    height: "1px",
                    overflow: "hidden",
                  }}
                >
                  <label>
                    Leave this field empty
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => update("website", e.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full font-mono py-2 rounded transition-colors"
                  style={{
                    backgroundColor: submitting
                      ? themeConfig.colors.border
                      : themeConfig.colors.accent,
                    color: themeConfig.colors.bg,
                    cursor: submitting ? "wait" : "pointer",
                  }}
                >
                  {submitting ? "$ sending..." : "$ send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const { themeConfig } = useTheme();
  return (
    <label className="block">
      <span
        className="block text-xs mb-1 font-mono"
        style={{ color: themeConfig.colors.muted }}
      >
        --{label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
