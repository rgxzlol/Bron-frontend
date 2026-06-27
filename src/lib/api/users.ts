import { apiRequest } from "./client";
import type { LoginResponse, UserProfile, UserProfileUpdate } from "./types";

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
