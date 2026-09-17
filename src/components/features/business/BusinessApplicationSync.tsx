"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useBusinessApplicationApiStore } from "@/store/businessApplicationApi.store";

export default function BusinessApplicationSync() {
  const token = useAuthStore((state) => state.token);
  const fetchApplication = useBusinessApplicationApiStore(
    (state) => state.fetchApplication,
  );

  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams(window.location.search);
    const applicationStatus = params.get("applicationStatus");

    if (applicationStatus) {
      const url = new URL(window.location.href);
      url.searchParams.delete("applicationStatus");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    void fetchApplication();
  }, [token, fetchApplication]);

  return null;
}
