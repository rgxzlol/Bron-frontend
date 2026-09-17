const GOOGLE_OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const TELEGRAM_OAUTH_BASE = "https://oauth.telegram.org/auth";

export const TELEGRAM_AUTH_BOT = {
  username: "vs007_testdevbot",
  href: "https://t.me/vs007_testdevbot",
} as const;

export function openTelegramAuthBot() {
  if (typeof window === "undefined") return;
  window.open(TELEGRAM_AUTH_BOT.href, "_blank", "noopener,noreferrer");
}

export type OAuthStartResult =
  | { ok: true }
  | { ok: false; error: string; fallback?: "telegram-form" };

function getAuthRedirectUri() {
  const configured = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (configured) {
    return configured;
  }

  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/auth/google/callback`;
}

function isPlaceholder(value: string | undefined) {
  if (!value) return true;

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "your_google_client_id" ||
    normalized === "your_telegram_bot_id" ||
    normalized === "0000000000"
  );
}

export function isGoogleOAuthConfigured() {
  const oauthUrl = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL?.trim();
  if (oauthUrl) return true;

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return !isPlaceholder(clientId);
}

export function isTelegramOAuthConfigured() {
  const oauthUrl = process.env.NEXT_PUBLIC_TELEGRAM_OAUTH_URL?.trim();
  if (oauthUrl) return true;

  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID?.trim();
  return !isPlaceholder(botId);
}

export function getGoogleOAuthUrl() {
  const configured = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL?.trim();
  if (configured) {
    return configured;
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (isPlaceholder(clientId) || !clientId) {
    throw new Error("Google OAuth is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getAuthRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });

  return `${GOOGLE_OAUTH_BASE}?${params.toString()}`;
}

export function getTelegramOAuthUrl() {
  const configured = process.env.NEXT_PUBLIC_TELEGRAM_OAUTH_URL?.trim();
  if (configured) {
    return configured;
  }

  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID?.trim();
  if (isPlaceholder(botId) || !botId) {
    throw new Error("Telegram OAuth is not configured");
  }

  const params = new URLSearchParams({
    bot_id: botId,
    origin: typeof window !== "undefined" ? window.location.origin : "",
    request_access: "write",
  });

  return `${TELEGRAM_OAUTH_BASE}?${params.toString()}`;
}

export function startGoogleOAuth(): OAuthStartResult {
  if (!isGoogleOAuthConfigured()) {
    return {
      ok: false,
      error:
        "Вход через Google не настроен. Добавьте NEXT_PUBLIC_GOOGLE_CLIENT_ID в .env.local и перезапустите приложение.",
    };
  }

  window.location.assign(getGoogleOAuthUrl());
  return { ok: true };
}

export function startTelegramOAuth(): OAuthStartResult {
  if (!isTelegramOAuthConfigured()) {
    return {
      ok: false,
      error: "Telegram OAuth не настроен. Открыта форма входа через Telegram.",
      fallback: "telegram-form",
    };
  }

  const popup = window.open(
    getTelegramOAuthUrl(),
    "telegram_oauth",
    "width=550,height=470,scrollbars=yes,resizable=yes",
  );

  if (!popup) {
    window.location.assign(getTelegramOAuthUrl());
  }

  return { ok: true };
}
