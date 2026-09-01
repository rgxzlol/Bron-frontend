const FALLBACK_API_URL = "https://uzbalpha.pythonanywhere.com/api";

const DEFAULT_PRODUCTION_HOSTNAMES = ["bron-frontend.vercel.app"];

/** Upstream API used by the Next.js `/backend` proxy and server-side fetches. */
export const REMOTE_API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  FALLBACK_API_URL
).replace(/\/$/, "");

function getConfiguredProductionHostnames() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_HOSTNAME?.trim();
  if (!fromEnv) return DEFAULT_PRODUCTION_HOSTNAMES;

  return fromEnv
    .split(",")
    .map((hostname) => hostname.trim())
    .filter(Boolean);
}

function shouldUseBrowserProxy(hostname: string) {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  ) {
    return true;
  }

  if (hostname.endsWith(".vercel.app")) {
    return !getConfiguredProductionHostnames().includes(hostname);
  }

  return false;
}

/** Browser requests use the proxy on localhost and Vercel preview deployments. */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return REMOTE_API_URL;
  }

  if (shouldUseBrowserProxy(window.location.hostname)) {
    return "/backend";
  }

  return REMOTE_API_URL;
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
