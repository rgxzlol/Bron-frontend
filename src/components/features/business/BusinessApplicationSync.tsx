"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useBusinessApplicationStore } from "@/store/businessApplication.store";

export default function BusinessApplicationSync() {
  const token = useAuthStore((state) => state.token);
  const status = useBusinessApplicationStore((state) => state.status);
  const fetchApplicationStatus = useBusinessApplicationStore(
    (state) => state.fetchApplicationStatus,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (!params.get("applicationStatus")) return;

    void fetchApplicationStatus();

    const url = new URL(window.location.href);
    url.searchParams.delete("applicationStatus");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [fetchApplicationStatus]);

  useEffect(() => {
    if (!token || status !== "pending") return;

    const intervalId = window.setInterval(() => {
      void fetchApplicationStatus();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [token, status, fetchApplicationStatus]);

  return null;
}
