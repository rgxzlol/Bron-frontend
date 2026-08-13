"use client";

import { TIME_OPTIONS } from "@/lib/business/schedule";
import {
  buildTimeGroupsFromHours,
  groupTimeSlots,
  type TimeGroup,
  type TimePeriodKey,
} from "@/lib/booking/timeSlots";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface TimePickerProps {
  selectedTime: string;
  onSelectedTimeChange: (time: string) => void;
  busySlots?: Set<string>;
  timeGroups?: TimeGroup[];
  disabledSlots?: Set<string>;
}

const DEFAULT_TIME_GROUPS = buildTimeGroupsFromHours("09:00 - 20:00");

const TIME_PERIOD_KEYS: Record<TimePeriodKey, string> = {
  morning: "timePicker.morning",
  day: "timePicker.day",
  evening: "timePicker.evening",
};

export default function TimePicker({
  selectedTime,
  onSelectedTimeChange,
  busySlots = new Set(),
  timeGroups = DEFAULT_TIME_GROUPS,
  disabledSlots = new Set(),
}: TimePickerProps) {
  const { t } = useTranslation();
  const hasSlots = timeGroups.some((group) => group.slots.length > 0);

  return (
    <>
      <div className="">
        <h2 className="text-[20px] font-bold mb-3 text-[var(--text-primary)]">
          Выбрать время
        </h2>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {!hasSlots ? (
            <p className="text-[15px] text-[var(--text-muted)]">
              На выбранный день нет доступного времени
            </p>
          ) : (
            <div className="flex flex-col gap-[15px]">
              {timeGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-[16px] font-bold mb-[12px] text-[var(--text-primary)]">
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-4 gap-x-3 gap-y-3">
                    {group.slots.map((slot) => {
                      const busy = busySlots.has(slot);
                      const disabled = disabledSlots.has(slot);
                      const unavailable = busy || disabled;
                      const selected = selectedTime === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={unavailable}
                          className={`min-w-0 w-full px-10 py-[20px] rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-[16px] font-semibold text-[var(--text-primary)] text-center transition-all duration-200
                        ${unavailable ? "opacity-40 cursor-not-allowed" : "hover:border-[#0a6af7]"}
                        ${selected ? "!bg-[#0a6af7] !border-[#0a6af7] !text-white hover:!bg-[#0856c6]" : ""}
                      `}
                          onClick={() => onSelectedTimeChange(slot)}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function buildDefaultTimeGroups() {
  return groupTimeSlots(
    TIME_OPTIONS.filter((slot) => {
      const [hours] = slot.split(":").map(Number);
      return hours >= 9 && hours < 20;
    }),
  );
}
