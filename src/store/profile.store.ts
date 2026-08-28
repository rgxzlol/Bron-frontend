import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usersApi } from "@/lib/api/users";
import type { UserNotificationSettings, UserProfile } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth.store";

export type ProfileLanguage = "ru" | "uz" | "en";
export type ProfileTheme = "light" | "dark";
export type NotificationSettings = UserNotificationSettings;

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
    ...(profile.notification_settings
      ? { notifications: profile.notification_settings }
      : {}),
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
  fetchNotificationSettings: () => Promise<void>;
  setAvatarUrl: (avatarUrl: string | null) => void;
  setLanguage: (language: ProfileLanguage) => void;
  setTheme: (theme: ProfileTheme) => void;
  toggleNotification: (key: keyof NotificationSettings) => void;
  saveNotificationSettings: () => Promise<void>;
  savePersonalInfo: (payload: {
    fullName: string;
    phone: string;
    email: string;
  }) => Promise<void>;
  updatePersonalInfo: (payload: {
    fullName?: string;
    phone?: string;
    email?: string;
  }) => void;
  applyAuthProfile: (payload: {
    fullName?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string | null;
  }) => void;
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
          const [profile, notificationSettings] = await Promise.all([
            usersApi.getProfile(token),
            usersApi.getNotificationSettings(token).catch(() => null),
          ]);

          set((state) => ({
            ...applyProfileToState(profile),
            fullName: profile.username || state.fullName,
            avatarUrl: state.avatarUrl,
            notifications:
              notificationSettings ??
              profile.notification_settings ??
              state.notifications,
            isProfileLoading: false,
          }));
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

      fetchNotificationSettings: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        try {
          const saved = await usersApi.getNotificationSettings(token);
          set({ notifications: saved });
        } catch {
          // Keep the last known local/server state when the request fails.
        }
      },

      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

      setLanguage: (language) => {
        set({ language });

        const token = useAuthStore.getState().token;
        if (!token) return;

        void usersApi.updateProfile({ language }, token).catch(() => {
          // Local persisted language remains the source of truth offline.
        });
      },

      setTheme: (theme) => set({ theme }),

      saveNotificationSettings: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        const notifications = get().notifications;

        try {
          const saved = await usersApi.updateNotificationSettings(notifications, token);
          set({ notifications: saved });
        } catch {
          // Local persisted state remains the source of truth offline.
        }
      },

      toggleNotification: (key) => {
        const token = useAuthStore.getState().token;
        const previous = get().notifications;
        const next = {
          ...previous,
          [key]: !previous[key],
        };

        set({ notifications: next });

        if (!token) return;

        void usersApi
          .updateNotificationSettings(next, token)
          .then((saved) => {
            set({ notifications: saved });
          })
          .catch(() => {
            set({ notifications: previous });
          });
      },

      savePersonalInfo: async ({ fullName, phone, email }) => {
        const token = useAuthStore.getState().token;
        if (!token) {
          throw new Error("Требуется авторизация");
        }

        const trimmedName = fullName.trim();
        const trimmedPhone = phone.trim();
        const trimmedEmail = email.trim();

        const updated = await usersApi.updateProfile(
          {
            username: trimmedName,
            phone: trimmedPhone,
            email: trimmedEmail,
            language: get().language,
          },
          token,
        );

        set({
          ...applyProfileToState(updated),
          fullName: trimmedName || updated.username,
          phone: trimmedPhone || updated.phone,
          email: trimmedEmail || updated.email,
        });
      },

      updatePersonalInfo: ({ fullName, phone, email }) =>
        set((state) => ({
          fullName: fullName ?? state.fullName,
          phone: phone ?? state.phone,
          email: email ?? state.email,
        })),

      applyAuthProfile: ({ fullName, phone, email, avatarUrl }) =>
        set((state) => ({
          fullName: fullName ?? state.fullName,
          phone: phone ?? state.phone,
          email: email ?? state.email,
          avatarUrl: avatarUrl === undefined ? state.avatarUrl : avatarUrl,
        })),

      resetProfile: () =>
        set({
          fullName: "",
          phone: "",
          email: "",
          avatarUrl: null,
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
