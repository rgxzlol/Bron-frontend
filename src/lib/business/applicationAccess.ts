"use client";

import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth.store";
import { useBusinessStore } from "@/store/business.store";
import { useBusinessApplicationApiStore } from "@/store/businessApplicationApi.store";
import type { BusinessApplicationStatus } from "@/store/businessApplication.store";

function resolveNavStatus(
  apiStatus: BusinessApplicationStatus,
  hasExistingBusiness: boolean,
  hasPendingBusiness: boolean,
): BusinessApplicationStatus {
  if (apiStatus !== "none") return apiStatus;
  if (hasPendingBusiness) return "pending";
  if (hasExistingBusiness) return "approved";
  return "none";
}

export function useBusinessNavAccess() {
  const token = useAuthStore((state) => state.token);
  const apiStatus = useBusinessApplicationApiStore((state) => state.status);
  const businesses = useBusinessStore((state) => state.businesses);
  const hasLoadedBusinesses = useBusinessStore((state) => state.hasLoadedBusinesses);

  const hasExistingBusiness = businesses.length > 0;
  const isLoggedIn = Boolean(token);
  const hasPendingBusiness = businesses.some(
    (business) => business.approvalStatus === "pending",
  );
  const status = resolveNavStatus(
    apiStatus,
    hasExistingBusiness,
    hasPendingBusiness,
  );

  const isBusinessVisible =
    isLoggedIn &&
    (status === "pending" || status === "approved" || hasExistingBusiness);
  const businessHref = routes.business;

  return {
    hasExistingBusiness,
    hasLoadedBusinesses,
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
