"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { siteConfig } from "@/config/site";
import { routes } from "@/config/routes";
import { authApi, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import ThemeToggle from "@/components/shared/ThemeToggle";
import s from "./authPage.module.css";

type AuthTab = "login" | "register";

export default function AuthPageContent() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [tab, setTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Заполните имя и пароль");
      return;
    }

    if (tab === "register" && (!email.trim() || !phone.trim())) {
      setError("Для регистрации укажите email и телефон");
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

      router.push(routes.home);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Не удалось выполнить вход",
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
              Войти в аккаунт
            </button>
            <button
              type="button"
              className={tab === "register" ? s.tabActive : s.tab}
              onClick={() => setTab("register")}
            >
              Создать аккаунт
            </button>
          </div>

          <label className={s.field}>
            <span className={s.label}>Имя пользователя</span>
            <input
              className={s.input}
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Введите имя"
            />
          </label>

          {tab === "register" && (
            <>
              <label className={s.field}>
                <span className={s.label}>Email</span>
                <input
                  className={s.input}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@example.com"
                />
              </label>

              <label className={s.field}>
                <span className={s.label}>Телефон</span>
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
            <span className={s.label}>Пароль</span>
            <div className={s.inputWrap}>
              <input
                className={s.input}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
              />
              <button
                type="button"
                className={s.eyeBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
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
              ? "Загрузка..."
              : tab === "login"
                ? "Войти"
                : "Создать аккаунт"}
          </button>

          <button type="button" className={s.socialBtn}>
            <span className={s.googleIcon}>G</span>
            Google
          </button>

          <div className={s.footerActions}>
            <Link href={routes.support} className={s.supportBtn}>
              Тех.поддержка
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
