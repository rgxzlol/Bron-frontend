import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { clearAuthCookie, getAuthCookie, setAuthCookie } from "@/lib/auth/session";

let restorePromise: Promise<boolean> | null = null;

export async function restoreSessionFromCookie(): Promise<boolean> {
  const cookieToken = getAuthCookie();
  const storeToken = useAuthStore.getState().token;

  if (storeToken) {
    if (!cookieToken || cookieToken !== storeToken) {
      setAuthCookie(storeToken);
    }
    return true;
  }

  if (!cookieToken) {
    clearAuthCookie();
    return false;
  }

  if (!restorePromise) {
    restorePromise = (async () => {
      try {
        const user = await authApi.me(cookieToken);
        useAuthStore.getState().setSession({
          token: cookieToken,
          userId: user.id,
          username: user.username,
        });
        return true;
      } catch {
        clearAuthCookie();
        useAuthStore.getState().clearToken();
        return false;
      } finally {
        restorePromise = null;
      }
    })();
  }

  return restorePromise;
}
