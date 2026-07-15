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
    <div>
      <h2 className="text-[18px] font-bold mb-4 text-[var(--text-primary)]">
        {t("timePicker.title")}
      </h2>
      {!hasSlots ? (
        <p className="text-[15px] text-[var(--text-muted)]">
          {t("timePicker.noSlots")}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {timeGroups.map((group) => (
            <div key={group.periodKey}>
              <h3 className="text-[15px] font-bold mb-[10px] text-[var(--text-primary)]">
                {t(TIME_PERIOD_KEYS[group.periodKey])}
              </h3>
              <div className="flex flex-wrap gap-[10px]">
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
                      className={`min-w-[72px] px-4 py-[10px] rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface-muted)] text-[14px] font-semibold text-[var(--text-primary)] transition-all duration-200
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
  );
}

export function buildDefaultTimeGroups() {
  return groupTimeSlots(TIME_OPTIONS.filter((slot) => {
    const [hours] = slot.split(":").map(Number);
    return hours >= 9 && hours < 20;
  }));
}
