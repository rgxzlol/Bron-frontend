"use client";

import { useEffect, useState } from "react";
import { hasStoreHydrated, onStoreHydrated } from "@/lib/store/persist";
import { useAuthStore } from "@/store/auth.store";

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() => hasStoreHydrated(useAuthStore));

  useEffect(() => {
    return onStoreHydrated(useAuthStore, () => setHydrated(true));
  }, []);

  return hydrated;
}
