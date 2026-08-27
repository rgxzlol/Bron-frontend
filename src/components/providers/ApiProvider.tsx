"use client";

import { useEffect } from "react";
import { onStoreHydrated } from "@/lib/store/persist";
import { setTokenGetter } from "@/lib/api/token";
import { setAuthCookie } from "@/lib/auth/session";
import { useAuthStore } from "@/store/auth.store";
import { useProfileStore } from "@/store/profile.store";
import { useBusinessStore } from "@/store/business.store";
import { useBookingStore } from "@/store/booking.store";

export default function ApiProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const hydrateProfile = useProfileStore((state) => state.hydrateFromApi);
  const fetchBusinessesFromApi = useBusinessStore((state) => state.fetchBusinessesFromApi);
  const clearBusinesses = useBusinessStore((state) => state.clearBusinesses);
  const fetchMyBookings = useBookingStore((state) => state.fetchMyBookings);

  useEffect(() => {
    setTokenGetter(() => useAuthStore.getState().token);

    function syncAuthCookie() {
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        setAuthCookie(currentToken);
      }
    }

    return onStoreHydrated(useAuthStore, syncAuthCookie);
  }, []);

  useEffect(() => {
    if (!token) {
      clearBusinesses();
      return;
    }

    void hydrateProfile();
    void fetchBusinessesFromApi();
    void fetchMyBookings();
  }, [token, hydrateProfile, fetchBusinessesFromApi, clearBusinesses, fetchMyBookings]);

  return children;
}
