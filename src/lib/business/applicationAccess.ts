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
  const userId = useAuthStore((state) => state.userId);
  const storedApiStatus = useBusinessApplicationApiStore((state) => state.status);
  const applicationUserId = useBusinessApplicationApiStore((state) => state.userId);
  const businesses = useBusinessStore((state) => state.businesses);
  const businessesUserId = useBusinessStore((state) => state.businessesUserId);
  const hasLoadedBusinesses = useBusinessStore((state) => state.hasLoadedBusinesses);
  const businessLoadStatus = useBusinessStore((state) => state.businessLoadStatus);

  const hasCurrentBusinesses = businessesUserId === userId;
  const hasExistingBusiness = hasCurrentBusinesses && businesses.length > 0;
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
  businessLoadStatus: "idle" | "loading" | "loaded" | "error",
) {
  if (
    status === "pending" &&
    businessLoadStatus === "loaded" &&
    !hasExistingBusiness
  ) {
    return routes.businessApplication;
  }
  return null;
}
