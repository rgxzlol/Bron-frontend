import { create } from "zustand";
import { persist } from "zustand/middleware";
import { usersApi } from "@/lib/api/users";
import type { UserNotificationSettings, UserProfile } from "@/lib/api/types";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  saveNotificationSettings,
} from "@/lib/profile/notificationSettingsStorage";
import { useAuthStore } from "@/store/auth.store";
import { toUserFacingEmail } from "@/lib/auth/syntheticEmail";
import { looksLikePhoneUsername } from "@/lib/auth/validation";

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

function resolveDisplayFullName(apiUsername: string, fallbackFullName: string) {
  if (looksLikePhoneUsername(apiUsername)) {
    return fallbackFullName;
  }

  return apiUsername || fallbackFullName;
}

function applyProfileToState(profile: UserProfile, currentFullName: string) {
  return {
    fullName: resolveDisplayFullName(profile.username, currentFullName),
    phone: profile.phone,
    email: toUserFacingEmail(profile.email),
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
  loadNotificationsForUser: (userId: number | null) => void;
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

const DEFAULT_NOTIFICATIONS: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;

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

          set((state) => ({
            ...applyProfileToState(profile, state.fullName),
            avatarUrl: state.avatarUrl,
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

      loadNotificationsForUser: (userId) => {
        set({ notifications: loadNotificationSettings(userId) });
      },

      fetchNotificationSettings: async () => {
        const userId = useAuthStore.getState().userId;
        set({ notifications: loadNotificationSettings(userId) });
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
        const userId = useAuthStore.getState().userId;
        const notifications = get().notifications;
        saveNotificationSettings(userId, notifications);

        const token = useAuthStore.getState().token;
        if (!token) return;

        try {
          await usersApi.updateNotificationSettings(notifications, token);
        } catch {
          // Local storage remains the source of truth.
        }
      },

      toggleNotification: (key) => {
        const userId = useAuthStore.getState().userId;
        const next = {
          ...get().notifications,
          [key]: !get().notifications[key],
        };

        set({ notifications: next });
        saveNotificationSettings(userId, next);

        const token = useAuthStore.getState().token;
        if (!token) return;

        void usersApi.updateNotificationSettings(next, token);
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
            phone: trimmedPhone,
            email: trimmedEmail,
            language: get().language,
          },
          token,
        );

        set((state) => ({
          ...applyProfileToState(updated, trimmedName || state.fullName),
          fullName: trimmedName || state.fullName,
          phone: trimmedPhone || updated.phone,
          email: trimmedEmail || toUserFacingEmail(updated.email),
        }));
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
          email: email === undefined ? state.email : toUserFacingEmail(email),
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
      version: 6,
      partialize: (state) => ({
        fullName: state.fullName,
        phone: state.phone,
        email: state.email,
        avatarUrl: state.avatarUrl,
        language: state.language,
        theme: state.theme,
        paymentHistory: state.paymentHistory,
      }),
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown>;
        const { cards: _cards, ...rest } = state;

        return {
          ...rest,
          fullName: looksLikePhoneUsername(String(rest.fullName ?? ""))
            ? ""
            : String(rest.fullName ?? ""),
          email: toUserFacingEmail(String(rest.email ?? "")),
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
