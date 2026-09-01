"use client";

import { useEffect } from "react";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { onStoreHydrated } from "@/lib/store/persist";
import { setTokenGetter } from "@/lib/api/token";
import { useAuthStore } from "@/store/auth.store";
import { useBusinessStore } from "@/store/business.store";
import { useBookingStore } from "@/store/booking.store";
import { useProfileStore } from "@/store/profile.store";
import { useFavoriteStore } from "@/store/favorite.store";
import { useBusinessApplicationStore } from "@/store/businessApplication.store";
import { useBusinessApplicationApiStore } from "@/store/businessApplicationApi.store";

export default function ApiProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.userId);
  const fetchBusinessesFromApi = useBusinessStore((state) => state.fetchBusinessesFromApi);
  const clearBusinesses = useBusinessStore((state) => state.clearBusinesses);
  const fetchMyBookings = useBookingStore((state) => state.fetchMyBookings);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const loadNotificationsForUser = useProfileStore(
    (state) => state.loadNotificationsForUser,
  );
  const resetProfile = useProfileStore((state) => state.resetProfile);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);
  const resetApplication = useBusinessApplicationStore((state) => state.resetApplication);
  const fetchApplication = useBusinessApplicationApiStore((state) => state.fetchApplication);
  const resetApplicationApi = useBusinessApplicationApiStore((state) => state.reset);

  useEffect(() => {
    setTokenGetter(() => useAuthStore.getState().token);

    async function syncAuthCookie() {
      await restoreSessionFromCookie();
    }

    return onStoreHydrated(useAuthStore, () => {
      void syncAuthCookie();
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      clearBusinesses();
      resetProfile();
      resetApplication();
      resetApplicationApi();
      return;
    }

    void fetchBusinessesFromApi();
    void fetchMyBookings();
    void fetchProfile();
    loadNotificationsForUser(userId);
    void fetchFavorites();
    void fetchApplication();
  }, [
    hydrated,
    token,
    userId,
    fetchBusinessesFromApi,
    clearBusinesses,
    fetchMyBookings,
    fetchProfile,
    loadNotificationsForUser,
    resetProfile,
    fetchFavorites,
    resetApplication,
    fetchApplication,
    resetApplicationApi,
  ]);

  return children;
}
