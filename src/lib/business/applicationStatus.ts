import type { BusinessApplicationStatusValue } from "@/lib/api/types";
import type { BusinessApplicationStatus } from "@/store/businessApplication.store";

export function mapApiApplicationStatus(
  status: string | null | undefined,
): BusinessApplicationStatus {
  const normalized = status?.trim().toLowerCase();

  if (
    normalized === "pending" ||
    normalized === "waiting" ||
    normalized === "review" ||
    normalized === "under_review"
  ) {
    return "pending";
  }

  if (normalized === "approved" || normalized === "accepted") {
    return "approved";
  }

  if (normalized === "rejected" || normalized === "declined" || normalized === "cancelled") {
    return "rejected";
  }

  return "none";
}

export function toApiApplicationStatus(
  status: BusinessApplicationStatus,
): BusinessApplicationStatusValue | null {
  if (status === "pending" || status === "approved" || status === "rejected") {
    return status;
  }

  return null;
}
