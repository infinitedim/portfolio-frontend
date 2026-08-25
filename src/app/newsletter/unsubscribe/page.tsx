"use client";

import { Suspense, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { unsubscribeNewsletter } from "@/lib/services/newsletter-service";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";

/**
 * Internal client component that manages newsletter subscription revocation.
 *
 * @description
 * Reads an optional `token` query parameter from the URL to prepopulate the unsubscribe form.
 * Provides an interactive input field and submission handler to revoke email subscriptions
 * via {@link unsubscribeNewsletter}, displaying real-time status feedback and toast notifications.
 *
 * @returns {JSX.Element} The rendered newsletter unsubscription interface.
 */
function UnsubscribeContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  /**
   * Submits the cancellation request using the provided newsletter token.
   *
   * @param {SubmitEvent} e - The HTML form submission event.
   * @returns {Promise<void>} Resolves when the unsubscription request completes.
   */
  const handleUnsubscribe = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    try {
      const result = await unsubscribeNewsletter(token.trim());
      setMessage(result.message);
      setDone(true);
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unsubscribe failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center font-mono">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs mb-4">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>broadcast.status :: REVOKING</span>
        </div>

        <h1 className="mb-4 text-xl font-bold text-white tracking-tight">
          $ newsletter --revoke-subscription
        </h1>

        {done ? (
          <div className="space-y-4">
            <p className="text-emerald-400 text-xs sm:text-sm bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
              [SYS_OK] {message}
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => void handleUnsubscribe(e)}
            className="space-y-4 text-left"
          >
            <p className="text-xs text-neutral-400 leading-relaxed">
              [WARN] Revoking email subscription for token below:
            </p>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-neutral-500 text-xs select-none">$</span>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t("newsletterUnsubscribePlaceholder")}
                required
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900/90 pl-7 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:border-red-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 font-semibold px-4 py-2.5 text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50 cursor-pointer select-none"
            >
              {loading ? "$ Revoking..." : "$ revoke --confirm"}
            </button>
          </form>
        )}

        <div className="pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-emerald-400 transition-colors"
          >
            <span>$ cd /blog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading fallback placeholder displayed while URL search parameters are resolving.
 *
 * @description
 * Renders an accessible, localized loading text placeholder inside the {@link Suspense} boundary.
 *
 * @returns {JSX.Element} The rendered loading state placeholder.
 */
function LoadingFallback() {
  const { t } = useI18n();
  return <div className="py-16 text-center text-gray-400">{t("loading")}</div>;
}

/**
 * Page component for unsubscribing from the newsletter.
 *
 * @description
 * Wraps the client-side {@link UnsubscribeContent} inside a React {@link Suspense} boundary
 * and sets it inside {@link StandardPageLayout}.
 *
 * @returns {JSX.Element} The rendered newsletter unsubscribe page.
 */
export default function NewsletterUnsubscribePage() {
  return (
    <StandardPageLayout>
      <Suspense fallback={<LoadingFallback />}>
        <UnsubscribeContent />
      </Suspense>
    </StandardPageLayout>
  );
}
