import { authApi, ApiError, usersApi } from "@/lib/api";
import type { LoginResponse } from "@/lib/api/types";
import {
  areUzbekPhonesEqual,
  AUTH_FIELD_LIMITS,
  isValidUzbekPhone,
  normalizePhoneForApi,
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
      await syncGoogleEmail(profile.email, session.access_token);
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

  const normalizedPhone = normalizePhoneForApi(phone);
  const username = buildGoogleUsername(profile);
  const password = buildGooglePassword(profile.sub);

  if (mode === "register") {
    return authApi.registerOrSignIn(
      {
        username,
        email: profile.email,
        phone: normalizedPhone,
        password,
      },
      { username, password },
    );
  }

  const session = await authApi.login({ username, password });
  const user = await authApi.me(session.access_token);

  if (areUzbekPhonesEqual(user.phone, normalizedPhone)) {
    await syncGoogleEmail(profile.email, session.access_token);
    return session;
  }

  try {
    await usersApi.updateProfile(
      { phone: normalizedPhone, email: profile.email },
      session.access_token,
    );
  } catch (updateError) {
    if (
      updateError instanceof ApiError &&
      (updateError.status === 409 ||
        (updateError.status === 500 &&
          /unique constraint failed.*phone/i.test(updateError.message)))
    ) {
      throw new ApiError(
        409,
        `Аккаунт с номером ${normalizedPhone} уже зарегистрирован. Войдите с этим номером и паролем.`,
        updateError.data,
      );
    }

    throw updateError;
  }

  return session;
}

/** Keep the real Google email on the account (replaces synthetic @bron.app placeholders). */
async function syncGoogleEmail(email: string, token: string) {
  try {
    await usersApi.updateProfile({ email }, token);
  } catch {
    // Local profile still receives the Google email from AuthFlow.
  }
}
