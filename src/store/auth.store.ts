import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth/session";

type AuthStore = {
  token: string | null;
  userId: number | null;
  username: string | null;
  role: string | null;
  setSession: (payload: {
    token: string;
    userId: number;
    username: string;
    role?: string | null;
  }) => void;
  setRole: (role: string | null) => void;
  clearToken: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      username: null,
      role: null,
      setSession: ({ token, userId, username, role }) => {
        setAuthCookie(token);
        set({ token, userId, username, role: role ?? null });
      },
      setRole: (role) => set({ role }),
      clearToken: () => {
        clearAuthCookie();
        set({ token: null, userId: null, username: null, role: null });
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
