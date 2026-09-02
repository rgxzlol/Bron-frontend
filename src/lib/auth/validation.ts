export const AUTH_FIELD_LIMITS = {
  username: 30,
  password: 128,
  email: 254,
  phone: 20,
  firstName: 50,
  lastName: 50,
} as const;

export const LOGIN_PASSWORD_LIMITS = {
  min: 8,
  max: 16,
} as const;

export const LOGIN_PASSWORD_LENGTH_ERROR =
  "Пароль должен содержать от 8 до 16 символов";

export function clampField(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

export type LoginFieldErrors = {
  loginName?: string;
  password?: string;
};

export function validateLoginPasswordLength(password: string): string | undefined {
  if (!password.trim()) {
    return "Укажите пароль";
  }

  if (
    password.length < LOGIN_PASSWORD_LIMITS.min ||
    password.length > LOGIN_PASSWORD_LIMITS.max
  ) {
    return LOGIN_PASSWORD_LENGTH_ERROR;
  }

  return undefined;
}

export function validateLoginFields(loginName: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmed = loginName.trim();

  if (!trimmed) {
    errors.loginName = "Укажите телефон";
  } else {
    const localDigits = getUzbekPhoneLocalDigits(trimmed);

    if (localDigits.length > 0) {
      if (
        localDigits.length < UZBEK_PHONE_LOCAL_DIGIT_LIMIT ||
        hasExcessUzbekPhoneDigits(trimmed) ||
        !REGISTER_PHONE_PATTERN.test(formatUzbekPhoneInput(trimmed))
      ) {
        errors.loginName = REGISTER_PHONE_FORMAT_ERROR;
      }
    }
  }

  const passwordError = validateLoginPasswordLength(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}

export const RECOVERY_PASSWORD_MIN_LENGTH = 8;

export type RecoveryPasswordErrors = {
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
};

export function validateRecoveryPassword(
  newPassword: string,
  confirmPassword: string,
): RecoveryPasswordErrors {
  const errors: RecoveryPasswordErrors = {};

  if (!newPassword.trim() || !confirmPassword.trim()) {
    if (!newPassword.trim()) {
      errors.newPassword = "Укажите новый пароль";
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Повторите новый пароль";
    }

    errors.form = "Заполните все поля пароля";
    return errors;
  }

  if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Пароли не совпадают";
    errors.form = "Пароли не совпадают";
    return errors;
  }

  if (newPassword.length < RECOVERY_PASSWORD_MIN_LENGTH) {
    errors.newPassword = "Пароль должен содержать минимум 8 символов";
    errors.form = "Пароль должен содержать минимум 8 символов";
  }

  return errors;
}

export const REGISTER_PHONE_PATTERN = /^\+998 \d{2} \d{3} \d{2} \d{2}$/;

export const UZBEK_PHONE_LOCAL_DIGIT_LIMIT = 9;

export function getUzbekPhoneLocalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("998") ? digits.slice(3) : digits;
}

/** Compact E.164 phone for API requests: +998XXXXXXXXX */
export function normalizePhoneForApi(phone: string): string {
  const local = getUzbekPhoneLocalDigits(phone);
  if (!local) return phone.trim();
  return `+998${local}`;
}

/** API username is a phone number (phone-based accounts). */
export function looksLikePhoneUsername(value: string): boolean {
  return getUzbekPhoneLocalDigits(value).length >= UZBEK_PHONE_LOCAL_DIGIT_LIMIT;
}

/** Login identifier: phone numbers map to API username, names pass through. */
export function resolveLoginUsername(loginValue: string): string {
  const trimmed = loginValue.trim();
  const localDigits = getUzbekPhoneLocalDigits(trimmed);

  if (localDigits.length >= UZBEK_PHONE_LOCAL_DIGIT_LIMIT) {
    return normalizePhoneForApi(trimmed);
  }

  return trimmed;
}

export function isUzbekPhoneEmpty(phone: string): boolean {
  const localDigits = getUzbekPhoneLocalDigits(phone);
  return localDigits.length === 0;
}

export function hasExcessUzbekPhoneDigits(phone: string): boolean {
  return getUzbekPhoneLocalDigits(phone).length > UZBEK_PHONE_LOCAL_DIGIT_LIMIT;
}

export const UZBEK_PHONE_PREFIX = "+998";

type FormatUzbekPhoneOptions = {
  preserveOverflow?: boolean;
  keepPrefix?: boolean;
};

export const REGISTER_PHONE_FORMAT_ERROR =
  "Введите номер в формате +998 99 999 99 99";

export const REGISTER_PASSWORD_COMPLEXITY_RULES = [
  { id: "uppercase", test: (password: string) => /[A-ZА-ЯЁ]/.test(password) },
  {
    id: "digitOrSymbol",
    test: (password: string) => /\d/.test(password) || /[^\p{L}\d\s]/u.test(password),
  },
] as const;

export const REGISTER_PASSWORD_RULES = [
  {
    id: "length",
    test: (password: string) =>
      password.length >= LOGIN_PASSWORD_LIMITS.min &&
      password.length <= LOGIN_PASSWORD_LIMITS.max,
  },
  ...REGISTER_PASSWORD_COMPLEXITY_RULES,
] as const;

