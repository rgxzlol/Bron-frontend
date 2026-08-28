import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usersApi } from "@/lib/api/users";
import type { UserProfile } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth.store";

export type ProfileLanguage = "ru" | "uz" | "en";
export type ProfileTheme = "light" | "dark";

export type NotificationSettings = {
  push: boolean;
  email: boolean;
  bookingReminder: boolean;
  promotions: boolean;
};

export type PaymentHistoryItem = {
  id: string;
  title: string;
  reference: string;
  amount: number;
  date: string;
};

function mapApiLanguage(language: string): ProfileLanguage {
  if (language === "uz" || language === "en") return language;
  return "ru";
}

function applyProfileToState(profile: UserProfile) {
  return {
    fullName: profile.username,
    phone: profile.phone,
    email: profile.email,
    language: mapApiLanguage(profile.language),
  };
}

type ProfileState = {
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  language: ProfileLanguage;
  theme: ProfileTheme;
  notifications: NotificationSettings;
  paymentHistory: PaymentHistoryItem[];
  isProfileLoading: boolean;
  profileError: string | null;
  fetchProfile: () => Promise<void>;
  setAvatarUrl: (avatarUrl: string | null) => void;
  setLanguage: (language: ProfileLanguage) => void;
  setTheme: (theme: ProfileTheme) => void;
  toggleNotification: (key: keyof NotificationSettings) => void;
  savePersonalInfo: (payload: {
    phone: string;
    email: string;
  }) => Promise<void>;
  resetProfile: () => void;
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  push: true,
  email: true,
  bookingReminder: true,
  promotions: false,
};

const DEFAULT_PAYMENT_HISTORY: PaymentHistoryItem[] = [
  {
    id: "1",
    title: "Оплата бронирования",
    reference: "123123",
    amount: 80000,
    date: "12 мая 2026",
  },
  {
    id: "2",
    title: "Оплата бронирования",
    reference: "123124",
    amount: 80000,
    date: "10 мая 2026",
  },
];

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      fullName: "",
      phone: "",
      email: "",
      avatarUrl: null,
      language: "ru",
      theme: "light",
      notifications: DEFAULT_NOTIFICATIONS,
      paymentHistory: DEFAULT_PAYMENT_HISTORY,
      isProfileLoading: false,
      profileError: null,

      fetchProfile: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        set({ isProfileLoading: true, profileError: null });

        try {
          const profile = await usersApi.getProfile(token);
          set({
            ...applyProfileToState(profile),
            isProfileLoading: false,
          });
        } catch (error) {
          set({
            isProfileLoading: false,
            profileError:
              error instanceof Error
                ? error.message
                : "Не удалось загрузить профиль",
          });
        }
      },

      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

      setLanguage: (language) => set({ language }),

      setTheme: (theme) => set({ theme }),

      toggleNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),

      savePersonalInfo: async ({ phone, email }) => {
        const token = useAuthStore.getState().token;
        if (!token) {
          throw new Error("Требуется авторизация");
        }

        const updated = await usersApi.updateProfile(
          {
            phone: phone.trim(),
            email: email.trim(),
            language: get().language,
          },
          token,
        );

        set(applyProfileToState(updated));
      },

      resetProfile: () =>
        set({
          fullName: "",
          phone: "",
          email: "",
          isProfileLoading: false,
          profileError: null,
        }),
    }),
    {
      name: "profile-storage",
      version: 4,
      partialize: (state) => ({
        avatarUrl: state.avatarUrl,
        language: state.language,
        theme: state.theme,
        notifications: state.notifications,
        paymentHistory: state.paymentHistory,
      }),
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown>;
        const { cards: _cards, ...rest } = state;

        return {
          ...rest,
          avatarUrl: (rest.avatarUrl as string | null | undefined) ?? null,
          paymentHistory: (
            (rest.paymentHistory as PaymentHistoryItem[] | undefined) ??
            DEFAULT_PAYMENT_HISTORY
          ).map((item, index) => ({
            ...item,
            reference: item.reference ?? `12312${index + 3}`,
          })),
        };
      },
    },
  ),
);
