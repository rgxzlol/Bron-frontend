"use client";

import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth.store";
import { useBusinessStore } from "@/store/business.store";
import { useBusinessApplicationApiStore } from "@/store/businessApplicationApi.store";
import type { BusinessApplicationStatus } from "@/store/businessApplication.store";

function resolveNavStatus(
  apiStatus: BusinessApplicationStatus,
  hasExistingBusiness: boolean,
): BusinessApplicationStatus {
  if (apiStatus === "none" && hasExistingBusiness) {
    return "approved";
  }

  return apiStatus;
}

export function useBusinessNavAccess() {
  const token = useAuthStore((state) => state.token);
  const apiStatus = useBusinessApplicationApiStore((state) => state.status);
  const businesses = useBusinessStore((state) => state.businesses);

  const hasExistingBusiness = businesses.length > 0;
  const isLoggedIn = Boolean(token);
  const status = resolveNavStatus(apiStatus, hasExistingBusiness);

  const isBusinessVisible =
    isLoggedIn && (status === "pending" || status === "approved");
  const isBusinessLocked = status === "pending";
  const canAccessBusinessPage = status === "approved";

  const businessHref =
    status === "pending" ? routes.businessApplication : routes.business;

  return {
    canAccessBusinessPage,
    isBusinessLocked,
    isBusinessVisible,
    businessHref,
    status,
  };
}

export function shouldRedirectFromBusinessPage(status: BusinessApplicationStatus) {
  if (status === "pending") return routes.businessApplication;
  return null;
}
