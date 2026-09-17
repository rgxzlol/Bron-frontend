import { ApiError } from "@/lib/api/client";

export function isMissingBookingTargetError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("business, service or branch not found") ||
    message.includes("service or branch not found")
  );
}

export function isSlotConflictError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 409) return true;

  const message = error.message.toLowerCase();
  return (
    message.includes("slot") ||
    message.includes("no longer available") ||
    message.includes("недоступ") ||
    message.includes("занят") ||
    message.includes("conflict") ||
    message.includes("already booked")
  );
}
