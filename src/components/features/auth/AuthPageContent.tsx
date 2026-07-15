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
import { useTranslation } from "@/lib/i18n/useTranslation";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import ThemeToggle from "@/components/shared/ThemeToggle";
import s from "./authPage.module.css";

type AuthTab = "login" | "register";

export default function AuthPageContent() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const { t } = useTranslation();

  const [tab, setTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
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

    if (tab === "register" && (!email.trim() || !phone.trim())) {
      setError(t("auth.fillEmailPhone"));
      return;
    }

    setIsSubmitting(true);

    try {
      if (tab === "register") {
        try {
          await authApi.register({
            username: username.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
          });
        } catch (registerError) {
          if (!(registerError instanceof ApiError) || registerError.status !== 400) {
            throw registerError;
          }
        }
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

  return (
    <div className={s.authPage}>
      <div className={s.topBar}>
        <Link href={routes.home} className={s.logo}>
          {siteConfig.name}
        </Link>

        <div className={s.topActions}>
          <LanguageSelector />
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
              {t("auth.loginTab")}
            </button>
            <button
              type="button"
              className={tab === "register" ? s.tabActive : s.tab}
              onClick={() => setTab("register")}
            >
              {t("auth.registerTab")}
            </button>
          </div>

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
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
              />
              <button
                type="button"
                className={s.eyeBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPassword ? "◉" : "◎"}
              </button>
            </div>
          </label>

          {error && <p className={s.errorText}>{error}</p>}

          <button
            type="button"
            className={s.submitBtn}
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("common.loading")
              : tab === "login"
                ? t("auth.login")
                : t("auth.createAccount")}
          </button>

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
