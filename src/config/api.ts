const FALLBACK_API_URL = "https://uzbalpha.pythonanywhere.com/api";

function readEnvUrl(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeApiBaseUrl(value: string) {
  const withoutTrailingSlash = value.replace(/\/+$/, "");

  if (withoutTrailingSlash.endsWith("/api")) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
}

/** Upstream API used by the Next.js `/backend` proxy and server-side fetches. */
export const REMOTE_API_URL = normalizeApiBaseUrl(
  readEnvUrl(process.env.API_URL) ??
    readEnvUrl(process.env.NEXT_PUBLIC_API_URL) ??
    FALLBACK_API_URL,
);

/** Browser requests always go through the Next.js proxy to avoid CORS/env drift. */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return REMOTE_API_URL;
  }

  return "/backend";
}

export function isCrossOriginApiRequest(url: string) {
  if (typeof window === "undefined") return false;

  try {
    const target = new URL(url, window.location.origin);
    return target.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/** @deprecated Use getApiBaseUrl() for requests */
export const API_BASE_URL = REMOTE_API_URL;
