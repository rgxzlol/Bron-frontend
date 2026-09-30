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
import { reviewsApi } from "@/lib/api/reviews";
import { apiCustomerRatingToStats } from "@/lib/api/mappers";

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

const REGISTERED_NAMES_STORAGE_KEY = "bron-registered-profile-names";
let notificationUpdateQueue: Promise<void> = Promise.resolve();

function mapApiLanguage(language: string): ProfileLanguage {
  if (language === "uz" || language === "en") return language;
  return "ru";
}

function findStoredProfileName(userId: number, username: string) {
  if (typeof window === "undefined") return "";

  try {
    const stored = window.localStorage.getItem(REGISTERED_NAMES_STORAGE_KEY);
    if (!stored) return "";
    const names: unknown = JSON.parse(stored);
    if (!names || typeof names !== "object" || Array.isArray(names)) return "";

    const record = names as Record<string, unknown>;
    const value = record[`id:${userId}`] ?? record[`username:${username.trim()}`];
    return typeof value === "string" ? value.trim() : "";
  } catch {
    return "";
  }
}

function resolveDisplayFullName(
  apiUsername: string,
  fallbackFullName: string,
  userId?: number,
) {
  if (looksLikePhoneUsername(apiUsername)) {
    return fallbackFullName || (userId != null ? findStoredProfileName(userId, apiUsername) : "");
  }

  return apiUsername || fallbackFullName;
}

function applyProfileToState(profile: UserProfile, currentFullName: string) {
  const fullName =
    profile.full_name?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return {
    fullName: resolveDisplayFullName(
      fullName || profile.username,
      currentFullName,
      profile.id,
    ),
    phone: profile.phone,
    email: toUserFacingEmail(profile.email),
    language: mapApiLanguage(profile.language),
  };
}

type ProfileState = {
  fullName: string;
  phone: string;
  email: string;
  rating: number | null;
  ratedBookingsCount: number;
  onTimeCount: number;
  lateCount: number;
  noShowCount: number;
  ratingStatsAvailable: boolean;
  ratingLoading: boolean;
  ratingError: boolean;
  avatarUrl: string | null;
  role: string | null;
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
  toggleNotification: (key: keyof NotificationSettings) => Promise<void>;
  saveNotificationSettings: () => Promise<void>;
  savePersonalInfo: (payload: {
    fullName: string;
    phone: string;
    email: string;
  }) => Promise<void>;
  savePhone: (phone: string) => Promise<void>;
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
      rating: null,
      ratedBookingsCount: 0,
      onTimeCount: 0,
      lateCount: 0,
      noShowCount: 0,
      ratingStatsAvailable: false,
      ratingLoading: false,
      ratingError: false,
      avatarUrl: null,
      role: null,
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
            avatarUrl: profile.avatar ?? null,
            role: profile.role ?? null,
            isProfileLoading: false,
            rating: null,
            ratedBookingsCount: 0,
            onTimeCount: 0,
            lateCount: 0,
            noShowCount: 0,
            ratingStatsAvailable: false,
            ratingLoading: true,
            ratingError: false,
          }));
          try {
            const customerRating = await reviewsApi.getCustomerRating(profile.id, token);
            const stats = apiCustomerRatingToStats(customerRating);
            set({
              rating: stats.rating,
              ratedBookingsCount: stats.evaluatedBookingsCount,
              onTimeCount: stats.onTimeCount,
              lateCount: stats.lateCount,
              noShowCount: stats.noShowCount,
              ratingStatsAvailable: stats.available,
              ratingLoading: false,
            });
          } catch {
            set({ ratingLoading: false, ratingError: true });
          }
        } catch (error) {
          set({
            isProfileLoading: false,
            ratingLoading: false,
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
        const token = useAuthStore.getState().token;
        if (!token) {
          set({ notifications: loadNotificationSettings(userId) });
          return;
        }

        const settings = await usersApi.getNotificationSettings(token);
        set({ notifications: settings });
        saveNotificationSettings(userId, settings);
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

        const saved = await usersApi.updateNotificationSettings(
          notifications,
          token,
        );
        set({ notifications: saved });
        saveNotificationSettings(userId, saved);
      },

      toggleNotification: async (key) => {
        const userId = useAuthStore.getState().userId;
        const previous = get().notifications;
        const next = {
          ...previous,
          [key]: !previous[key],
        };

        set({ notifications: next });
        saveNotificationSettings(userId, next);

        const token = useAuthStore.getState().token;
        if (!token) return;

        const update = notificationUpdateQueue.then(async () => {
          const saved = await usersApi.updateNotificationSettings(
            { [key]: next[key] },
            token,
          );
          const notifications = { ...get().notifications, [key]: saved[key] };
          set({ notifications });
          saveNotificationSettings(userId, notifications);
        });
        notificationUpdateQueue = update.then(
          () => undefined,
          () => undefined,
        );

        try {
          await update;
        } catch (error) {
          const current = get().notifications;
          if (current[key] === next[key]) {
            const notifications = { ...current, [key]: previous[key] };
            set({ notifications });
            saveNotificationSettings(userId, notifications);
          }
          throw error;
        }
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
            first_name: trimmedName.split(/\s+/)[0] ?? "",
            last_name: trimmedName.split(/\s+/).slice(1).join(" "),
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

      savePhone: async (phone) => {
        const token = useAuthStore.getState().token;
        if (!token) {
          throw new Error("Требуется авторизация");
        }

        const trimmedPhone = phone.trim();
        const updated = await usersApi.updateProfile({ phone: trimmedPhone }, token);

        set((state) => ({
          ...state,
          phone: trimmedPhone || updated.phone,
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
          rating: null,
          ratedBookingsCount: 0,
          onTimeCount: 0,
          lateCount: 0,
          noShowCount: 0,
          ratingStatsAvailable: false,
          ratingLoading: false,
          ratingError: false,
          avatarUrl: null,
          role: null,
          isProfileLoading: false,
          profileError: null,
        }),
    }),
    {
      name: "profile-storage",
      version: 8,
      partialize: (state) => ({
        fullName: state.fullName,
        phone: state.phone,
        email: state.email,
        avatarUrl: state.avatarUrl,
        role: state.role,
        language: state.language,
        theme: state.theme,
        paymentHistory: state.paymentHistory,
      }),
      migrate: (persisted) => {
        const rest = { ...(persisted as Record<string, unknown>) };
        [
          "cards",
          "rating",
          "reviewCount",
          "ratedBookingsCount",
          "onTimeCount",
          "lateCount",
          "noShowCount",
          "ratingStatsAvailable",
          "ratingLoading",
          "ratingError",
        ].forEach((key) => delete rest[key]);

        return {
          fullName: looksLikePhoneUsername(String(rest.fullName ?? ""))
            ? ""
            : String(rest.fullName ?? ""),
          phone: String(rest.phone ?? ""),
          email: toUserFacingEmail(String(rest.email ?? "")),
          avatarUrl: typeof rest.avatarUrl === "string" ? rest.avatarUrl : null,
          role: typeof rest.role === "string" ? rest.role : null,
          language: mapApiLanguage(String(rest.language ?? "ru")),
          theme: rest.theme === "dark" ? "dark" : "light",
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
