import { authApi, ApiError, usersApi } from "@/lib/api";
import type { LoginResponse } from "@/lib/api/types";
import {
  AUTH_FIELD_LIMITS,
  isValidUzbekPhone,
  validateRegisterPhone,
} from "@/lib/auth/validation";

export type GoogleUserProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

export type GoogleAuthResult =
  | { kind: "complete"; session: LoginResponse; phone: string }
  | { kind: "needs-phone"; mode: "register" | "update" };

function sanitizeUsername(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, AUTH_FIELD_LIMITS.username);
}

function buildGoogleUsername(profile: GoogleUserProfile) {
  const fromName = sanitizeUsername(profile.name.split(/\s+/)[0] ?? "");
  const fromEmail = sanitizeUsername(profile.email.split("@")[0] ?? "");
  const suffix = sanitizeUsername(profile.sub).slice(-6);
  const base = (fromName || fromEmail || "user").slice(0, AUTH_FIELD_LIMITS.username - suffix.length);

  return `${base}${suffix}`.slice(0, AUTH_FIELD_LIMITS.username);
}

function buildGooglePassword(sub: string) {
  return `google-oauth-${sub}`;
}

export async function resolveGoogleAuth(
  profile: GoogleUserProfile,
): Promise<GoogleAuthResult> {
  const username = buildGoogleUsername(profile);
  const password = buildGooglePassword(profile.sub);

  try {
    const session = await authApi.login({ username, password });
    const user = await authApi.me(session.access_token);

    if (isValidUzbekPhone(user.phone)) {
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

export async function completeGoogleAuth(
  profile: GoogleUserProfile,
  phone: string,
  mode: "register" | "update",
): Promise<LoginResponse> {
  const phoneError = validateRegisterPhone(phone);
  if (phoneError) {
    throw new Error(phoneError);
  }

  const normalizedPhone = phone.trim();
  const username = buildGoogleUsername(profile);
  const password = buildGooglePassword(profile.sub);

  if (mode === "register") {
    try {
      await authApi.register({
        username,
        email: profile.email.trim(),
        phone: normalizedPhone,
        password,
      });
    } catch (registerError) {
      if (!(registerError instanceof ApiError) || registerError.status !== 400) {
        throw registerError;
      }
    }

    return authApi.login({ username, password });
  }

  const session = await authApi.login({ username, password });
  await usersApi.updateProfile({ phone: normalizedPhone }, session.access_token);
  return session;
}
