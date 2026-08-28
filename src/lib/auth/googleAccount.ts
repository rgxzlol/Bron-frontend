import { authApi, ApiError } from "@/lib/api";
import type { LoginResponse } from "@/lib/api/types";
import { AUTH_FIELD_LIMITS } from "@/lib/auth/validation";

export type GoogleUserProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

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

function buildGooglePhone(sub: string) {
  const digits = sub.replace(/\D/g, "").slice(0, AUTH_FIELD_LIMITS.phone - 1);
  return `+${digits || "0000000000"}`;
}

export async function authenticateWithGoogle(
  profile: GoogleUserProfile,
): Promise<LoginResponse> {
  const username = buildGoogleUsername(profile);
  const password = buildGooglePassword(profile.sub);

  try {
    return await authApi.login({ username, password });
  } catch (loginError) {
    if (!(loginError instanceof ApiError) || loginError.status !== 401) {
      throw loginError;
    }
  }

  try {
    await authApi.register({
      username,
      email: profile.email.trim(),
      phone: buildGooglePhone(profile.sub),
      password,
    });
  } catch (registerError) {
    if (!(registerError instanceof ApiError) || registerError.status !== 400) {
      throw registerError;
    }
  }

  return authApi.login({ username, password });
}
