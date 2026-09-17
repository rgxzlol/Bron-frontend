import { apiRequest } from "./client";
import type { InAppNotification } from "./types";

export const notificationsApi = {
  list: (token?: string) =>
    apiRequest<InAppNotification[]>("/users/notifications", {
      auth: true,
      token,
    }),

  deleteRead: (token?: string) =>
    apiRequest<InAppNotification[]>("/users/notifications/read", {
      method: "DELETE",
      auth: true,
      token,
    }),
};
