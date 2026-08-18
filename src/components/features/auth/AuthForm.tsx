"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { authApi, ApiError } from "@/lib/api";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import { SupportModal } from "./SupportModal";

type AuthMode = "login" | "register";

type Props = {
  mode: AuthMode;
};

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      setError("Заполните имя пользователя и пароль");
      return;
    }

    if (mode === "register") {
      if (!email.trim() || !phone.trim()) {
        setError("Для регистрации укажите email и телефон");
        return;
      }
      if (password !== confirmPassword) {
        setError("Пароли не совпадают");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "register") {
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
          : mode === "login"
            ? "Не удалось выполнить вход"
            : "Не удалось создать аккаунт",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {hydrated && token ? null : (
      <section className="mt-9.5 w-full">
        <form
          className="flex flex-col gap-3.25"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="flex flex-col gap-1.25">
            <label
              htmlFor="username-input"
              className="mb-1.25 text-[20px] font-semibold text-black opacity-60"
            >
              Имя пользователя
            </label>
            <div className="relative flex max-h-16.75 items-center rounded-[22px] border border-transparent bg-white p-5.5 transition-all duration-200 focus-within:border-[#0A6AF7]">
              <input
                id="username-input"
                type="text"
                placeholder="Иван"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full bg-transparent text-[20px] font-semibold text-black outline-none placeholder:opacity-60"
              />
            </div>
          </div>

          {mode === "register" && (
            <>
              <div className="flex flex-col gap-1.25">
                <label
                  htmlFor="email-input"
                  className="mb-1.25 text-[20px] font-semibold text-black opacity-60"
                >
                  Email
                </label>
                <div className="relative flex max-h-16.75 items-center rounded-[22px] border border-transparent bg-white p-5.5 transition-all duration-200 focus-within:border-[#0A6AF7]">
                  <input
                    id="email-input"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-transparent text-[20px] font-semibold text-black outline-none placeholder:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.25">
                <label
                  htmlFor="phone-input"
                  className="mb-1.25 text-[20px] font-semibold text-black opacity-60"
                >
                  Телефон
                </label>
                <div className="relative flex max-h-16.75 items-center rounded-[22px] border border-transparent bg-white p-5.5 transition-all duration-200 focus-within:border-[#0A6AF7]">
                  <input
                    id="phone-input"
                    type="tel"
                    placeholder="+998 90 000 00 00"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full bg-transparent text-[20px] font-semibold text-black outline-none placeholder:opacity-60"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.25">
            <label
              htmlFor="password-input"
              className="mb-1.25 text-[20px] font-semibold text-black opacity-60"
            >
              Пароль
            </label>
            <div className="relative flex max-h-16.75 items-center rounded-[22px] border border-transparent bg-white p-5.5 transition-all duration-200 focus-within:border-[#0A6AF7]">
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent pr-10 text-[20px] font-semibold text-black outline-none placeholder:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-5 top-5 transition-all duration-200 hover:opacity-70 active:scale-90"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                <Image src={assets.auth.eyeIcon} alt="" />
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div className="flex flex-col gap-1.25">
              <label
                htmlFor="confirm-password-input"
                className="mb-1.25 text-[20px] font-semibold text-black opacity-60"
              >
                Повторите пароль
              </label>
              <div className="relative flex max-h-16.75 items-center rounded-[22px] border border-transparent bg-white p-5.5 transition-all duration-200 focus-within:border-[#0A6AF7]">
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-transparent pr-10 text-[20px] font-semibold text-black outline-none placeholder:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-5 top-5 transition-all duration-200 hover:opacity-70 active:scale-90"
                  aria-label={
                    showConfirmPassword ? "Скрыть пароль" : "Показать пароль"
                  }
                >
                  <Image src={assets.auth.eyeIcon} alt="" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-[16px] font-semibold text-red-500">
              {error}
            </p>
          )}
        </form>

        <div className="mt-10.5 flex flex-col gap-6.5">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="w-full rounded-[22px] border border-[rgba(0,0,0,0.08)] bg-[#0A6AF7] p-4 text-[24px] font-semibold text-white transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting
              ? "Загрузка..."
              : mode === "login"
                ? "Войти"
                : "Регистрация"}
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-1.25 rounded-[41px] bg-white p-4 text-[24px] font-semibold text-black transition-all duration-200 hover:bg-[#f2f2f7] active:scale-[0.98]"
          >
            <Image src={assets.auth.googleIcon} alt="google" />
            Google
          </button>

          <div className="flex gap-4.75">
            <SupportModal />
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.25 rounded-3xl bg-[#0A6AF7] p-4 text-[20px] font-semibold text-white transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.98]"
            >
              Telegram
              <Image src={assets.auth.telegramIcon} alt="telegram" />
            </button>
          </div>
        </div>
      </section>
      )}
    </>
  );
}
