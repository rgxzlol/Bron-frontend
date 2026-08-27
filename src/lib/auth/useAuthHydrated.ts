"use client";

import { useEffect, useState } from "react";
import { onStoreHydrated } from "@/lib/store/persist";
import { useAuthStore } from "@/store/auth.store";

export function useAuthHydrated() {
  // Всегда false на первом рендере (и на сервере, и на клиенте),
  // иначе SSR-разметка расходится с клиентской (hydration mismatch).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    return onStoreHydrated(useAuthStore, () => setHydrated(true));
  }, []);

  return hydrated;
}
