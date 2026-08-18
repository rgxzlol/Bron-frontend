const FALLBACK_API_URL = "https://uzbalpha.pythonanywhere.com/api";

/** Upstream API used by the Next.js `/backend` proxy and server-side fetches. */
export const REMOTE_API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  FALLBACK_API_URL
).replace(/\/$/, "");

/** Browser requests go through Next.js proxy to avoid CORS. */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/backend";
  }

  return REMOTE_API_URL;
}

/** @deprecated Use getApiBaseUrl() for requests */
export const API_BASE_URL = REMOTE_API_URL;
