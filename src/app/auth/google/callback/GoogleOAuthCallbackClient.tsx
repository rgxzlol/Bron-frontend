"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/config/routes";
import { getGoogleOAuthSetupHint } from "@/lib/auth/googleSignIn";

export default function GoogleOAuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Завершаем вход через Google...");

  useEffect(() => {
    const error = searchParams.get("error");
    const code = searchParams.get("code");

    if (error) {
      if (error === "redirect_uri_mismatch") {
        setMessage(
          `Redirect URI не совпадает. ${getGoogleOAuthSetupHint()} Также добавьте ${window.location.origin}/auth/google/callback в Authorized redirect URIs.`,
        );
        return;
      }

      setMessage(`Ошибка Google OAuth: ${error}`);
      return;
    }

    if (code) {
      setMessage(
        "Google авторизация прошла успешно. Обмен кода на сессию пока не настроен на сервере.",
      );
      const timer = window.setTimeout(() => {
        router.replace(routes.auth);
      }, 2500);

      return () => window.clearTimeout(timer);
    }

    setMessage("Не удалось завершить вход через Google.");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-5">
      <div className="w-full max-w-[440px] rounded-[28px] bg-[var(--bg-surface)] p-8 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)]">
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)]">
          Google OAuth
        </h1>
        <p className="mt-4 text-[15px] font-semibold text-[var(--text-secondary)]">
          {message}
        </p>
        <Link
          href={routes.auth}
          className="mt-8 inline-flex text-[15px] font-semibold text-[#0a6af7] hover:underline"
        >
          Вернуться ко входу
        </Link>
      </div>
    </div>
  );
}
