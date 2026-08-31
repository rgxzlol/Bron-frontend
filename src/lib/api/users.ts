import { apiRequest } from "./client";
import type {
  ChangePasswordRequest,
  LoginResponse,
  UserNotificationSettings,
  UserProfile,
  UserProfileUpdate,
} from "./types";

const NOTIFICATION_REQUEST_OPTIONS = { auth: true as const, skipDemo: true as const };

export const usersApi = {
  getProfile: (token?: string) =>
    apiRequest<UserProfile>("/users/profile", { auth: true, token }),

  updateProfile: (body: UserProfileUpdate, token?: string) =>
    apiRequest<UserProfile>("/users/profile", {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  getNotificationSettings: async (token?: string) => {
    try {
      return await apiRequest<UserNotificationSettings>(
        "/users/profile/notifications",
        { ...NOTIFICATION_REQUEST_OPTIONS, token },
      );
    } catch {
      try {
        const profile = await apiRequest<UserProfile>("/users/profile", {
          auth: true,
          token,
          skipDemo: true,
        });
        return profile.notification_settings ?? null;
      } catch {
        return null;
      }
    }
  },

  updateNotificationSettings: async (
    body: UserNotificationSettings,
    token?: string,
  ) => {
    try {
      return await apiRequest<UserNotificationSettings>(
        "/users/profile/notifications",
        {
          method: "PUT",
          body,
          ...NOTIFICATION_REQUEST_OPTIONS,
          token,
        },
      );
    } catch {
      try {
        await apiRequest<UserProfile>("/users/profile", {
          method: "PUT",
          body: { notification_settings: body },
          auth: true,
          token,
          skipDemo: true,
        });
      } catch {
        // Local persisted preferences remain the source of truth.
      }
      return body;
    }
  },

  deleteProfile: (token?: string) =>
    apiRequest<unknown>("/users/profile", {
      method: "DELETE",
      auth: true,
      token,
    }),

  changePassword: (body: ChangePasswordRequest, token?: string) =>
    apiRequest<unknown>("/users/change-password", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  connectTelegram: (phone: string) =>
    apiRequest<LoginResponse>("/users/telegram/connect", {
      method: "POST",
      body: { phone },
    }),

  updateTelegramId: (body: UserProfileUpdate, token?: string) =>
    apiRequest<UserProfile>("/users/profile/telegram", {
      method: "PUT",
      body,
      auth: true,
      token,
    }),
};
