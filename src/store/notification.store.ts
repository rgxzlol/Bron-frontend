import { create } from "zustand";
import type { InAppNotification } from "@/lib/api/types";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuthStore } from "@/store/auth.store";

type NotificationState = {
  items: InAppNotification[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  deleteReadNotifications: () => Promise<void>;
  resetNotifications: () => void;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchNotifications: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ items: [] });
      return;
    }

    set({ isLoading: true });

    try {
      const items = await notificationsApi.list(token);
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  deleteReadNotifications: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    const previous = get().items;
    set({ items: previous.filter((item) => !item.read) });

    try {
      const items = await notificationsApi.deleteRead(token);
      set({ items });
    } catch {
      set({ items: previous });
    }
  },

  resetNotifications: () => set({ items: [] }),
}));
