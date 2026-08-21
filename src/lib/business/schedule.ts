export type DayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type DaySchedule = {
  key: DayKey;
  label: string;
  shortLabel: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { key: "mon", label: "Понедельник", shortLabel: "Пн", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { key: "tue", label: "Вторник", shortLabel: "Вт", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { key: "wed", label: "Среда", shortLabel: "Ср", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { key: "thu", label: "Четверг", shortLabel: "Чт", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { key: "fri", label: "Пятница", shortLabel: "Пт", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { key: "sat", label: "Суббота", shortLabel: "Сб", isOpen: true, openTime: "09:00", closeTime: "20:00" },
  { key: "sun", label: "Воскресенье", shortLabel: "Вс", isOpen: false, openTime: "00:00", closeTime: "00:00" },
];

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function parseTimeMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function calcWeeklyHours(schedule: DaySchedule[]): number {
  return schedule.reduce((total, day) => {
    if (!day.isOpen) return total;
    const diff = parseTimeMinutes(day.closeTime) - parseTimeMinutes(day.openTime);
    return total + Math.max(0, diff / 60);
  }, 0);
}

export function resetDaySchedule(day: DaySchedule): DaySchedule {
  return { ...day, isOpen: false, openTime: "00:00", closeTime: "00:00" };
}
