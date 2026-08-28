"use client";

import { useEffect } from "react";
import { onStoreHydrated } from "@/lib/store/persist";
import { setTokenGetter } from "@/lib/api/token";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth/session";
import { useAuthStore } from "@/store/auth.store";
import { useBusinessStore } from "@/store/business.store";
import { useBookingStore } from "@/store/booking.store";
import { useProfileStore } from "@/store/profile.store";

export default function ApiProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const fetchBusinessesFromApi = useBusinessStore((state) => state.fetchBusinessesFromApi);
  const clearBusinesses = useBusinessStore((state) => state.clearBusinesses);
  const fetchMyBookings = useBookingStore((state) => state.fetchMyBookings);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);
  const resetProfile = useProfileStore((state) => state.resetProfile);

  useEffect(() => {
    setTokenGetter(() => useAuthStore.getState().token);

    function syncAuthCookie() {
      const currentToken = useAuthStore.getState().token;
      if (currentToken) {
        setAuthCookie(currentToken);
        return;
      }

      clearAuthCookie();
    }

    return onStoreHydrated(useAuthStore, syncAuthCookie);
  }, []);

  useEffect(() => {
    if (!token) {
      clearBusinesses();
      resetProfile();
      return;
    }

    void fetchBusinessesFromApi();
    void fetchMyBookings();
    void fetchProfile();
  }, [
    token,
    fetchBusinessesFromApi,
    clearBusinesses,
    fetchMyBookings,
    fetchProfile,
    resetProfile,
  ]);

  return children;
}