const REGISTER_PASSWORD_RULE_ERROR_LABELS: Record<
  (typeof REGISTER_PASSWORD_COMPLEXITY_RULES)[number]["id"],
  string
> = {
  uppercase: "заглавная буква",
  digitOrSymbol: "цифра или спец. символ",
};

export type RegisterFieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
};

export function formatUzbekPhoneInput(
  value: string,
  options?: FormatUzbekPhoneOptions,
) {
  const preserveOverflow = options?.preserveOverflow ?? false;
  const local = getUzbekPhoneLocalDigits(value);
  const subscriberDigits = preserveOverflow
    ? local
    : local.slice(0, UZBEK_PHONE_LOCAL_DIGIT_LIMIT);

  if (subscriberDigits.length === 0) {
    return options?.keepPrefix ? UZBEK_PHONE_PREFIX : "";
  }

  let formatted = UZBEK_PHONE_PREFIX;
  if (subscriberDigits.length > 0) {
    formatted += ` ${subscriberDigits.slice(0, 2)}`;
  }
  if (subscriberDigits.length > 2) {
    formatted += ` ${subscriberDigits.slice(2, 5)}`;
  }
  if (subscriberDigits.length > 5) {
    formatted += ` ${subscriberDigits.slice(5, 7)}`;
  }
  if (subscriberDigits.length > 7) {
    formatted += ` ${subscriberDigits.slice(7, 9)}`;
  }
  if (subscriberDigits.length > UZBEK_PHONE_LOCAL_DIGIT_LIMIT) {
    formatted += ` ${subscriberDigits.slice(UZBEK_PHONE_LOCAL_DIGIT_LIMIT)}`;
  }

  return formatted;
}

export function validateRegisterName(name: string): string | undefined {
  const trimmed = name.trim();

  if (!trimmed) {
    return "Укажите имя";
  }

  if (trimmed.length < 2) {
    return "Имя должно содержать минимум 2 символа";
  }

  if (!/^[\p{L}][\p{L}\s'-]*$/u.test(trimmed)) {
    return "Укажите корректное имя";
  }

  return undefined;
}

import { isValidEmailAddress } from "@/lib/email/validation";

export function validateRegisterEmail(email: string): string | undefined {
  const trimmed = email.trim();

  if (!trimmed) {
    return "Укажите email";
  }

  if (!isValidEmailAddress(trimmed)) {
    return "Введите корректный email";
  }

  return undefined;
}

export function validateRegisterPhone(phone: string): string | undefined {
  const trimmed = phone.trim();

  if (!trimmed || isUzbekPhoneEmpty(trimmed)) {
    return "Укажите номер телефона";
  }

  if (hasExcessUzbekPhoneDigits(trimmed) || !REGISTER_PHONE_PATTERN.test(trimmed)) {
    return REGISTER_PHONE_FORMAT_ERROR;
  }

  return undefined;
}

export function isValidUzbekPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed || isUzbekPhoneEmpty(trimmed)) {
    return false;
  }

  if (validateRegisterPhone(trimmed) === undefined) {
    return true;
  }

  const localDigits = getUzbekPhoneLocalDigits(trimmed);
  return (
    localDigits.length === UZBEK_PHONE_LOCAL_DIGIT_LIMIT &&
    !hasExcessUzbekPhoneDigits(trimmed)
  );
}

export function areUzbekPhonesEqual(left: string, right: string): boolean {
  const leftDigits = getUzbekPhoneLocalDigits(left);
  const rightDigits = getUzbekPhoneLocalDigits(right);

  return (
    leftDigits.length === UZBEK_PHONE_LOCAL_DIGIT_LIMIT &&
    leftDigits === rightDigits
  );
}

export function validateRegisterPassword(password: string): string | undefined {
  if (!password.trim()) {
    return "Укажите пароль";
  }

  if (
    password.length < LOGIN_PASSWORD_LIMITS.min ||
    password.length > LOGIN_PASSWORD_LIMITS.max
  ) {
    return LOGIN_PASSWORD_LENGTH_ERROR;
  }

  for (const rule of REGISTER_PASSWORD_COMPLEXITY_RULES) {
    if (!rule.test(password)) {
      return `Пароль не соответствует требованиям: ${REGISTER_PASSWORD_RULE_ERROR_LABELS[rule.id]}`;
    }
  }

  return undefined;
}

export function validateRegisterPasswordLength(password: string): string | undefined {
  if (!password.trim()) {
    return "Укажите пароль";
  }

  if (
    password.length < LOGIN_PASSWORD_LIMITS.min ||
    password.length > LOGIN_PASSWORD_LIMITS.max
  ) {
    return LOGIN_PASSWORD_LENGTH_ERROR;
  }

  return undefined;
}

export function validateRegisterFields(
  name: string,
  phone: string,
  password: string,
  email?: string,
): RegisterFieldErrors {
  return {
    name: validateRegisterName(name),
    phone: validateRegisterPhone(phone),
    password: validateRegisterPassword(password),
    ...(email !== undefined ? { email: validateRegisterEmail(email) } : {}),
  };
}
