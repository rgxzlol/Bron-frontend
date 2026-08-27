"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { authApi, ApiError } from "@/lib/api";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import { Logo } from "@/components/shared/Logo";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";

export type AuthScreen =
  | "welcome"
  | "login"
  | "register-personal"
  | "register-security"
  | "register-success"
  | "login-success"
  | "forgot"
  | "telegram"
  | "support";

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
  return (
    <div>
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
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
}: FieldProps) {
  const [show, setShow] = useState(false);
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[14px] font-semibold text-[var(--text-secondary)]">
        {label}
        {required && <span className="text-[#0a6af7]"> *</span>}
      </span>
      <div className="relative flex items-center rounded-[14px] border border-transparent bg-[var(--auth-box)] transition-all focus-within:border-[#0a6af7] focus-within:bg-[var(--bg-surface)]">
        <input
          className="w-full bg-transparent px-4 py-4 pr-11 text-[16px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
          type={password ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
        />
        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Скрыть пароль" : "Показать пароль"}
            className="absolute right-3 flex h-8 w-8 items-center justify-center opacity-70 transition hover:opacity-100 active:scale-90"
          >
            <Image src={assets.auth.eyeIcon} alt="" width={22} height={22} />
          </button>
        )}
      </div>
    </label>
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

const passwordRules = [
  { label: "Минимум 8 символов", test: (p: string) => p.length >= 8 },
  { label: "Заглавная буква", test: (p: string) => /[A-ZА-ЯЁ]/.test(p) },
  {
    label: "Цифра или спец. символ",
    test: (p: string) => /\d/.test(p) || /[^\p{L}\d\s]/u.test(p),
  },
];

function passwordValid(p: string) {
  return passwordRules.every((r) => r.test(p));
}

function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-3 rounded-[16px] bg-[var(--auth-box)] p-4">
      {passwordRules.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-3">
            <span
              className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-colors ${
                ok ? "bg-[#0a6af7]" : "bg-[var(--bg-inactive)]"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">{rule.label}</span>
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
  primaryText = "Перейти на главную",
}: {
  title: string;
  subtitle: string;
  onPrimary: () => void;
  primaryText?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <SuccessIllustration />
        <h1 className="mt-6 text-[26px] font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="mt-3 max-w-[300px] text-[15px] font-semibold text-[var(--text-secondary)]">
          {subtitle}
        </p>
      </div>
      <PrimaryButton onClick={onPrimary}>{primaryText}</PrimaryButton>
    </div>
  );
}

/* ------------------------------ main flow ------------------------------ */

