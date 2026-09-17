type GoogleUserProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

type GoogleSignInCallbacks = {
  onSuccess: (profile: GoogleUserProfile) => void;
  onError: (message: string) => void;
};

type TokenClientCallbackResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenClientCallbackResponse) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

let gsiLoadPromise: Promise<void> | null = null;

function getGoogleClientId() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!clientId || clientId === "your_google_client_id") {
    return null;
  }

  return clientId;
}

function loadGoogleIdentityServices() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Sign-In доступен только в браузере"));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (!gsiLoadPromise) {
    gsiLoadPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById("google-gsi-client");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Не удалось загрузить Google Sign-In")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Не удалось загрузить Google Sign-In"));
      document.head.appendChild(script);
    });
  }

  return gsiLoadPromise;
}

async function fetchGoogleProfile(accessToken: string): Promise<GoogleUserProfile> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Не удалось получить профиль Google");
  }

  const user = (await response.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  if (!user.email) {
    throw new Error("Google не вернул email аккаунта");
  }

  return {
    sub: user.sub ?? user.email,
    email: user.email,
    name: user.name ?? user.email,
    picture: user.picture,
  };
}

export function getGoogleOAuthSetupHint() {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return `Добавьте ${origin} в Authorized JavaScript origins в Google Cloud Console.`;
}

export async function signInWithGooglePopup(callbacks: GoogleSignInCallbacks) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    callbacks.onError(
      "Вход через Google не настроен. Добавьте NEXT_PUBLIC_GOOGLE_CLIENT_ID в .env.local и перезапустите приложение.",
    );
    return;
  }

  try {
    await loadGoogleIdentityServices();
  } catch (error) {
    callbacks.onError(
      error instanceof Error ? error.message : "Не удалось загрузить Google Sign-In",
    );
    return;
  }

  return new Promise<void>((resolve) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: async (response) => {
        if (response.error) {
          callbacks.onError(
            response.error_description ??
              response.error ??
              "Не удалось войти через Google",
          );
          resolve();
          return;
        }

        if (!response.access_token) {
          callbacks.onError("Google не вернул токен доступа");
          resolve();
          return;
        }

        try {
          const profile = await fetchGoogleProfile(response.access_token);
          callbacks.onSuccess(profile);
        } catch (error) {
          callbacks.onError(
            error instanceof Error ? error.message : "Ошибка входа через Google",
          );
        } finally {
          resolve();
        }
      },
      error_callback: (error) => {
        const message = error.message ?? "Ошибка Google OAuth";
        if (
          message.includes("origin") ||
          message.includes("client") ||
          message.includes("invalid")
        ) {
          callbacks.onError(
            `${message}. ${getGoogleOAuthSetupHint()}`,
          );
        } else {
          callbacks.onError(message);
        }
        resolve();
      },
    });

    client.requestAccessToken({ prompt: "select_account" });
  });
}
