"use client";

import { useEffect, useState } from "react";
import { restoreSessionFromCookie } from "@/lib/auth/restoreSession";
import { hasStoreHydrated, onStoreHydrated } from "@/lib/store/persist";
import { useAuthStore } from "@/store/auth.store";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";

export function useAuthReady() {
  const hydrated = useAuthHydrated();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      setSynced(false);
      return;
    }

    let cancelled = false;

    const syncSession = async () => {
      await restoreSessionFromCookie();
      if (!cancelled) {
        setSynced(true);
      }
    };

    if (hasStoreHydrated(useAuthStore)) {
      void syncSession();
      return () => {
        cancelled = true;
      };
    }

    const unsubscribe = onStoreHydrated(useAuthStore, () => {
      void syncSession();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [hydrated]);

  return hydrated && synced;
}