export default function AuthFlow({ initialScreen = "welcome" }: { initialScreen?: AuthScreen }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);

  const [screen, setScreen] = useState<AuthScreen>(initialScreen);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [tgName, setTgName] = useState("");
  const [tgUsername, setTgUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && token) router.replace(routes.profile);
  }, [hydrated, token, router]);

  function go(next: AuthScreen) {
    setError(null);
    setScreen(next);
  }

  async function handleLogin() {
    setError(null);
    if (!loginName.trim() || !password.trim()) {
      setError("Заполните имя и пароль");
      return;
    }
    setSubmitting(true);
    try {
      const session = await authApi.login({ username: loginName.trim(), password });
      setSession({
        token: session.access_token,
        userId: session.user_id,
        username: session.username,
      });
      go("login-success");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось выполнить вход");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePersonalNext() {
    setError(null);
    if (!firstName.trim()) return setError("Укажите имя");
    if (!email.trim()) return setError("Укажите email");
    if (!phone.trim()) return setError("Укажите номер телефона");
    go("register-security");
  }

  async function handleRegister() {
    setError(null);
    if (!passwordValid(password)) return setError("Пароль не соответствует требованиям");
    if (password !== confirmPassword) return setError("Пароли не совпадают");

    setSubmitting(true);
    const username = firstName.trim();
    try {
      try {
        await authApi.register({
          username,
          email: email.trim(),
          phone: phone.trim(),
          password,
        });
      } catch (registerError) {
        if (!(registerError instanceof ApiError) || registerError.status !== 400) {
          throw registerError;
        }
      }
      const session = await authApi.login({ username, password });
      setSession({
        token: session.access_token,
        userId: session.user_id,
        username: session.username,
      });
      go("register-success");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось создать аккаунт");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaveNewPassword() {
    setError(null);
    if (!passwordValid(newPassword)) return setError("Пароль не соответствует требованиям");
    if (newPassword !== confirmNewPassword) return setError("Пароли не совпадают");
    // Backend has no reset endpoint; return the user to the login screen.
    setPassword("");
    go("login");
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

  if (!hydrated || token) return null;

  /* ------------------------------ screens ------------------------------ */

  if (screen === "welcome") {
    return (
      <AuthShell>
        <WelcomeTopBar />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-center py-6">
          <h1 className="text-[30px] font-semibold leading-tight text-[var(--text-primary)]">
            Добро пожаловать
          </h1>
          <p className="mt-2 text-[15px] font-semibold text-[var(--text-secondary)]">
            Войдите в аккаунт или создайте новый
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {errorBanner}
            <PrimaryButton onClick={() => go("login")}>Войти в аккаунт</PrimaryButton>
            <SecondaryButton onClick={() => go("register-personal")}>Создать аккаунт</SecondaryButton>

            <div className="my-2 flex items-center gap-4">
              <span className="h-px flex-1 bg-[var(--border-default)]" />
              <span className="text-[14px] font-semibold text-[var(--text-muted)]">Или</span>
              <span className="h-px flex-1 bg-[var(--border-default)]" />
            </div>

            <SecondaryButton
              onClick={() => go("login-success")}
              icon={<Image src={assets.auth.googleIcon} alt="" width={22} height={22} />}
            >
              Войти с Google
            </SecondaryButton>
            <SecondaryButton
              onClick={() => go("telegram")}
              icon={<Image src={assets.auth.telegramIcon} alt="" width={22} height={22} />}
            >
              Войти с Telegram
            </SecondaryButton>
          </div>

          </div>
          <button
            type="button"
            onClick={() => go("support")}
            className="mx-auto pt-6 text-[15px] font-semibold text-[#0a6af7] hover:underline"
          >
            Тех поддержка
          </button>
        </div>
      </AuthShell>
    );
  }

  if (screen === "login") {
    return (
      <AuthShell>
        <StepHeader title="Вход в аккаунт" onBack={() => go("welcome")} />
        <div className="mt-6 flex flex-1 flex-col">
          <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
            Впишите ваш пароль и имя для входа в аккаунт
          </p>

          <div className="mt-7 flex flex-col gap-6">
            {errorBanner}
            <Field label="Имя" placeholder="Иван" value={loginName} onChange={setLoginName} autoComplete="username" />
            <Field label="Пароль" placeholder="Введите пароль" value={password} onChange={setPassword} password autoComplete="current-password" />
          </div>

          <div className="mt-auto flex flex-col items-center gap-4 pt-8">
            <PrimaryButton onClick={handleLogin} disabled={submitting}>
              {submitting ? "Загрузка..." : "Продолжить"}
            </PrimaryButton>
            <p className="text-[14px] font-semibold text-[var(--text-secondary)]">
              Забыли пароль?{" "}
              <button type="button" onClick={() => go("forgot")} className="text-[#0a6af7] hover:underline">
                Поменять
              </button>
            </p>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (screen === "register-personal") {
    return (
      <AuthShell>
        <StepHeader title="Создание аккаунта" onBack={() => go("welcome")} step={0} />
        <div className="mt-6 flex flex-1 flex-col">
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Личные данные</h2>
          <p className="mt-1 text-[14px] font-semibold text-[var(--text-secondary)]">
            Пожалуйста, заполните информацию о себе
          </p>

          <div className="mt-6 flex flex-col gap-5">
            {errorBanner}
            <Field label="Имя" required placeholder="Иван" value={firstName} onChange={setFirstName} autoComplete="given-name" />
            <Field label="Фамилия" placeholder="Иванович" value={lastName} onChange={setLastName} autoComplete="family-name" />
            <Field label="Email" required type="email" inputMode="email" placeholder="ivan@gmail.com" value={email} onChange={setEmail} autoComplete="email" />
            <Field label="Номер телефона" required type="tel" inputMode="tel" placeholder="+998 99 000 00 00" value={phone} onChange={setPhone} autoComplete="tel" />
          </div>

          <div className="mt-auto flex flex-col items-center gap-4 pt-8">
            <PrimaryButton onClick={handlePersonalNext}>Продолжить</PrimaryButton>
            <p className="text-[14px] font-semibold text-[var(--text-secondary)]">
              Уже есть аккаунт?{" "}
              <button type="button" onClick={() => go("login")} className="text-[#0a6af7] hover:underline">
                Войти
              </button>
            </p>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (screen === "register-security") {
    return (
      <AuthShell>
        <StepHeader title="Создание аккаунта" onBack={() => go("register-personal")} step={1} />
        <div className="mt-6 flex flex-1 flex-col">
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Безопасность</h2>
          <p className="mt-1 text-[14px] font-semibold text-[var(--text-secondary)]">
            Придумай надежный пароль для защиты аккаунта
          </p>

          <div className="mt-6 flex flex-col gap-5">
            {errorBanner}
            <Field label="Пароль" required placeholder="Введите пароль" value={password} onChange={setPassword} password autoComplete="new-password" />
            <Field label="Подтвердите пароль" required placeholder="Повторите пароль" value={confirmPassword} onChange={setConfirmPassword} password autoComplete="new-password" />
            <PasswordChecklist password={password} />
          </div>

          <div className="mt-auto pt-8">
            <PrimaryButton onClick={handleRegister} disabled={submitting}>
              {submitting ? "Загрузка..." : "Продолжить"}
            </PrimaryButton>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (screen === "register-success") {
    return (
      <AuthShell>
        <SuccessView
          title="Аккаунт создан!"
          subtitle="Добро пожаловать в Bron. Вы успешно зарегистрировались."
          onPrimary={() => router.push(routes.home)}
        />
      </AuthShell>
    );
  }

  if (screen === "login-success") {
    return (
      <AuthShell>
        <SuccessView
          title="Вход успешно выполнен!"
          subtitle="Добро пожаловать в Bron."
          onPrimary={() => router.push(routes.home)}
        />
      </AuthShell>
    );
  }

  if (screen === "forgot") {
    return (
      <AuthShell>
        <StepHeader title="Сброс пароля" onBack={() => go("login")} />
        <div className="mt-6 flex flex-1 flex-col">
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Новый пароль</h2>
          <p className="mt-1 text-[14px] font-semibold text-[var(--text-secondary)]">
            Придумай новый пароль для защиты аккаунта
          </p>

          <div className="mt-6 flex flex-col gap-5">
            {errorBanner}
            <Field label="Новый пароль" required placeholder="Введите пароль" value={newPassword} onChange={setNewPassword} password autoComplete="new-password" />
            <Field label="Подтвердите пароль" required placeholder="Повторите пароль" value={confirmNewPassword} onChange={setConfirmNewPassword} password autoComplete="new-password" />
            <PasswordChecklist password={newPassword} />
          </div>

          <div className="mt-auto pt-8">
            <PrimaryButton onClick={handleSaveNewPassword}>Сохранить</PrimaryButton>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (screen === "telegram") {
    return (
      <AuthShell>
        <StepHeader title="Вход через Telegram" onBack={() => go("welcome")} />
        <div className="mt-6 flex flex-1 flex-col">
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">
            Войти с помощью Telegram
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-[var(--text-secondary)]">
            Заполните данные профиля
          </p>

          <div className="mt-7 flex flex-col gap-6">
            {errorBanner}
            <Field label="Имя" placeholder="Иван" value={tgName} onChange={setTgName} />
            <Field label="Имя пользователя" placeholder="@Bron_2029" value={tgUsername} onChange={setTgUsername} />
          </div>

          <div className="mt-auto pt-8">
            <PrimaryButton
              onClick={() => {
                if (!tgName.trim() || !tgUsername.trim()) {
                  setError("Заполните имя и имя пользователя");
                  return;
                }
                go("login-success");
              }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                Войти с Telegram
                <Image src={assets.auth.telegramIcon} alt="" width={20} height={20} />
              </span>
            </PrimaryButton>
          </div>
        </div>
      </AuthShell>
    );
  }

  // support
  const supportCards = [
    {
      title: "Telegram",
      subtitle: "Написать в Telegram",
      href: "https://t.me/Bron_Suport",
      external: true,
      icon: <Image src={assets.auth.telegramIcon} alt="" width={24} height={24} />,
    },
    {
      title: "Email",
      subtitle: "support@bron.com",
      href: "mailto:support@bron.com",
      external: false,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="3" stroke="#0a6af7" strokeWidth="2" />
          <path d="M4 7l8 6 8-6" stroke="#0a6af7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "F.A.Q",
      subtitle: "Часто задаваемые вопросы",
      href: routes.support,
      external: false,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#0a6af7" strokeWidth="2" />
          <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 3.5" stroke="#0a6af7" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1" fill="#0a6af7" />
        </svg>
      ),
    },
  ];

  return (
    <AuthShell>
      <StepHeader title="Тех.Поддержка" onBack={() => go("welcome")} />
      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-center text-[14px] font-semibold text-[var(--text-secondary)]">
          Мы всегда готовы помочь вам с любыми вопросами
        </p>

        <div className="mt-7 flex flex-col gap-3">
          {supportCards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-4 rounded-[18px] bg-[var(--auth-box)] p-4 transition-all duration-200 hover:shadow-sm active:scale-[0.99]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg-surface)]">
                {card.icon}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-[16px] font-semibold text-[var(--text-primary)]">{card.title}</span>
                <span className="text-[13px] font-semibold text-[var(--text-muted)]">{card.subtitle}</span>
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
