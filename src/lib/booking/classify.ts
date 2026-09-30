const FINISHED_STATUSES = new Set([
  "finished",
  "completed",
  "cancelled",
  "canceled",
  "past",
  "rejected",
]);

/** Normalize API time values like "14:00", "14:00:00", "14:00:00.978Z". */
export function normalizeBookingTime(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  return `${match[1]}:${match[2]}:${match[3] ?? "00"}`;
}

export function isFinishedBookingStatus(status?: string | null) {
  if (!status) return false;
  return FINISHED_STATUSES.has(status.trim().toLowerCase());
}

/**
 * API booking dates and times are in Uzbekistan time (UTC+05:00).
 */
export function getBookingDateTime(
  booking: {
    booking_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  },
  preferEnd = false,
): Date | null {
  const date = booking.booking_date?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const time =
    normalizeBookingTime(preferEnd ? booking.end_time : booking.start_time) ??
    normalizeBookingTime(preferEnd ? booking.start_time : booking.end_time) ??
    "00:00:00";

  const parsed = new Date(`${date}T${time}+05:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getBookingEndDateTime(booking: {
  booking_date?: string | null;
  end_time?: string | null;
}) {
  const endTime = normalizeBookingTime(booking.end_time);
  if (!endTime) return null;
  return getBookingDateTime(
    {
      booking_date: booking.booking_date,
      end_time: endTime,
    },
    true,
  );
}

/** Past bookings are classified by their scheduled end, not by attendance/status updates. */
export function isPastBooking(
  booking: {
    status?: string | null;
    booking_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
  },
  now = new Date(),
) {
  const end = getBookingEndDateTime(booking);
  return end != null && end.getTime() <= now.getTime();
}

/** Keep business bookings visible through one hour after their scheduled end. */
export function isBusinessBookingVisible(
  booking: {
    booking_date?: string | null;
    end_time?: string | null;
  },
  now = new Date(),
) {
  const end = getBookingEndDateTime(booking);
  if (!end) return true;
  return end.getTime() + 60 * 60 * 1000 > now.getTime();
}

export function compareBookingsByTime(
  a: { booking_date?: string | null; start_time?: string | null },
  b: { booking_date?: string | null; start_time?: string | null },
) {
  const left =
    getBookingDateTime(a)?.getTime() ??
    `${a.booking_date ?? ""}T${normalizeBookingTime(a.start_time) ?? ""}`;
  const right =
    getBookingDateTime(b)?.getTime() ??
    `${b.booking_date ?? ""}T${normalizeBookingTime(b.start_time) ?? ""}`;

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right));
}
