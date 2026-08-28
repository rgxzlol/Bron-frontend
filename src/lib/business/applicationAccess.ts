"use client";

import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth.store";
import { useBusinessStore } from "@/store/business.store";
import {
  useBusinessApplicationStore,
  type BusinessApplicationStatus,
} from "@/store/businessApplication.store";

export function useBusinessNavAccess() {
  const token = useAuthStore((state) => state.token);
  const status = useBusinessApplicationStore((state) => state.status);
  const businessAccessGranted = useBusinessApplicationStore(
    (state) => state.businessAccessGranted,
  );
  const businesses = useBusinessStore((state) => state.businesses);

  const hasExistingBusiness = businesses.length > 0;
  const isLoggedIn = Boolean(token);
  const canAccessBusinessPage =
    isLoggedIn &&
    (hasExistingBusiness ||
      businessAccessGranted ||
      status === "none" ||
      status === "approved" ||
      status === "rejected");

  const isBusinessLocked = isLoggedIn && status === "pending";

  const businessHref =
    status === "pending" ? routes.businessApplication : routes.business;

  return {
    canAccessBusinessPage,
    isBusinessLocked,
    businessHref,
    status,
  };
}

export function shouldRedirectFromBusinessPage(status: BusinessApplicationStatus) {
  if (status === "pending") return routes.businessApplication;
  return null;
}
