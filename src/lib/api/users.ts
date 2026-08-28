import { apiRequest } from "./client";
import type {
  ChangePasswordRequest,
  LoginResponse,
  UserNotificationSettings,
  UserProfile,
  UserProfileUpdate,
} from "./types";

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

  getNotificationSettings: (token?: string) =>
    apiRequest<UserNotificationSettings>("/users/profile/notifications", {
      auth: true,
      token,
    }),

  updateNotificationSettings: (
    body: UserNotificationSettings,
    token?: string,
  ) =>
    apiRequest<UserNotificationSettings>("/users/profile/notifications", {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

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
