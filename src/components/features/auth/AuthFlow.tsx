"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { authApi, ApiError } from "@/lib/api";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import { Logo } from "@/components/shared/Logo";
import PasswordInput from "@/components/shared/PasswordInput";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { AUTH_FIELD_LIMITS, clampField, formatUzbekPhoneInput, LOGIN_PASSWORD_LENGTH_ERROR, LOGIN_PASSWORD_LIMITS, REGISTER_PASSWORD_RULES, validateLoginFields, validateLoginPasswordLength, validateRecoveryPassword, validateRegisterFields, validateRegisterPasswordLength, validateRegisterPhone, type LoginFieldErrors, type RecoveryPasswordErrors, type RegisterFieldErrors } from "@/lib/auth/validation";
import { signInWithGooglePopup } from "@/lib/auth/googleSignIn";
import {
  completeGoogleAuth,
  resolveGoogleAuth,
  type GoogleUserProfile,
} from "@/lib/auth/googleAccount";
import { isTelegramOAuthConfigured } from "@/lib/auth/oauth";
import { signInWithTelegramPopup } from "@/lib/auth/telegramSignIn";
import {
  completeTelegramAuth,
  resolveTelegramAuth,
} from "@/lib/auth/telegramAccount";
import type { TelegramUserProfile } from "@/lib/auth/telegramSignIn";
import { useProfileStore } from "@/store/profile.store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { SupportModal } from "./SupportModal";

export type AuthScreen =
  | "welcome"
  | "login"
  | "register"
  | "register-success"
  | "login-success"
  | "forgot"
  | "telegram"
  | "google-phone";

/* ------------------------------ shared UI ------------------------------ */

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-[var(--bg-page)] sm:items-center sm:p-6">
      <div className="flex w-full max-w-[440px] flex-col bg-[var(--bg-surface)] px-5 pb-8 pt-6 sm:min-h-[640px] sm:rounded-[28px] sm:px-8 sm:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)]">
        {children}
      </div>
    </div>
  );
}

function WelcomeTopBar() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Logo className="text-[30px]" />
      <div className="flex items-center gap-2">
        <LanguageSelector />
        <ThemeSwitcher />
      </div>
    </div>
  );
}

function StepHeader({
  title,
  onBack,
  step,
  totalSteps = 3,
}: {
  title: string;
  onBack: () => void;
  step?: number;
  totalSteps?: number;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("common.back")}
          className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-inactive)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">{title}</h1>
      </div>
      {step != null && <StepDots current={step} total={totalSteps} />}
    </div>
  );
}

