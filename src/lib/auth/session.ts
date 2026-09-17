export const AUTH_COOKIE_NAME = "bron_auth_token";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isSecureContext() {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

export function getAuthCookie(): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${AUTH_COOKIE_NAME}=`;
  const cookiePart = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookiePart) return null;

  try {
    return decodeURIComponent(cookiePart.slice(prefix.length));
  } catch {
    return cookiePart.slice(prefix.length);
  }
}

export function setAuthCookie(token: string) {
  if (typeof document === "undefined") return;

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;

  const secure = isSecureContext() ? "; Secure" : "";

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${secure}`;
}
