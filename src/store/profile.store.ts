import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usersApi } from "@/lib/api";
import { mapApiLanguage, mapProfileLanguage } from "@/lib/api/mappers";
import { getAuthToken } from "@/lib/api/token";

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

type ProfileState = {
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  language: ProfileLanguage;
  theme: ProfileTheme;
  notifications: NotificationSettings;
  paymentHistory: PaymentHistoryItem[];
  updatePersonalInfo: (payload: {
    fullName: string;
    phone: string;
    email: string;
  }) => void;
  setAvatarUrl: (avatarUrl: string | null) => void;
  setLanguage: (language: ProfileLanguage) => void;
  setTheme: (theme: ProfileTheme) => void;
  toggleNotification: (key: keyof NotificationSettings) => void;
  hydrateFromApi: () => Promise<void>;
  savePersonalInfoToApi: (payload: {
    fullName: string;
    phone: string;
    email: string;
  }) => Promise<void>;
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
    (set) => ({
      fullName: "Иван Иванович",
      phone: "+998 99 999 99 99",
      email: "bron@gmail.com",
      avatarUrl: null,
      language: "ru",
      theme: "light",
      notifications: DEFAULT_NOTIFICATIONS,
      paymentHistory: DEFAULT_PAYMENT_HISTORY,

      updatePersonalInfo: ({ fullName, phone, email }) =>
        set({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        }),

      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

      setLanguage: (language) => {
        set({ language });
        const token = getAuthToken();
        if (!token) return;
        void usersApi.updateProfile({ language: mapProfileLanguage(language) }, token);
      },

      setTheme: (theme) => set({ theme }),

      toggleNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),

      hydrateFromApi: async () => {
        const token = getAuthToken();
        if (!token) return;

        const profile = await usersApi.getProfile(token);
        set({
          fullName: profile.username,
          phone: profile.phone,
          email: profile.email,
          language: mapApiLanguage(profile.language),
        });
      },

      savePersonalInfoToApi: async ({ fullName, phone, email }) => {
        const token = getAuthToken();
        if (!token) {
          set({
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
          });
          return;
        }

        const profile = await usersApi.updateProfile(
          {
            phone: phone.trim(),
            email: email.trim(),
          },
          token,
        );

        set({
          fullName: fullName.trim() || profile.username,
          phone: profile.phone,
          email: profile.email,
        });
      },
    }),
    {
      name: "profile-storage",
      version: 3,
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