function StepDots({ current, total = 3 }: { current: number; total?: number }) {
  return (
    <div className="mt-5 flex items-center">
      {Array.from({ length: total }).map((_, i) => (
        <Fragment key={i}>
          <span
            className={`h-[14px] w-[14px] shrink-0 rounded-full transition-colors ${
              i <= current
                ? "bg-[#0a6af7]"
                : i === current + 1
                  ? "border-[3px] border-[#0a6af7] bg-[var(--bg-surface)]"
                  : "bg-[var(--bg-inactive)]"
            }`}
          />
          {i < total - 1 && (
            <span
              className={`h-[3px] flex-1 rounded-full transition-colors ${
                i < current ? "bg-[#0a6af7]" : "bg-[var(--bg-inactive)]"
              }`}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "email" | "tel";
  autoComplete?: string;
  password?: boolean;
  maxLength?: number;
  error?: string;
  id?: string;
  name?: string;
  inputRef?: React.Ref<HTMLInputElement>;
};

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
  password,
  maxLength,
  error,
  id,
  name,
  inputRef,
}: FieldProps) {
  const inputId = id ?? name;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-[14px] font-semibold text-[var(--text-secondary)]"
      >
        {label}
        {required && <span className="text-[#0a6af7]"> *</span>}
      </label>
      {password ? (
        <PasswordInput
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputRef={inputRef}
          aria-invalid={error ? true : undefined}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          wrapClassName={`relative flex items-center rounded-[14px] border bg-[var(--auth-box)] transition-all focus-within:bg-[var(--bg-surface)] ${
            error
              ? "border-[#e02424] focus-within:border-[#e02424]"
              : "border-transparent focus-within:border-[#0a6af7]"
          }`}
          inputClassName="w-full bg-transparent px-4 py-4 pr-11 text-[16px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
          toggleClassName="absolute right-3 flex h-8 w-8 items-center justify-center opacity-70 transition hover:opacity-100 active:scale-90"
        />
      ) : (
        <div
          className={`relative flex items-center rounded-[14px] border bg-[var(--auth-box)] transition-all focus-within:bg-[var(--bg-surface)] ${
            error
              ? "border-[#e02424] focus-within:border-[#e02424]"
              : "border-transparent focus-within:border-[#0a6af7]"
          }`}
        >
          <input
            id={inputId}
            name={name}
            className="w-full bg-transparent px-4 py-4 text-[16px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
            type={type}
            value={value}
            onChange={(e) => {
              const nextValue = maxLength
                ? clampField(e.target.value, maxLength)
                : e.target.value;
              onChange(nextValue);
            }}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete={autoComplete}
            maxLength={maxLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          />
        </div>
      )}
      {error ? (
        <span id={inputId ? `${inputId}-error` : undefined} className="text-[13px] font-semibold text-[#e02424]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[14px] bg-[#0a6af7] py-4 text-[17px] font-semibold text-white transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.99] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-surface)] py-4 text-[17px] font-semibold text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-surface-muted)] active:scale-[0.99]"
    >
      {icon}
      {children}
    </button>
  );
}

function AuthTabs({
  active,
  onLogin,
  onRegister,
}: {
  active: "login" | "register";
  onLogin: () => void;
  onRegister: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 flex gap-2 rounded-[14px] bg-[var(--auth-box)] p-1">
      <button
        type="button"
        onClick={onLogin}
        className={`flex-1 rounded-[12px] py-3 text-[14px] font-semibold transition-colors ${
          active === "login"
            ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-muted)]"
        }`}
      >
        {t("auth.loginToAccount")}
      </button>
      <button
        type="button"
        onClick={onRegister}
        className={`flex-1 rounded-[12px] py-3 text-[14px] font-semibold transition-colors ${
          active === "register"
            ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-muted)]"
        }`}
      >
        {t("auth.createAccount")}
      </button>
    </div>
  );
}

const passwordRules = REGISTER_PASSWORD_RULES;

function PasswordChecklist({ password }: { password: string }) {
  const { t } = useTranslation();

  return (
    <ul className="flex flex-col gap-3 rounded-[16px] bg-[var(--auth-box)] p-4">
      {passwordRules.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.id} className="flex items-center gap-3">
            <span
              className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-colors ${
                ok ? "bg-[#0a6af7]" : "bg-[var(--bg-inactive)]"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">
              {t(`auth.passwordRules.${rule.id}`)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SuccessIllustration() {
  return (
    <div className="relative mx-auto flex h-[180px] w-[180px] items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 180 180" fill="none" aria-hidden="true">
        <g fill="#0a6af7">
          <circle cx="24" cy="70" r="4" />
          <circle cx="150" cy="54" r="5" />
          <circle cx="140" cy="120" r="4" />
          <circle cx="34" cy="126" r="3" />
        </g>
        <g stroke="#0a6af7" strokeWidth="4" strokeLinecap="round">
          <path d="M150 92l10 6" />
          <path d="M20 44l8 5" />
          <path d="M120 20l4 9" />
        </g>
        <g fill="#4a8cf8">
          <path d="M46 34l2.4 5 5 2.4-5 2.4L46 49l-2.4-5-5-2.4 5-2.4z" />
          <path d="M156 132l1.8 3.8 3.8 1.8-3.8 1.8-1.8 3.8-1.8-3.8-3.8-1.8 3.8-1.8z" />
        </g>
      </svg>
      <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[#e8f1ff]">
        <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[#0a6af7] shadow-[0_10px_24px_-6px_rgba(10,106,247,0.6)]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function SuccessView({
  title,
  subtitle,
  onPrimary,
  primaryText = "",
}: {
  title: string;
  subtitle: string;
  onPrimary: () => void;
  primaryText?: string;
}) {
  const { t } = useTranslation();
  const buttonText = primaryText || t("auth.goToHome");
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <SuccessIllustration />
        <h1 className="mt-6 text-[26px] font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="mt-3 max-w-[300px] text-[15px] font-semibold text-[var(--text-secondary)]">
          {subtitle}
        </p>
      </div>
      <PrimaryButton onClick={onPrimary}>{buttonText}</PrimaryButton>
    </div>
  );
}

/* ------------------------------ main flow ------------------------------ */

export default function AuthFlow({ initialScreen = "welcome" }: { initialScreen?: AuthScreen }) {
  const { t } = useTranslation();
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);
  const applyAuthProfile = useProfileStore((s) => s.applyAuthProfile);

  const [screen, setScreen] = useState<AuthScreen>(initialScreen);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [tgName, setTgName] = useState("");
  const [tgUsername, setTgUsername] = useState("");
  const [googlePhone, setGooglePhone] = useState("");
  const [googlePhoneError, setGooglePhoneError] = useState<string | undefined>();
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<GoogleUserProfile | null>(null);
  const [googleAuthMode, setGoogleAuthMode] = useState<"register" | "update">("register");
  const [pendingTelegramProfile, setPendingTelegramProfile] =
    useState<TelegramUserProfile | null>(null);
  const [telegramAuthMode, setTelegramAuthMode] = useState<"register" | "update">("register");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [registerFieldErrors, setRegisterFieldErrors] = useState<RegisterFieldErrors>({});
  const [recoveryErrors, setRecoveryErrors] = useState<RecoveryPasswordErrors>({});
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const newPasswordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hydrated && token) router.replace(routes.home);
  }, [hydrated, token, router]);

  function go(next: AuthScreen) {
    setError(null);
    setFieldErrors({});
    setRegisterFieldErrors({});
    setRecoveryErrors({});
    setGooglePhoneError(undefined);
    if (next !== "google-phone") {
      setPendingGoogleProfile(null);
      setPendingTelegramProfile(null);
    }
    if (next !== "login") {
      setPasswordResetSuccess(false);
    }
    setScreen(next);
  }

  function handleSaveNewPassword() {
    const nextErrors = validateRecoveryPassword(newPassword, confirmNewPassword);

    if (Object.keys(nextErrors).length > 0) {
      setRecoveryErrors(nextErrors);
      setError(nextErrors.form ?? t("auth.checkData"));

      if (nextErrors.newPassword) {
        newPasswordInputRef.current?.focus();
      } else if (nextErrors.confirmPassword) {
        confirmPasswordInputRef.current?.focus();
      }

      return;
    }

    setRecoveryErrors({});
    setError(null);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordResetSuccess(true);
    setScreen("login");
  }

  async function completeAuthSession(
    session: { access_token: string; user_id: number; username: string },
    profile?: {
      fullName?: string;
      email?: string;
      phone?: string;
      avatarUrl?: string | null;
    },
  ) {
    setSession({
      token: session.access_token,
      userId: session.user_id,
      username: session.username,
    });

    applyAuthProfile({
      fullName: profile?.fullName ?? session.username,
      email: profile?.email,
      phone: profile?.phone,
      avatarUrl: profile?.avatarUrl,
    });

    router.replace(routes.home);
  }

  async function handleGoogleOAuth() {
    setError(null);
    setSubmitting(true);

    try {
      await signInWithGooglePopup({
        onSuccess: async (profile) => {
          try {
            const result = await resolveGoogleAuth(profile);

            if (result.kind === "complete") {
              await completeAuthSession(result.session, {
                fullName: profile.name,
                email: profile.email,
                phone: result.phone,
                avatarUrl: profile.picture ?? null,
              });
              return;
            }

            setPendingGoogleProfile(profile);
            setPendingTelegramProfile(null);
            setGoogleAuthMode(result.mode);
            setGooglePhone("");
            setGooglePhoneError(undefined);
            go("google-phone");
          } catch (e) {
            setError(
              e instanceof ApiError ? e.message : t("auth.googleLoginFailed"),
            );
          }
        },
        onError: (message) => {
          setError(message);
        },
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTelegramOAuth() {
    if (!isTelegramOAuthConfigured()) {
      go("telegram");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await signInWithTelegramPopup({
        onSuccess: async (profile) => {
          try {
            const result = await resolveTelegramAuth(profile);

            if (result.kind === "complete") {
              const displayName =
                profile.username ??
                [profile.first_name, profile.last_name].filter(Boolean).join(" ");
              await completeAuthSession(result.session, {
                fullName: displayName,
                phone: result.phone,
                avatarUrl: profile.photo_url ?? null,
              });
              return;
            }

            setPendingTelegramProfile(profile);
            setPendingGoogleProfile(null);
            setTelegramAuthMode(result.mode);
            setGooglePhone("");
            setGooglePhoneError(undefined);
            go("google-phone");
          } catch (e) {
            setError(
              e instanceof ApiError ? e.message : t("auth.telegramLoginFailed"),
            );
          }
        },
        onError: (message) => {
          setError(message);
        },
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOAuthPhoneSubmit() {
    const phoneError = validateRegisterPhone(googlePhone);
    if (phoneError) {
      setGooglePhoneError(phoneError);
      return;
    }

    setGooglePhoneError(undefined);
    setError(null);
    setSubmitting(true);

    try {
      if (pendingTelegramProfile) {
        const session = await completeTelegramAuth(
          pendingTelegramProfile,
          googlePhone,
          telegramAuthMode,
        );
        const displayName =
          pendingTelegramProfile.username ??
          [pendingTelegramProfile.first_name, pendingTelegramProfile.last_name]
            .filter(Boolean)
            .join(" ");

        await completeAuthSession(session, {
          fullName: displayName,
          phone: googlePhone.trim(),
          avatarUrl: pendingTelegramProfile.photo_url ?? null,
        });
        return;
      }

      if (!pendingGoogleProfile) return;

      const session = await completeGoogleAuth(
        pendingGoogleProfile,
        googlePhone,
        googleAuthMode,
      );

      await completeAuthSession(session, {
        fullName: pendingGoogleProfile.name,
        email: pendingGoogleProfile.email,
        phone: googlePhone.trim(),
        avatarUrl: pendingGoogleProfile.picture ?? null,
      });
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : t("auth.phoneSaveFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin() {
    setError(null);

    const nextFieldErrors = validateLoginFields(loginName, password);
    if (nextFieldErrors.loginName || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const session = await authApi.login({
        username: loginName.trim(),
        password,
      });
      await completeAuthSession(session, {
        fullName: session.username,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("auth.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister() {
    setError(null);

    const nextFieldErrors = validateRegisterFields(firstName, phone, password);
    const hasErrors = Object.values(nextFieldErrors).some(Boolean);
    if (hasErrors) {
      setRegisterFieldErrors(nextFieldErrors);
      return;
    }

    setRegisterFieldErrors({});
    setSubmitting(true);
    const username = firstName.trim();
    const normalizedPhone = phone.trim();
    const syntheticEmail = `${username.toLowerCase().replace(/[^\w.-]/g, "") || "user"}@bron.app`;

    try {
      try {
        await authApi.register({
          username,
          email: syntheticEmail,
          phone: normalizedPhone,
          password,
        });
      } catch (registerError) {
        if (!(registerError instanceof ApiError) || registerError.status !== 400) {
          throw registerError;
        }
      }

      const session = await authApi.login({ username, password });
      await completeAuthSession(session, {
        fullName: username,
        email: syntheticEmail,
        phone: normalizedPhone,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("auth.registerFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const errorBanner = useMemo(
    () =>
      error ? (
        <p className="rounded-[12px] bg-[#fdecec] px-4 py-3 text-center text-[14px] font-semibold text-[#e02424]">
          {error}
        </p>
      ) : null,
    [error],
  );

  const successBanner = useMemo(
    () =>
      passwordResetSuccess ? (
        <p className="rounded-[12px] bg-[#e8f7ee] px-4 py-3 text-center text-[14px] font-semibold text-[#1f8a4c]">
          {t("auth.passwordResetSuccess")}
        </p>
      ) : null,
    [passwordResetSuccess],
  );

  if (!hydrated || token) return null;

  /* ------------------------------ screens ------------------------------ */

  if (screen === "welcome") {
    return (
      <AuthShell>
        <WelcomeTopBar />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center py-6">
          <h1 className="text-[30px] font-semibold leading-tight text-[var(--text-primary)]">
            {t("auth.welcomeTitle")}
          </h1>
          <p className="mt-2 text-[15px] font-semibold text-[var(--text-secondary)]">
            {t("auth.welcomeSubtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {errorBanner}
            <PrimaryButton onClick={() => go("login")}>{t("auth.loginToAccount")}</PrimaryButton>
            <SecondaryButton onClick={() => go("register")}>{t("auth.createAccount")}</SecondaryButton>

            <div className="my-2 flex items-center gap-4">
              <span className="h-px flex-1 bg-[var(--border-default)]" />
              <span className="text-[14px] font-semibold text-[var(--text-muted)]">{t("auth.orDivider")}</span>
              <span className="h-px flex-1 bg-[var(--border-default)]" />
            </div>

            <SecondaryButton
              onClick={handleGoogleOAuth}
              icon={<Image src={assets.auth.googleIcon} alt="" width={22} height={22} />}
            >
              {submitting ? t("common.loading") : t("auth.loginWithGoogle")}
            </SecondaryButton>
            <SecondaryButton
              onClick={() => void handleTelegramOAuth()}
              icon={<Image src={assets.auth.telegramIcon} alt="" width={22} height={22} />}
            >
              {submitting ? t("common.loading") : t("auth.loginWithTelegram")}
            </SecondaryButton>
          </div>

          </div>
          <div className="pt-6">
            <SupportModal />
          </div>
        </div>
      </AuthShell>
    );
  }

  if (screen === "login") {
    return (
      <AuthShell>
        <StepHeader title={t("auth.loginTitle")} onBack={() => go("welcome")} />
        <AuthTabs active="login" onLogin={() => go("login")} onRegister={() => go("register")} />
        <form
          className="mt-6 flex flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void handleLogin();
          }}
          noValidate
        >
          <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
            {t("auth.loginSubtitle")}
          </p>

          <div className="mt-7 flex flex-col gap-6">
            {successBanner}
            {errorBanner}
            <Field
              id="username-input"
              name="username"
              label={t("auth.nameLabel")}
              placeholder={t("auth.usernamePlaceholderShort")}
              value={loginName}
              onChange={(value) => {
                setLoginName(value);
                if (fieldErrors.loginName) {
                  setFieldErrors((current) => ({ ...current, loginName: undefined }));
                }
              }}
              maxLength={AUTH_FIELD_LIMITS.username}
              error={fieldErrors.loginName}
              autoComplete="username"
            />
            <Field
              id="password-input"
              name="password"
              label={t("auth.password")}
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(value) => {
                setPassword(value);
                setFieldErrors((current) => {
                  if (value.length > LOGIN_PASSWORD_LIMITS.max) {
                    return {
                      ...current,
                      password: LOGIN_PASSWORD_LENGTH_ERROR,
                    };
                  }

                  if (!current.password) return current;

                  return {
                    ...current,
                    password: validateLoginPasswordLength(value),
                  };
                });
              }}
              error={fieldErrors.password}
              password
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => go("forgot")}
              className="self-start text-[14px] font-semibold text-[#0a6af7] hover:underline"
            >
              {t("auth.forgotPassword")}
            </button>
          </div>

          <div className="mt-auto flex flex-col items-center gap-4 pt-8">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? t("common.loading") : t("auth.login")}
            </PrimaryButton>
          </div>
        </form>
      </AuthShell>
    );
  }

  if (screen === "register") {
    return (
      <AuthShell>
        <StepHeader title={t("auth.registerTitle")} onBack={() => go("welcome")} />
        <AuthTabs active="register" onLogin={() => go("login")} onRegister={() => go("register")} />
        <form
          className="mt-6 flex flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void handleRegister();
          }}
          noValidate
        >
          <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
            {t("auth.registerSubtitle")}
          </p>

          <div className="mt-7 flex flex-col gap-6">
            {errorBanner}
            <Field
              id="register-name-input"
              name="name"
              label={t("auth.nameLabel")}
              required
              placeholder={t("auth.usernamePlaceholderShort")}
              value={firstName}
              onChange={(value) => {
                setFirstName(value);
                if (registerFieldErrors.name) {
                  setRegisterFieldErrors((current) => ({ ...current, name: undefined }));
                }
              }}
              maxLength={AUTH_FIELD_LIMITS.firstName}
              error={registerFieldErrors.name}
              autoComplete="given-name"
            />
            <Field
              id="register-phone-input"
              name="phone"
              label={t("auth.phone")}
              required
              type="tel"
              inputMode="tel"
              placeholder="+998 99 999 99 99"
              value={phone}
              onChange={(value) => {
                setPhone(formatUzbekPhoneInput(value));
                if (registerFieldErrors.phone) {
                  setRegisterFieldErrors((current) => ({ ...current, phone: undefined }));
                }
              }}
              maxLength={AUTH_FIELD_LIMITS.phone}
              error={registerFieldErrors.phone}
              autoComplete="tel"
            />
            <Field
              id="register-password-input"
              name="password"
              label={t("auth.createPassword")}
              required
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChange={(value) => {
                setPassword(value);
                setRegisterFieldErrors((current) => {
                  if (value.length > LOGIN_PASSWORD_LIMITS.max) {
                    return {
                      ...current,
                      password: LOGIN_PASSWORD_LENGTH_ERROR,
                    };
                  }

                  if (!current.password) return current;

                  return {
                    ...current,
                    password: validateRegisterPasswordLength(value),
                  };
                });
              }}
              error={registerFieldErrors.password}
              password
              autoComplete="new-password"
            />
            <PasswordChecklist password={password} />
          </div>

          <div className="mt-auto flex flex-col gap-4 pt-8">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? t("common.loading") : t("auth.createAccount")}
            </PrimaryButton>

            <SecondaryButton
              onClick={handleGoogleOAuth}
              icon={<Image src={assets.auth.googleIcon} alt="" width={22} height={22} />}
            >
              {submitting ? t("common.loading") : "Google"}
            </SecondaryButton>

            <div className="flex gap-3">
              <SupportModal />
              <button
                type="button"
                onClick={() => void handleTelegramOAuth()}
                className="flex w-full items-center justify-center gap-2 rounded-3xl bg-[#0a6af7] p-4 text-[17px] font-semibold text-white transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.98]"
              >
                {submitting ? t("common.loading") : "Telegram"}
                <Image src={assets.auth.telegramIcon} alt="" width={22} height={22} />
              </button>
            </div>

            <p className="text-[14px] font-semibold text-[var(--text-secondary)]">
              {t("auth.alreadyHaveAccount")}{" "}
              <button type="button" onClick={() => go("login")} className="text-[#0a6af7] hover:underline">
                {t("auth.login")}
              </button>
            </p>
          </div>
        </form>
      </AuthShell>
    );
  }

  if (screen === "register-success") {
    return (
      <AuthShell>
        <SuccessView
          title={t("auth.accountCreatedTitle")}
          subtitle={t("auth.accountCreatedSubtitle")}
          primaryText={t("auth.goToHome")}
          onPrimary={() => router.push(routes.home)}
        />
      </AuthShell>
    );
  }

  if (screen === "login-success") {
    return (
      <AuthShell>
        <SuccessView
          title={t("auth.loginSuccessTitle")}
          subtitle={t("auth.loginSuccessSubtitle")}
          primaryText={t("auth.goToHome")}
          onPrimary={() => router.push(routes.home)}
        />
      </AuthShell>
    );
  }

  if (screen === "forgot") {
    return (
      <AuthShell>
        <StepHeader title={t("auth.forgotTitle")} onBack={() => go("login")} />
        <form
          className="mt-6 flex flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveNewPassword();
          }}
          noValidate
        >
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">{t("auth.newPasswordTitle")}</h2>
          <p className="mt-1 text-[14px] font-semibold text-[var(--text-secondary)]">
            {t("auth.newPasswordSubtitle")}
          </p>

          <div className="mt-6 flex flex-col gap-5">
            {errorBanner}
            <Field
              id="recovery-new-password"
              label={t("auth.newPasswordLabel")}
              required
              placeholder={t("auth.passwordPlaceholder")}
              value={newPassword}
              inputRef={newPasswordInputRef}
              onChange={(value) => {
                setNewPassword(value);
                if (recoveryErrors.newPassword || recoveryErrors.form) {
                  setRecoveryErrors((current) => ({
                    ...current,
                    newPassword: undefined,
                    form: undefined,
                  }));
                  setError(null);
                }
              }}
              password
              autoComplete="new-password"
              maxLength={AUTH_FIELD_LIMITS.password}
              error={recoveryErrors.newPassword}
            />
            <Field
              id="recovery-confirm-password"
              label={t("auth.confirmPassword")}
              required
              placeholder={t("auth.confirmPasswordPlaceholder")}
              value={confirmNewPassword}
              inputRef={confirmPasswordInputRef}
              onChange={(value) => {
                setConfirmNewPassword(value);
                if (recoveryErrors.confirmPassword || recoveryErrors.form) {
                  setRecoveryErrors((current) => ({
                    ...current,
                    confirmPassword: undefined,
                    form: undefined,
                  }));
                  setError(null);
                }
              }}
              password
              autoComplete="new-password"
              maxLength={AUTH_FIELD_LIMITS.password}
              error={recoveryErrors.confirmPassword}
            />
          </div>

          <div className="mt-auto pt-8">
            <PrimaryButton type="submit">{t("common.save")}</PrimaryButton>
          </div>
        </form>
      </AuthShell>
    );
  }

  if (screen === "google-phone") {
    return (
      <AuthShell>
        <StepHeader title={t("auth.phoneTitle")} onBack={() => go("welcome")} />
        <form
          className="mt-6 flex flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void handleOAuthPhoneSubmit();
          }}
          noValidate
        >
          <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
            {pendingTelegramProfile
              ? telegramAuthMode === "register"
                ? t("auth.phoneSubtitleTelegram")
                : t("auth.phoneSubtitleDefault")
              : googleAuthMode === "register"
                ? t("auth.phoneSubtitleGoogle")
                : t("auth.phoneSubtitleDefault")}
          </p>

          <div className="mt-7 flex flex-col gap-6">
            {errorBanner}
            <Field
              id="google-phone-input"
              name="phone"
              label={t("auth.phone")}
              required
              type="tel"
              inputMode="tel"
              placeholder="+998 99 999 99 99"
              value={googlePhone}
              onChange={(value) => {
                setGooglePhone(formatUzbekPhoneInput(value));
                if (googlePhoneError) {
                  setGooglePhoneError(undefined);
                }
              }}
              maxLength={AUTH_FIELD_LIMITS.phone}
              error={googlePhoneError}
              autoComplete="tel"
            />
          </div>

          <div className="mt-auto flex flex-col gap-4 pt-8">
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? t("common.loading") : t("common.continue")}
            </PrimaryButton>
          </div>
        </form>
      </AuthShell>
    );
  }

  if (screen === "telegram") {
    return (
      <AuthShell>
        <StepHeader title={t("auth.telegramTitle")} onBack={() => go("welcome")} />
        <div className="mt-6 flex flex-1 flex-col">
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">
            {t("auth.telegramSubtitle")}
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-[var(--text-secondary)]">
            {t("auth.telegramProfileSubtitle")}
          </p>

          <div className="mt-7 flex flex-col gap-6">
            {errorBanner}
            <Field label={t("auth.nameLabel")} placeholder={t("auth.usernamePlaceholderShort")} value={tgName} onChange={setTgName} />
            <Field label={t("auth.telegramUsername")} placeholder={t("auth.telegramUsernamePlaceholder")} value={tgUsername} onChange={setTgUsername} />
          </div>

          <div className="mt-auto pt-8">
            <PrimaryButton
              onClick={() => {
                if (!tgName.trim() || !tgUsername.trim()) {
                  setError(t("auth.fillTgFields"));
                  return;
                }
                go("login-success");
              }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {t("auth.loginWithTelegram")}
                <Image src={assets.auth.telegramIcon} alt="" width={20} height={20} />
              </span>
            </PrimaryButton>
          </div>
        </div>
      </AuthShell>
    );
  }

  return null;
}
