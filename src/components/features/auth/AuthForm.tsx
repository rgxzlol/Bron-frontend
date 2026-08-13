"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { authApi, ApiError } from "@/lib/api";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { SupportModal } from "./SupportModal";

type AuthMode = "login" | "register";

type Props = {
  mode: AuthMode;
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 12C22 12 17.522 18 12 18C6.478 18 2 12 2 12C2 12 6.478 6 12 6C17.522 6 22 12 22 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.1213 14.1213C13.5587 14.6839 12.7956 15 12 15C11.2044 15 10.4413 14.6839 9.87868 14.1213C9.31607 13.5587 9 12.7956 9 12C9 11.2044 9.31607 10.4413 9.87868 9.87868C10.4413 9.31607 11.2044 9 12 9C12.7956 9 13.5587 9.31607 14.1213 9.87868C14.6839 10.4413 15 11.2044 15 12C15 12.7956 14.6839 13.5587 14.1213 14.1213Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 12C22 12 17.522 18 12 18C6.478 18 2 12 2 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RequiredMark() {
  return <span className="text-[#0A6AF7]">*</span>;
}

function PasswordHint() {
  return (
    <div className="absolute top-[calc(100%+12px)] right-0 z-30 w-[263px] rounded-[16px] bg-white p-4 text-center text-[14px] font-semibold leading-snug text-black shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
      <span className="absolute right-6 bottom-full h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-white" />
      Мин 8 - макс 16 символов,
      <br />
      на латинском языке
    </div>
  );
}

const PHONE_ALLOWED_KEYS = [
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
  "Home",
  "End",
];

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPhone(digits: string): string {
  if (!digits) return "+";
  let result = "+" + digits.slice(0, 3);
  if (digits.length > 3) result += " " + digits.slice(3, 5);
  if (digits.length > 5) result += " " + digits.slice(5, 8);
  if (digits.length > 8) result += " " + digits.slice(8, 10);
  if (digits.length > 10) result += " " + digits.slice(10, 12);
  return result;
}

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("+");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPasswordHint, setShowPasswordHint] = useState(false);

  const passwordWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydrated && token) {
      router.replace(routes.profile);
    }
  }, [hydrated, token, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        passwordWrapperRef.current &&
        !passwordWrapperRef.current.contains(event.target as Node)
      ) {
        setShowPasswordHint(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handlePhoneKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (PHONE_ALLOWED_KEYS.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  function handlePhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
    setPhone(formatPhone(digits));
  }

  function handleUsernameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUsername(capitalizeFirst(event.target.value));
  }

  async function handleSubmit() {
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError(t("auth.fillUsernamePassword"));
      return;
    }

    if (mode === "register" && phone.replace(/\D/g, "").length === 0) {
      setError("Для регистрации укажите телефон");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "register") {
        try {
          await authApi.register({
            username: username.trim(),
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
            ? t("auth.loginFailed")
            : t("auth.registerFailed"),
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
              {mode === "login" ? "Имя пользователя" : "Имя"} <RequiredMark />
            </label>
            <div className="relative flex max-h-16.75 items-center rounded-[22px] border border-transparent bg-white p-5.5 transition-all duration-200 focus-within:border-[#0A6AF7]">
              <input
                id="username-input"
                type="text"
                placeholder={t("auth.usernamePlaceholderShort")}
                value={username}
                onChange={handleUsernameChange}
                className="w-full bg-transparent text-[20px] font-semibold text-black outline-none placeholder:opacity-60"
              />
            </div>
          </div>

          {mode === "login" && (
            <div className="flex flex-col gap-1.25">
              <label
                htmlFor="password-input"
                className="mb-1.25 text-[20px] font-semibold text-black opacity-60"
              >
                Пароль <RequiredMark />
              </label>
              <div
                ref={passwordWrapperRef}
                className="relative flex max-h-16.75 items-center rounded-[22px] border border-transparent bg-white p-5.5 transition-all duration-200 focus-within:border-[#0A6AF7]"
              >
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  value={password}
                  onFocus={() => setShowPasswordHint(true)}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setShowPasswordHint(false);
                  }}
                  className="w-full bg-transparent pr-10 text-[20px] font-semibold text-black outline-none placeholder:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-black/60 transition-all duration-200 hover:opacity-70 hover:text-black active:scale-90"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  <EyeIcon open={showPassword} />
                </button>

                {showPasswordHint && <PasswordHint />}
              </div>

              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  className="text-[14px] font-semibold text-[#0A6AF7] hover:underline"
                >
                  Забыли пароль?
                </button>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3.25">
              <div className="flex flex-col gap-1.25">
                <label
                  htmlFor="phone-input"
                  className="mb-1.25 text-[20px] font-semibold text-black opacity-60"
                >
                  Номер телефона <RequiredMark />
                </label>
                <div className="relative flex max-h-16.75 items-center rounded-[22px] border border-transparent bg-white p-5.5 transition-all duration-200 focus-within:border-[#0A6AF7]">
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    placeholder="+998 99 999 99 99"
                    value={phone}
                    onKeyDown={handlePhoneKeyDown}
                    onChange={handlePhoneChange}
                    className="w-full bg-transparent text-[20px] font-semibold text-black outline-none placeholder:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.25">
                <label
                  htmlFor="password-input"
                  className="mb-1.25 text-[20px] font-semibold text-black opacity-60"
                >
                  Придумайте пароль <RequiredMark />
                </label>
                <div
                  ref={passwordWrapperRef}
                  className="relative flex max-h-16.75 items-center rounded-[22px] border border-transparent bg-white p-5.5 transition-all duration-200 focus-within:border-[#0A6AF7]"
                >
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Придумайте пароль"
                    value={password}
                    onFocus={() => setShowPasswordHint(true)}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setShowPasswordHint(false);
                    }}
                    className="w-full bg-transparent pr-10 text-[20px] font-semibold text-black outline-none placeholder:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-black/60 transition-all duration-200 hover:opacity-70 hover:text-black active:scale-90"
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>

                  {showPasswordHint && <PasswordHint />}
                </div>
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
            className="w-full h-[70px] rounded-[22px] border border-[rgba(0,0,0,0.08)] bg-[#0A6AF7] p-4 text-[24px] font-semibold text-white transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting
              ? t("common.loading")
              : mode === "login"
                ? t("auth.login")
                : t("auth.register")}
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
              className="flex w-full h-[70px] items-center justify-center gap-1.25 rounded-3xl bg-[#0A6AF7] p-4 text-[20px] font-semibold text-white transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.98]"
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