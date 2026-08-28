import { ApiError } from "@/lib/api/client";

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
