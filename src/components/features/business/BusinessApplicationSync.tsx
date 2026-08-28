"use client";

import { useEffect } from "react";
import { useBusinessApplicationStore } from "@/store/businessApplication.store";

export default function BusinessApplicationSync() {
  const setApplicationStatus = useBusinessApplicationStore(
    (state) => state.setApplicationStatus,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const applicationStatus = params.get("applicationStatus");

    if (applicationStatus === "approved" || applicationStatus === "rejected") {
      setApplicationStatus(applicationStatus);
    }

    if (applicationStatus) {
      const url = new URL(window.location.href);
      url.searchParams.delete("applicationStatus");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [setApplicationStatus]);

  return null;
}
