"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type SubmitEvent,
  type JSX,
  type KeyboardEvent,
} from "react";
import { toast } from "sonner";
import { Mail, ExternalLink, Clock } from "lucide-react";
import {
  submitContactMessage,
  type ContactSubmission,
} from "@/lib/services/contact-service";
import {
  isPlausibleName,
  isPlausibleEmail,
  isPlausibleSubject,
  isPlausibleMessage,
  containsProfanity,
} from "@/lib/validation/contact-validation";
import { useI18n } from "@/hooks/use-i18n";
import type { TranslationKeys } from "@/lib/i18n";

import { PageHeader } from "@/components/atoms/shared/page-header";

const MIN_MESSAGE_LEN = 10;
const MAX_MESSAGE_LEN = 5000;
const DRAFT_KEY = "contact_form_draft";

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

function validateForm(
  form: FormState,
  t: (key: keyof TranslationKeys) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) {
    errors.name = t("contactValidationNameRequired");
  } else if (!isPlausibleName(form.name)) {
    errors.name = containsProfanity(form.name)
      ? "Please refrain from using inappropriate language"
      : "Please enter a valid human name";
  }

  if (!isPlausibleEmail(form.email)) {
    errors.email = containsProfanity(form.email)
      ? "Please refrain from using inappropriate language"
      : t("contactValidationEmailInvalid");
  }

  if (form.subject.trim().length > 0 && !isPlausibleSubject(form.subject)) {
    errors.subject = containsProfanity(form.subject)
      ? "Please refrain from using inappropriate language"
      : t("contactValidationSubjectTooLong");
  }

  if (form.message.trim().length < MIN_MESSAGE_LEN) {
    errors.message = t("contactValidationMessageMin").replace(
      "{min}",
      String(MIN_MESSAGE_LEN),
    );
  } else if (!isPlausibleMessage(form.message)) {
    errors.message = containsProfanity(form.message)
      ? "Please refrain from using inappropriate language"
      : t("contactValidationMessageMax").replace(
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
  const [draftRestored, setDraftRestored] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Restore LocalStorage draft on initial mount
  useEffect(() => {
    nameInputRef.current?.focus();
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormState>;
        if (parsed.name || parsed.email || parsed.subject || parsed.message) {
          setForm((prev) => ({ ...prev, ...parsed }));
          setDraftRestored(true);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save draft to LocalStorage when user changes form values
  useEffect(() => {
    if (submitted) return;
    try {
      if (form.name || form.email || form.subject || form.message) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      }
    } catch {
      // Ignore storage errors
    }
  }, [form, submitted]);

  const clearDraft = useCallback(() => {
    setForm(EMPTY);
    setErrors({});
    setDraftRestored(false);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore storage errors
    }
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

  // Keyboard Shortcut: Ctrl+Enter or Cmd+Enter to submit form
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      const formEl = (e.currentTarget as HTMLElement).closest("form");
      if (formEl) {
        formEl.requestSubmit();
      }
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
      setDraftRestored(false);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Ignore
      }
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
  const progressPercent = Math.min(
    100,
    (form.message.length / MAX_MESSAGE_LEN) * 100,
  );

  // Field validation checkmark statuses
  const isNameValid = isPlausibleName(form.name);
  const isEmailValid = isPlausibleEmail(form.email);
  const isSubjectValid =
    form.subject.trim().length > 0 && isPlausibleSubject(form.subject);
  const isMessageValid = isPlausibleMessage(form.message);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="contact"
        description={t("contactDesc")}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 lg:gap-12">
        {/* Left Column */}
        <div className="space-y-6">
          <h2 className="mb-5 font-mono text-xl font-bold text-white">
            <span className="text-emerald-400">$</span> contact --info
          </h2>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 font-mono text-sm text-neutral-400">
            <div className="mb-6 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400"></span>
              </span>
              <span>Currently open for freelance & collaboration</span>
            </div>
            
            <div className="mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>&lt; 24 hours average response time</span>
            </div>
            
            <div className="mb-6 space-y-3">
              <a href="mailto:hello@dimassaputra.com" className="flex items-center gap-2 hover:text-white transition-colors duration-200">
                <Mail className="h-4 w-4" /> Email
              </a>
              <a href="https://github.com/dimassaputra" className="flex items-center gap-2 hover:text-white transition-colors duration-200">
                <ExternalLink className="h-4 w-4" /> GitHub
              </a>
              <a href="https://linkedin.com/in/dimassaputra" className="flex items-center gap-2 hover:text-white transition-colors duration-200">
                <ExternalLink className="h-4 w-4" /> LinkedIn
              </a>
            </div>
            
            <p className="leading-relaxed">
              I'm interested in full-stack projects, open source collaboration, and technical consulting.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <h2 className="mb-5 font-mono text-xl font-bold text-white">
            <span className="text-emerald-400">$</span> send --message
          </h2>

      {draftRestored && !submitted && (
        <div className="mb-6 max-w-2xl flex items-center justify-between rounded border border-emerald-400/40 bg-emerald-400/5 px-4 py-2.5 font-mono text-xs text-emerald-400">
          <span>[draft] Restored saved draft from local storage</span>
          <button
            type="button"
            onClick={clearDraft}
            className="underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Clear Draft
          </button>
        </div>
      )}

      {submitted ? (
        <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/5 p-6 font-mono text-sm text-emerald-400">
          <p className="font-semibold">{t("contactSendSuccess")}</p>
          <p className="mt-2 text-neutral-300">{t("contactSuccessDesc")}</p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-4 text-xs text-emerald-400 underline cursor-pointer"
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
            isValid={isNameValid}
            error={errors.name}
          >
            <input
              id="contact-name"
              ref={nameInputRef}
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={100}
              autoComplete="name"
              className={`w-full rounded border bg-neutral-900 px-3 py-2 text-neutral-100 outline-none transition-all focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 ${
                errors.name ? "focus:border-red-500" : "border-neutral-700"
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
            isValid={isEmailValid}
            error={errors.email}
          >
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={254}
              autoComplete="email"
              className={`w-full rounded border bg-neutral-900 px-3 py-2 text-neutral-100 outline-none transition-all focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 ${
                errors.email ? "focus:border-red-500" : "border-neutral-700"
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
            isValid={isSubjectValid}
            error={errors.subject}
          >
            <input
              id="contact-subject"
              type="text"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
              className={`w-full rounded border bg-neutral-900 px-3 py-2 text-neutral-100 outline-none transition-all focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 ${
                errors.subject ? "focus:border-red-500" : "border-neutral-700"
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
            isValid={isMessageValid}
            error={errors.message}
          >
            <textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_MESSAGE_LEN}
              rows={8}
              className={`w-full resize-y rounded border bg-neutral-900 px-3 py-2 text-neutral-100 outline-none transition-all focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 ${
                errors.message ? "focus:border-red-500" : "border-neutral-700"
              }`}
              disabled={submitting}
              aria-invalid={errors.message ? "true" : "false"}
              aria-describedby={
                errors.message ? "contact-message-error" : undefined
              }
            />

            {/* Visual Character Progress Bar & Shortcut Hint */}
            <div className="mt-2 space-y-1.5">
              <div className="h-1 w-full overflow-hidden rounded bg-neutral-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    form.message.length > 4500
                      ? "bg-red-500"
                      : form.message.length > 3500
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="opacity-75">
                  Tip: Press Ctrl + Enter (or ⌘ + Enter) to send
                </span>
                <span
                  className={
                    charsRemaining < 500 ? "text-amber-400 font-semibold" : ""
                  }
                >
                  {charsRemaining} {t("contactCharsLeft")}
                </span>
              </div>
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
            className="w-full rounded border border-emerald-400/40 bg-emerald-400/10 py-2.5 text-emerald-400 font-semibold transition-colors duration-200 hover:bg-emerald-400/20 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {submitting ? t("contactSending") : t("contactSend")}
          </button>
        </form>
      )}
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  isValid?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({
  id,
  label,
  required,
  isValid,
  error,
  children,
}: FieldProps): JSX.Element {
  return (
    <div className="block">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <label
          htmlFor={id}
          className="text-neutral-400"
        >
          {label}
          {required ? " *" : ""}
        </label>
        {isValid && (
          <span className="font-mono text-xs font-medium text-emerald-400 flex items-center gap-1">
            ✓ Valid
          </span>
        )}
      </div>
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
