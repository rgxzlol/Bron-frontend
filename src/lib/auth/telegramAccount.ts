import { authApi, ApiError, usersApi } from "@/lib/api";
import type { LoginResponse } from "@/lib/api/types";
import {
  AUTH_FIELD_LIMITS,
  isValidUzbekPhone,
  normalizePhoneForApi,
  validateRegisterPhone,
} from "@/lib/auth/validation";
import { buildSyntheticEmail } from "@/lib/auth/syntheticEmail";
import type { TelegramUserProfile } from "@/lib/auth/telegramSignIn";

export type TelegramAuthResult =
  | { kind: "complete"; session: LoginResponse; phone: string }
  | { kind: "needs-phone"; mode: "register" | "update" };

function sanitizeUsername(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, AUTH_FIELD_LIMITS.username);
}

function buildTelegramUsername(profile: TelegramUserProfile) {
  const fromUsername = profile.username
    ? sanitizeUsername(profile.username.replace(/^@/, ""))
    : "";
  const fromName = sanitizeUsername(profile.first_name);
  const suffix = String(profile.id).slice(-6);
  const base = (fromUsername || fromName || "user").slice(
    0,
    AUTH_FIELD_LIMITS.username - suffix.length,
  );

  return `${base}${suffix}`.slice(0, AUTH_FIELD_LIMITS.username);
}

function buildTelegramPassword(telegramId: number) {
  return `telegram-oauth-${telegramId}`;
}

async function linkTelegramId(profile: TelegramUserProfile, token: string) {
  await usersApi.updateTelegramId({ telegram_id: profile.id }, token);
}

export async function resolveTelegramAuth(
  profile: TelegramUserProfile,
): Promise<TelegramAuthResult> {
  const username = buildTelegramUsername(profile);
  const password = buildTelegramPassword(profile.id);

  try {
    const session = await authApi.login({ username, password });
    const user = await authApi.me(session.access_token);

    if (isValidUzbekPhone(user.phone)) {
      await linkTelegramId(profile, session.access_token);
      return { kind: "complete", session, phone: user.phone.trim() };
    }

    return { kind: "needs-phone", mode: "update" };
  } catch (loginError) {
    if (loginError instanceof ApiError && loginError.status === 401) {
      return { kind: "needs-phone", mode: "register" };
    }

    throw loginError;
  }
}

export async function completeTelegramAuth(
  profile: TelegramUserProfile,
  phone: string,
  mode: "register" | "update",
): Promise<LoginResponse> {
  const phoneError = validateRegisterPhone(phone);
  if (phoneError) {
    throw new Error(phoneError);
  }

  const normalizedPhone = normalizePhoneForApi(phone);
  const username = buildTelegramUsername(profile);
  const password = buildTelegramPassword(profile.id);

  if (mode === "register") {
    await authApi.register({
      username,
      email: buildSyntheticEmail(username, phone),
      phone: normalizedPhone,
      password,
    });

    const session = await authApi.login({ username, password });
    await linkTelegramId(profile, session.access_token);
    return session;
  }

  try {
    const session = await usersApi.connectTelegram(normalizedPhone);
    await linkTelegramId(profile, session.access_token);
    return session;
  } catch (connectError) {
    if (!(connectError instanceof ApiError) || connectError.status !== 404) {
      throw connectError;
    }
  }

  const session = await authApi.login({ username, password });
  await usersApi.updateProfile({ phone: normalizedPhone }, session.access_token);
  await linkTelegramId(profile, session.access_token);
  return session;
}
