import { ApiError } from "@/lib/api/client";

export function isMissingBookingTargetError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("business, service or branch not found") ||
    message.includes("service or branch not found") ||
    ((message.includes("not found") || message.includes("does not belong")) &&
      (message.includes("business") ||
        message.includes("service") ||
        message.includes("branch") ||
        message.includes("staff")))
  );
}

export function isSlotConflictError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 409) return true;

  const message = error.message.toLowerCase();
  return (
    message.includes("only ") && message.includes("places left") ||
    message.includes("slot") ||
    message.includes("no longer available") ||
    message.includes("staff member is busy") ||
    message.includes("selected time is not available") ||
    message.includes("booking is already at this time") ||
    message.includes("already at this time") ||
    message.includes("недоступ") ||
    message.includes("занят") ||
    message.includes("conflict") ||
    message.includes("already booked")
  );
}
