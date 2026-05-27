"use client";

import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type JSX,
} from "react";
import { toast } from "sonner";
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

export function ContactForm(): JSX.Element {
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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-green-400">
          Get in touch
        </h1>
        <p className="mt-2 font-mono text-sm text-neutral-400">
          Send a message and I will reply via email. All fields except subject
          are required.
        </p>
      </header>

      {submitted ? (
        <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-6 font-mono text-sm text-green-400">
          <p className="font-semibold">Message sent.</p>
          <p className="mt-2 text-neutral-300">
            Thanks for reaching out — I review every message and reply within a
            few days.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-4 text-xs text-green-400 underline"
          >
            Send another
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 font-mono text-sm"
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
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-green-400/50"
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
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-green-400/50"
              disabled={submitting}
            />
          </Field>

          <Field label="subject">
            <input
              type="text"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              maxLength={200}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-green-400/50"
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
              className="w-full resize-y rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-green-400/50"
              disabled={submitting}
            />
            <div className="mt-1 text-right text-xs text-neutral-500">
              {charsRemaining} chars left
            </div>
          </Field>

          <div
            aria-hidden="true"
            className="absolute h-px w-px overflow-hidden"
            style={{ left: "-10000px" }}
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
            className="w-full rounded border border-green-400/40 bg-green-400/10 py-2.5 text-green-400 transition-colors hover:bg-green-400/20 disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send message"}
          </button>
        </form>
      )}
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
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-neutral-500">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
