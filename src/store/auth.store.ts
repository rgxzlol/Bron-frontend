import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthStore = {
  token: string | null;
  userId: number | null;
  username: string | null;
  setSession: (payload: {
    token: string;
    userId: number;
    username: string;
  }) => void;
  clearToken: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      username: null,
      setSession: ({ token, userId, username }) =>
        set({ token, userId, username }),
      clearToken: () => set({ token: null, userId: null, username: null }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
