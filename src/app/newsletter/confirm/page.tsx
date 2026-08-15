"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { confirmNewsletter } from "@/lib/services/newsletter-service";
import { useI18n } from "@/hooks/use-i18n";

function ConfirmContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing confirmation token.");
      return;
    }

    confirmNewsletter(token)
      .then((result) => {
        setStatus("success");
        setMessage(result.message);
        return undefined;
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Confirmation failed");
        return undefined;
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center font-mono">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>token.verification :: {status.toUpperCase()}</span>
        </div>

        <h1 className="mb-4 text-xl font-bold text-white tracking-tight">
          $ auth --verify-token
        </h1>

        {status === "loading" && (
          <p className="text-neutral-400 text-xs sm:text-sm">
            &gt; {t("newsletterConfirmLoading")}
          </p>
        )}
        {status === "success" && (
          <div className="space-y-3">
            <p className="text-emerald-400 text-xs sm:text-sm bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
              [SYS_OK] {message}
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-3">
            <p className="text-red-400 text-xs sm:text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg" role="alert">
              [SYS_ERR] {message}
            </p>
          </div>
        )}

        <div className="pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-emerald-400 text-neutral-950 font-semibold hover:bg-emerald-300 transition-colors shadow-md shadow-emerald-500/10"
          >
            <span>$ cd /blog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  const { t } = useI18n();
  return <div className="py-16 text-center text-gray-400">{t("loading")}</div>;
}

export default function NewsletterConfirmPage() {
  return (
    <StandardPageLayout>
      <Suspense fallback={<LoadingFallback />}>
        <ConfirmContent />
      </Suspense>
    </StandardPageLayout>
  );
}
