import { TIME_OPTIONS } from "@/lib/business/schedule";

export type TimePeriodKey = "morning" | "day" | "evening";

export type TimeGroup = {
  periodKey: TimePeriodKey;
  slots: string[];
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function parseHoursRange(hours: string) {
  const match = hours.match(/(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/);
  if (!match) return null;
  return { open: match[1], close: match[2] };
}

export function buildTimeSlots(
  openTime: string,
  closeTime: string,
  options: string[] = TIME_OPTIONS,
) {
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);

  return options.filter((slot) => {
    const minutes = timeToMinutes(slot);
    return minutes >= open && minutes < close;
  });
}

export function groupTimeSlots(slots: string[]): TimeGroup[] {
  const morning = slots.filter((slot) => timeToMinutes(slot) < 12 * 60);
  const day = slots.filter(
    (slot) =>
      timeToMinutes(slot) >= 12 * 60 && timeToMinutes(slot) < 17 * 60,
  );
  const evening = slots.filter((slot) => timeToMinutes(slot) >= 17 * 60);

  return [
    morning.length ? { periodKey: "morning" as const, slots: morning } : null,
    day.length ? { periodKey: "day" as const, slots: day } : null,
    evening.length ? { periodKey: "evening" as const, slots: evening } : null,
  ].filter((group): group is TimeGroup => group != null);
}

export function buildTimeGroupsFromHours(hours: string) {
  const range = parseHoursRange(hours);
  if (!range) {
    return groupTimeSlots(buildTimeSlots("09:00", "20:00"));
  }

  const slots = buildTimeSlots(range.open, range.close);
  return groupTimeSlots(slots.length > 0 ? slots : buildTimeSlots("09:00", "20:00"));
}

export function getAvailableSlotsForDate(
  allSlots: string[],
  date: Date,
  now = new Date(),
) {
  if (!isSameDay(date, now)) return allSlots;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return allSlots.filter((slot) => timeToMinutes(slot) >= nowMinutes);
}

export function getDefaultBookingTime(
  slots: string[],
  date: Date,
  now = new Date(),
) {
  const available = getAvailableSlotsForDate(slots, date, now);
  if (available.length > 0) return available[0];
  if (slots.length > 0) return slots[0];
  return "09:00";
}

export function isDateBeforeDay(date: Date, minDate: Date) {
  return startOfDay(date).getTime() < startOfDay(minDate).getTime();
}
