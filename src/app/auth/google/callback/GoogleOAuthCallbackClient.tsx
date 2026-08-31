"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/config/routes";
import { getGoogleOAuthSetupHint } from "@/lib/auth/googleSignIn";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function GoogleOAuthCallbackClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState(t("auth.googleOAuthCompleting"));

  useEffect(() => {
    const error = searchParams.get("error");
    const code = searchParams.get("code");

    if (error) {
      if (error === "redirect_uri_mismatch") {
        setMessage(
          t("auth.googleOAuthRedirectMismatch", {
            hint: getGoogleOAuthSetupHint(),
            origin: window.location.origin,
          }),
        );
        return;
      }

      setMessage(t("auth.googleOAuthError", { error }));
      return;
    }

    if (code) {
      setMessage(t("auth.googleOAuthSuccess"));
      const timer = window.setTimeout(() => {
        router.replace(routes.auth);
      }, 2500);

      return () => window.clearTimeout(timer);
    }

    setMessage(t("auth.googleOAuthFailed"));
  }, [router, searchParams, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-5">
      <div className="w-full max-w-[440px] rounded-[28px] bg-[var(--bg-surface)] p-8 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)]">
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)]">
          {t("auth.googleOAuthTitle")}
        </h1>
        <p className="mt-4 text-[15px] font-semibold text-[var(--text-secondary)]">
          {message}
        </p>
        <Link
          href={routes.auth}
          className="mt-8 inline-flex text-[15px] font-semibold text-[#0a6af7] hover:underline"
        >
          {t("auth.googleOAuthBackToLogin")}
        </Link>
      </div>
    </div>
  );
}
