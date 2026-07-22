"use client";

import { useState, useEffect, useRef, type SubmitEvent, type JSX } from "react";
import { toast } from "sonner";
import {
  submitContactMessage,
  type ContactSubmission,
} from "@/lib/services/contact-service";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKeys } from "@/lib/i18n";

import { PageHeader } from "@/components/atoms/shared/page-header";

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

function validateForm(
  form: FormState,
  t: (key: keyof TranslationKeys) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) {
    errors.name = t("contactValidationNameRequired");
  } else if (form.name.length > 100) {
    errors.name = t("contactValidationNameTooLong");
  }

  if (!isPlausibleEmail(form.email)) {
    errors.email = t("contactValidationEmailInvalid");
  }

  if (form.subject.length > 200) {
    errors.subject = t("contactValidationSubjectTooLong");
  }

  if (form.message.trim().length < MIN_MESSAGE_LEN) {
    errors.message = t("contactValidationMessageMin").replace(
      "{min}",
      String(MIN_MESSAGE_LEN),
    );
  } else if (form.message.length > MAX_MESSAGE_LEN) {
    errors.message = t("contactValidationMessageMax").replace(
      "{max}",
      String(MAX_MESSAGE_LEN),
    );
  }

  return errors;
}

export function ContactForm(): JSX.Element {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const validationErrors = validateForm(form, t);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);
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
      setErrors({});
      toast.success(t("contactSendSuccess"));
    } else if (result.status === 429) {
      toast.error(t("contactSendFailure"));
    } else if (result.status >= 400 && result.status < 500) {
      toast.error(result.error || t("contactSendFailure"));
    } else {
      toast.error(t("contactSendFailure"));
    }
  };

  const charsRemaining = MAX_MESSAGE_LEN - form.message.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="contact"
        description={t("contactDesc")}
      />

      {submitted ? (
        <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-6 font-mono text-sm text-green-400">
          <p className="font-semibold">{t("contactSendSuccess")}</p>
          <p className="mt-2 text-neutral-300">{t("contactSuccessDesc")}</p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-4 text-xs text-green-400 underline cursor-pointer"
          >
            {t("contactSendAnother")}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl space-y-5 font-mono text-sm"
          noValidate
        >
          <Field
            id="contact-name"
            label={t("contactName")}
            required
            error={errors.name}
          >
            <input
              id="contact-name"
              ref={nameInputRef}
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={100}
              autoComplete="name"
              className={`w-full rounded border bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-green-400/50 ${
                errors.name
                  ? "border-red-500/70 focus:border-red-500"
                  : "border-neutral-700"
              }`}
              disabled={submitting}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
            />
          </Field>

          <Field
            id="contact-email"
            label={t("contactEmail")}
            required
            error={errors.email}
          >
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              maxLength={254}
              autoComplete="email"
              className={`w-full rounded border bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-green-400/50 ${
                errors.email
                  ? "border-red-500/70 focus:border-red-500"
                  : "border-neutral-700"
              }`}
              disabled={submitting}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={
                errors.email ? "contact-email-error" : undefined
              }
            />
          </Field>

          <Field
            id="contact-subject"
            label={t("contactSubject")}
            error={errors.subject}
          >
            <input
              id="contact-subject"
              type="text"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              maxLength={200}
              className={`w-full rounded border bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-green-400/50 ${
                errors.subject
                  ? "border-red-500/70 focus:border-red-500"
                  : "border-neutral-700"
              }`}
              disabled={submitting}
              aria-invalid={errors.subject ? "true" : "false"}
              aria-describedby={
                errors.subject ? "contact-subject-error" : undefined
              }
            />
          </Field>

          <Field
            id="contact-message"
            label={t("contactMessage")}
            required
            error={errors.message}
          >
            <textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              maxLength={MAX_MESSAGE_LEN}
              rows={8}
              className={`w-full resize-y rounded border bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-green-400/50 ${
                errors.message
                  ? "border-red-500/70 focus:border-red-500"
                  : "border-neutral-700"
              }`}
              disabled={submitting}
              aria-invalid={errors.message ? "true" : "false"}
              aria-describedby={
                errors.message ? "contact-message-error" : undefined
              }
            />
            <div className="mt-1 text-right text-xs text-neutral-400">
              {charsRemaining} {t("contactCharsLeft")}
            </div>
          </Field>

          <div
            aria-hidden="true"
            className="absolute h-px w-px overflow-hidden"
            style={{ left: "-10000px" }}
          >
            <label>
              {t("contactSpamLabel")}
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
            className="w-full rounded border border-green-400/40 bg-green-400/10 py-2.5 text-green-400 transition-colors hover:bg-green-400/20 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? t("contactSending") : t("contactSend")}
          </button>
        </form>
      )}
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: FieldProps): JSX.Element {
  return (
    <div className="block">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs text-neutral-400"
      >
        {label}
        {required ? " *" : ""}
      </label>
      {children}
      {error && (
        <span
          id={`${id}-error`}
          className="mt-1.5 block text-xs text-red-400 font-mono"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}
