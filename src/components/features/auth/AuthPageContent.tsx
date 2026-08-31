"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { siteConfig } from "@/config/site";
import { routes } from "@/config/routes";
import { authApi, ApiError } from "@/lib/api";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import ThemeToggle from "@/components/shared/ThemeToggle";
import PasswordInput from "@/components/shared/PasswordInput";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { validateRegisterEmail } from "@/lib/auth/validation";
import s from "./authPage.module.css";

type AuthTab = "login" | "register";

export default function AuthPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);

  const [tab, setTab] = useState<AuthTab>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && token) {
      router.replace(routes.profile);
    }
  }, [hydrated, token, router]);

  async function handleSubmit() {
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError(t("auth.fillNamePassword"));
      return;
    }

    if (tab === "register") {
      if (!email.trim() || !phone.trim()) {
        setError(t("auth.fillEmailPhone"));
        return;
      }

      const emailError = validateRegisterEmail(email);
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (tab === "register") {
        await authApi.register({
          username: username.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });
      }

      const session = await authApi.login({
        username: username.trim(),
        password,
      });

      setSession({
        token: session.access_token,
        userId: session.user_id,
        username: session.username,
      });

      router.push(routes.profile);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : t("auth.loginFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hydrated && token) {
    return (
      <div className={s.authPage}>
        <p className={s.errorText} style={{ color: "rgba(0,0,0,0.6)" }}>
          {t("auth.redirectingToProfile")}
        </p>
      </div>
    );
  }

  return (
    <div className={s.authPage}>
      <div className={s.topBar}>
        <Link href={routes.home} className={s.logo}>
          {siteConfig.name}
        </Link>

        <div className={s.topActions}>
          <button type="button" className={s.langBtn}>
            <Image src={assets.header.ruLang} alt="" width={22} height={22} />
            RU
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className={s.center}>
        <div className={s.card}>
          <div className={s.tabs}>
            <button
              type="button"
              className={tab === "login" ? s.tabActive : s.tab}
              onClick={() => setTab("login")}
            >
              {t("auth.loginToAccount")}
            </button>
            <button
              type="button"
              className={tab === "register" ? s.tabActive : s.tab}
              onClick={() => setTab("register")}
            >
              {t("auth.createAccount")}
            </button>
          </div>

          <form
            className={s.form}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <label className={s.field}>
              <span className={s.label}>{t("auth.username")}</span>
              <input
                className={s.input}
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t("auth.usernamePlaceholder")}
              />
            </label>

            {tab === "register" && (
              <>
                <label className={s.field}>
                  <span className={s.label}>{t("auth.email")}</span>
                  <input
                    className={s.input}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@example.com"
                  />
                </label>

                <label className={s.field}>
                  <span className={s.label}>{t("auth.phone")}</span>
                  <input
                    className={s.input}
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+998 90 000 00 00"
                  />
                </label>
              </>
            )}

            <label className={s.field}>
              <span className={s.label}>{t("auth.password")}</span>
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder={t("auth.passwordPlaceholder")}
                wrapClassName={s.inputWrap}
                inputClassName={s.input}
                toggleClassName={s.eyeBtn}
              />
            </label>

            {error && <p className={s.errorText}>{error}</p>}

            <button
              type="submit"
              className={s.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("common.loading")
                : tab === "login"
                  ? t("auth.login")
                  : t("auth.createAccount")}
            </button>
          </form>

          <button type="button" className={s.socialBtn}>
            <span className={s.googleIcon}>G</span>
            Google
          </button>

          <div className={s.footerActions}>
            <Link href={routes.support} className={s.supportBtn}>
              {t("auth.support")}
            </Link>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className={s.telegramBtn}
            >
              <Image src={assets.support.tg} alt="" width={20} height={20} data-theme-aware />
              Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
