import { ApiError, apiRequest } from "./client";
import type {
  ApiNotification,
  InAppNotification,
  NotificationsResponse,
} from "./types";

export function isNotificationsEndpointUnavailable(error: unknown) {
  if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 502)) {
    return false;
  }
  const detail =
    error.data && typeof error.data === "object"
      ? (error.data as { detail?: unknown }).detail
      : null;
  return (
    typeof detail === "string" &&
    detail.includes("Upstream API returned HTML instead of JSON")
  );
}

export const notificationsApi = {
  list: (token?: string) =>
    apiRequest<NotificationsResponse>("/notifications/?limit=20&offset=0", {
      auth: true,
      token,
    }),

  unreadCount: (token?: string) =>
    apiRequest<{ count: number }>("/notifications/unread-count", {
      auth: true,
      token,
    }),

  markRead: (notificationId: number, token?: string) =>
    apiRequest<ApiNotification>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
      auth: true,
      token,
    }),

  markAllRead: (token?: string) =>
    apiRequest<{ updated: number }>("/notifications/read-all", {
      method: "PATCH",
      auth: true,
      token,
    }),

  remove: (notificationId: number, token?: string) =>
    apiRequest<{ message: string }>(`/notifications/${notificationId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};

export function mapApiNotification(
  notification: ApiNotification,
): InAppNotification {
  return {
    id: String(notification.id),
    type: notification.notification_type,
    time: notification.created_at,
    read: notification.is_read,
    title: notification.title,
    description: notification.message,
    booking_id: notification.booking_id,
  };
}
