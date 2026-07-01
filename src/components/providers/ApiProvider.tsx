"use client";

import { useEffect } from "react";
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
  const fetchMyBookings = useBookingStore((state) => state.fetchMyBookings);

  useEffect(() => {
    setTokenGetter(() => useAuthStore.getState().token);

    function syncAuthCookie() {
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        setAuthCookie(currentToken);
      }
    }

    if (useAuthStore.persist.hasHydrated()) {
      syncAuthCookie();
      return;
    }

    return useAuthStore.persist.onFinishHydration(syncAuthCookie);
  }, []);

  useEffect(() => {
    if (!token) return;

    void hydrateProfile();
    void fetchBusinessesFromApi();
    void fetchMyBookings();
  }, [token, hydrateProfile, fetchBusinessesFromApi, fetchMyBookings]);

  return children;
}
