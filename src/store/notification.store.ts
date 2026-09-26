import { create } from "zustand";
import type { InAppNotification } from "@/lib/api/types";
import {
  isNotificationsEndpointUnavailable,
  mapApiNotification,
  notificationsApi,
} from "@/lib/api/notifications";
import { useAuthStore } from "@/store/auth.store";

const reminderTimers = new Map<number, number>();

type NotificationState = {
  items: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hydrateNotifications: () => void;
  fetchNotifications: () => Promise<void>;
  addLocalNotification: (notification: Omit<InAppNotification, "time" | "read">) => void;
  addBookingReminder: (bookingId: number, bookingDate: string, startTime: string) => void;
  removeBookingReminder: (bookingId: number) => void;
  addBookingStatusNotification: (
    bookingId: number,
    status: string,
    bookingDate?: string,
    startTime?: string,
  ) => void;
  fetchUnreadCount: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  resetNotifications: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,

  hydrateNotifications: () => {
    const localItems = loadLocalNotifications();
    set((state) => ({ items: mergeNotifications(state.items, localItems) }));
  },

  fetchNotifications: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ items: [] });
      set({ unreadCount: 0 });
      return;
    }
    if (get().isLoading) return;

    set({ isLoading: true });

    try {
      const response = await notificationsApi.list(token);
      const localItems = loadLocalNotifications();
      const items = response.items.map(mapApiNotification);
      set({ items: mergeNotifications(items, localItems), isLoading: false });
    } catch (error) {
      if (isNotificationsEndpointUnavailable(error)) {
        const localItems = loadLocalNotifications();
        set((state) => ({
          items: mergeNotifications(state.items, localItems),
          isLoading: false,
        }));
        return;
      }

      console.error("Не удалось загрузить уведомления:", error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ unreadCount: 0 });
      return;
    }

    try {
      const result = await notificationsApi.unreadCount(token);
      set({ unreadCount: result.count });
    } catch (error) {
      if (isNotificationsEndpointUnavailable(error)) return;
      console.error("Не удалось загрузить количество непрочитанных уведомлений:", error);
    }
  },

  markNotificationRead: async (notificationId) => {
    const token = useAuthStore.getState().token;
    const numericId = Number(notificationId);
    if (token && Number.isInteger(numericId) && numericId > 0) {
      try {
        await notificationsApi.markRead(numericId, token);
      } catch (error) {
        if (!isNotificationsEndpointUnavailable(error)) {
          console.error("Не удалось отметить уведомление прочитанным:", error);
          return;
        }
      }
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
      unreadCount: Math.max(
        0,
        state.unreadCount -
          (state.items.some((item) => item.id === notificationId && !item.read)
            ? 1
            : 0),
      ),
    }));
  },

  markAllNotificationsRead: async () => {
    const token = useAuthStore.getState().token;
    if (token) {
      try {
        await notificationsApi.markAllRead(token);
      } catch (error) {
        if (!isNotificationsEndpointUnavailable(error)) {
          console.error("Не удалось отметить уведомления прочитанными:", error);
          return;
        }
      }
    }

    const next = get().items.map((item) => ({ ...item, read: true }));
    saveLocalNotifications(next.filter((entry) => entry.id.startsWith("local-")));
    set({ items: next, unreadCount: 0 });
  },

  deleteNotification: async (notificationId) => {
    const token = useAuthStore.getState().token;
    const numericId = Number(notificationId);
    if (token && Number.isInteger(numericId) && numericId > 0) {
      try {
        await notificationsApi.remove(numericId, token);
      } catch (error) {
        if (!isNotificationsEndpointUnavailable(error)) {
          console.error("Не удалось удалить уведомление:", error);
          return;
        }
      }
    }

    const item = get().items.find((notification) => notification.id === notificationId);
    const next = get().items.filter((notification) => notification.id !== notificationId);
    saveLocalNotifications(next.filter((entry) => entry.id.startsWith("local-")));
    set({
      items: next,
      unreadCount: Math.max(
        0,
        get().unreadCount - (item && !item.read ? 1 : 0),
      ),
    });
  },

  addLocalNotification: (notification) => {
    const item: InAppNotification = {
      ...notification,
      time: new Date().toISOString(),
      read: false,
    };
    const next = mergeNotifications([item], get().items);
    saveLocalNotifications(next.filter((entry) => entry.id.startsWith("local-")));
    set({ items: next });
  },

  addBookingReminder: (bookingId, bookingDate, startTime) => {
    const reminderId = `local-booking-reminder-${bookingId}`;
    if (get().items.some((item) => item.id === reminderId)) return;

    const bookingTime = new Date(`${bookingDate}T${startTime}:00`).getTime();
    if (!Number.isFinite(bookingTime) || bookingTime <= Date.now()) return;
    const reminderTime = bookingTime - 90 * 60 * 1000;

    const previousTimer = reminderTimers.get(bookingId);
    if (previousTimer != null) {
      window.clearTimeout(previousTimer);
    }

    const schedule = () => {
      const delay = reminderTime - Date.now();
      if (delay <= 0) {
        reminderTimers.delete(bookingId);
        get().addLocalNotification({
          id: reminderId,
          type: "booking",
          title: "Напоминание о бронировании",
          description: `У вас бронирование сегодня в ${startTime}`,
        });
        return;
      }
      const timer = window.setTimeout(schedule, Math.min(delay, 60 * 60 * 1000));
      reminderTimers.set(bookingId, timer);
    };
    schedule();
  },

  removeBookingReminder: (bookingId) => {
    const reminderId = `local-booking-reminder-${bookingId}`;
    const timer = reminderTimers.get(bookingId);
    if (timer != null) {
      window.clearTimeout(timer);
      reminderTimers.delete(bookingId);
    }
    const next = get().items.filter((item) => item.id !== reminderId);
    saveLocalNotifications(next.filter((entry) => entry.id.startsWith("local-")));
    set({ items: next });
  },

  addBookingStatusNotification: (bookingId, status, bookingDate, startTime) => {
    const normalizedStatus = status.toLowerCase();
    const content =
      normalizedStatus === "approved" || normalizedStatus === "accepted"
        ? {
            title: "Бронирование подтверждено",
            description: `Бронь${bookingDate ? ` на ${bookingDate}` : ""}${startTime ? ` в ${startTime}` : ""} подтверждена бизнесом`,
          }
        : normalizedStatus === "cancelled" || normalizedStatus === "rejected"
          ? {
              title: "Бронирование отменено",
              description: `Бизнес отменил вашу бронь${bookingDate ? ` на ${bookingDate}` : ""}${startTime ? ` в ${startTime}` : ""}`,
            }
          : {
              title: "Статус бронирования изменён",
              description: `Статус брони${bookingDate ? ` на ${bookingDate}` : ""} изменён`,
            };

    get().addLocalNotification({
      id: `local-booking-status-${bookingId}-${normalizedStatus}`,
      type: "booking",
      ...content,
    });
  },

  resetNotifications: () => set({ items: [], unreadCount: 0 }),
}));

function localStorageKey() {
  const userId = useAuthStore.getState().userId;
  return `bron:local-notifications:${userId ?? "guest"}`;
}

function loadLocalNotifications(): InAppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(localStorageKey()) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => !isDemoNotification(item)) : [];
  } catch {
    return [];
  }
}

function saveLocalNotifications(items: InAppNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(localStorageKey(), JSON.stringify(items));
}

function mergeNotifications(
  primary: InAppNotification[],
  secondary: InAppNotification[],
) {
  const byId = new Map<string, InAppNotification>();
  [...primary, ...secondary]
    .filter((item) => !isDemoNotification(item))
    .forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
}

function isDemoNotification(item: InAppNotification) {
  return (
    item.id === "booking-1" ||
    item.id === "payment-1" ||
    item.id === "promotion-1"
  );
}
