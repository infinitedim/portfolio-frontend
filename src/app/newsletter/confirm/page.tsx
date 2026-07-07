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
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="mb-4 text-2xl font-bold text-green-400">
        {t("newsletterConfirmTitle")}
      </h1>
      {status === "loading" && (
        <p className="text-gray-400">{t("newsletterConfirmLoading")}</p>
      )}
      {status === "success" && <p className="text-gray-300">{message}</p>}
      {status === "error" && (
        <p
          className="text-red-400"
          role="alert"
        >
          {message}
        </p>
      )}
      <Link
        href="/"
        className="mt-8 inline-block text-green-400 hover:text-green-300"
      >
        {t("newsletterConfirmBack")}
      </Link>
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
