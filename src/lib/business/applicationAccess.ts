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
  const hasLoadedBusinesses = useBusinessStore((state) => state.hasLoadedBusinesses);

  const hasExistingBusiness = businesses.length > 0;
  const isLoggedIn = Boolean(token);
  const status = resolveNavStatus(apiStatus, hasExistingBusiness);

  const isBusinessVisible =
    isLoggedIn &&
    (status === "pending" || status === "approved" || hasExistingBusiness);
  const isBusinessLocked = status === "pending" && !hasExistingBusiness;
  const canAccessBusinessPage = status === "approved" || hasExistingBusiness;

  const businessHref =
    status === "pending" && !hasExistingBusiness
      ? routes.businessApplication
      : routes.business;

  return {
    canAccessBusinessPage,
    hasExistingBusiness,
    hasLoadedBusinesses,
    isBusinessLocked,
    isBusinessVisible,
    businessHref,
    status,
  };
}

export function shouldRedirectFromBusinessPage(
  status: BusinessApplicationStatus,
  hasExistingBusiness: boolean,
  hasLoadedBusinesses: boolean,
) {
  if (status === "pending" && hasLoadedBusinesses && !hasExistingBusiness) {
    return routes.businessApplication;
  }
  return null;
}
