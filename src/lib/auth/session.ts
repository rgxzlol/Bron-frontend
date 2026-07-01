export const AUTH_COOKIE_NAME = "bron_auth_token";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
