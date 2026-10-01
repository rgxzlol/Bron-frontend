import { apiRequest, apiUploadRequest } from "./client";
import type {
  ChangePasswordRequest,
  LoginResponse,
  UserNotificationSettings,
  UserProfile,
  UserProfileUpdate,
} from "./types";
import { assertApiImage } from "./media";

const NOTIFICATION_REQUEST_OPTIONS = { auth: true as const };

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

  uploadAvatar: (image: File | Blob, token?: string) => {
    assertApiImage(image);
    const formData = new FormData();
    formData.append("image", image);
    return apiUploadRequest<UserProfile>("/users/profile/avatar", formData, {
      auth: true,
      token,
    });
  },

  deleteAvatar: (token?: string) =>
    apiRequest<UserProfile>("/users/profile/avatar", {
      method: "DELETE",
      auth: true,
      token,
    }),

  getNotificationSettings: (token?: string) =>
    apiRequest<UserNotificationSettings>(
      "/users/profile/notifications",
      { ...NOTIFICATION_REQUEST_OPTIONS, token },
    ),

  updateNotificationSettings: async (
    body: Partial<UserNotificationSettings>,
    token?: string,
  ) =>
    apiRequest<UserNotificationSettings>(
      "/users/profile/notifications",
      {
        method: "PUT",
        body,
        ...NOTIFICATION_REQUEST_OPTIONS,
        token,
      },
    ),

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
