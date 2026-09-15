import { create } from "zustand";
import type { InAppNotification } from "@/lib/api/types";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuthStore } from "@/store/auth.store";

type NotificationState = {
  items: InAppNotification[];
  isLoading: boolean;
  hydrateNotifications: () => void;
  fetchNotifications: () => Promise<void>;
  addLocalNotification: (notification: Omit<InAppNotification, "time" | "read">) => void;
  addBookingReminder: (bookingId: number, bookingDate: string, startTime: string) => void;
  deleteReadNotifications: () => Promise<void>;
  resetNotifications: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  isLoading: false,

  hydrateNotifications: () => {
    const localItems = loadLocalNotifications();
    set((state) => ({ items: mergeNotifications(state.items, localItems) }));
  },

  fetchNotifications: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ items: [] });
      return;
    }

    set({ isLoading: true });

    try {
      const items = await notificationsApi.list(token);
      const localItems = loadLocalNotifications();
      set({ items: mergeNotifications(items, localItems), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
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
    const reminderTime = bookingTime - 24 * 60 * 60 * 1000;
    if (reminderTime <= Date.now()) return;

    const schedule = () => {
      const delay = reminderTime - Date.now();
      if (delay <= 0) {
        get().addLocalNotification({
          id: reminderId,
          type: "booking",
          title: "Напоминание о бронировании",
          description: `Завтра у вас бронирование в ${startTime}`,
        });
        return;
      }
      window.setTimeout(schedule, Math.min(delay, 60 * 60 * 1000));
    };
    schedule();
  },

  deleteReadNotifications: async () => {
    const token = useAuthStore.getState().token;

    // The UI has no separate read action, so every displayed notification is
    // considered read when the user explicitly clears the list.
    saveLocalNotifications([]);
    set({ items: [] });

    if (!token) return;
    await notificationsApi.deleteRead(token).catch(() => undefined);
  },

  resetNotifications: () => set({ items: [] }),
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
