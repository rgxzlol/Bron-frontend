export const REMOTE_API_URL = "https://uzbalpha.pythonanywhere.com/api";

/** Browser requests go through Next.js proxy to avoid CORS. */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/backend";
  }

  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    REMOTE_API_URL
  );
}

/** @deprecated Use getApiBaseUrl() for requests */
export const API_BASE_URL = REMOTE_API_URL;
