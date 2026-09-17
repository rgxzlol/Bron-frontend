export type TelegramUserProfile = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

type TelegramSignInCallbacks = {
  onSuccess: (profile: TelegramUserProfile) => void;
  onError: (message: string) => void;
};

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (
          options: { bot_id: string; request_access?: boolean },
          callback: (user: TelegramUserProfile | false) => void,
        ) => void;
      };
    };
  }
}

let telegramScriptPromise: Promise<void> | null = null;

function getTelegramBotId() {
  const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID?.trim();
  if (!botId || botId === "your_telegram_bot_id" || botId === "0000000000") {
    return null;
  }

  return botId;
}

function loadTelegramLoginScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Telegram Sign-In доступен только в браузере"));
  }

  if (window.Telegram?.Login) {
    return Promise.resolve();
  }

  if (!telegramScriptPromise) {
    telegramScriptPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById("telegram-login-script");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Не удалось загрузить Telegram Sign-In")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.id = "telegram-login-script";
      script.src = "https://telegram.org/js/telegram-login.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Не удалось загрузить Telegram Sign-In"));
      document.head.appendChild(script);
    });
  }

  return telegramScriptPromise;
}

export function isTelegramSignInConfigured() {
  const oauthUrl = process.env.NEXT_PUBLIC_TELEGRAM_OAUTH_URL?.trim();
  if (oauthUrl) return true;

  return Boolean(getTelegramBotId());
}

export async function signInWithTelegramPopup(callbacks: TelegramSignInCallbacks) {
  const botId = getTelegramBotId();
  if (!botId) {
    callbacks.onError(
      "Telegram OAuth не настроен. Добавьте NEXT_PUBLIC_TELEGRAM_BOT_ID в .env.local и перезапустите приложение.",
    );
    return;
  }

  try {
    await loadTelegramLoginScript();
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error.message : "Не удалось загрузить Telegram Sign-In",
    );
    return;
  }

  return new Promise<void>((resolve) => {
    window.Telegram!.Login.auth({ bot_id: botId, request_access: true }, (user) => {
      if (!user) {
        callbacks.onError("Авторизация через Telegram отменена");
        resolve();
        return;
      }

      callbacks.onSuccess(user);
      resolve();
    });
  });
}
