import type { UserNotificationSettings } from "@/lib/api/types";

export const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  push: true,
  email: true,
  bookingReminder: true,
  promotions: false,
};

function storageKey(userId: number | null) {
  return userId ? `bron:notifications:${userId}` : "bron:notifications:guest";
}

export function loadNotificationSettings(
  userId: number | null,
): UserNotificationSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserNotificationSettings>;
      return {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...parsed,
      };
    }

    const legacy = localStorage.getItem("profile-storage");
    if (legacy) {
      const parsed = JSON.parse(legacy) as {
        state?: { notifications?: Partial<UserNotificationSettings> };
        notifications?: Partial<UserNotificationSettings>;
      };
      const legacyNotifications =
        parsed.state?.notifications ?? parsed.notifications;

      if (legacyNotifications) {
        const migrated = {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...legacyNotifications,
        };
        saveNotificationSettings(userId, migrated);
        return migrated;
      }
    }

    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export function saveNotificationSettings(
  userId: number | null,
  settings: UserNotificationSettings,
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(settings));
  } catch {
    // Ignore quota / private-mode errors — in-memory state still updates.
  }
}
