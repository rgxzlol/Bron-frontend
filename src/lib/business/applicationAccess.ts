"use client";

import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth.store";
import {
  useBusinessApplicationStore,
  type BusinessApplicationStatus,
} from "@/store/businessApplication.store";

export function useBusinessNavAccess() {
  const token = useAuthStore((state) => state.token);
  const status = useBusinessApplicationStore((state) => state.status);

  const isLoggedIn = Boolean(token);

  const showBusinessInNav =
    isLoggedIn && (status === "pending" || status === "approved");

  const canAccessBusinessPage = isLoggedIn && status === "approved";

  const isBusinessLocked = isLoggedIn && status === "pending";

  const businessHref =
    status === "pending" ? routes.businessApplication : routes.business;

  return {
    showBusinessInNav,
    canAccessBusinessPage,
    isBusinessLocked,
    businessHref,
    status,
  };
}

export function shouldRedirectFromBusinessPage(
  status: BusinessApplicationStatus,
  canAccessBusinessPage: boolean,
) {
  if (status === "pending") return routes.businessApplication;
  if (!canAccessBusinessPage) return routes.home;
  return null;
}
