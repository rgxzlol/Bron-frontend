"use client";

import { useMemo } from "react";
import { isDateBeforeDay, isSameDay, startOfDay } from "@/lib/booking/timeSlots";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface DatePickerProps {
  viewMonth: Date;
  onViewMonthChange: (date: Date) => void;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  today?: Date;
  minDate?: Date;
}

function buildCalendarDays(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: { date: Date; inMonth: boolean }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month, -i),
      inMonth: false,
    });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), inMonth: true });
  }

  while (days.length % 7 !== 0) {
    const next = days.length - startOffset - lastDay.getDate() + 1;
    days.push({
      date: new Date(year, month + 1, next),
      inMonth: false,
    });
  }

  return days;
}

export default function DatePicker({
  viewMonth,
  onViewMonthChange,
  selectedDate,
  onSelectedDateChange,
  today = new Date(),
  minDate,
}: DatePickerProps) {
  const { t, locale } = useTranslation();
  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const minSelectableDate = startOfDay(minDate ?? today);

  const weekdays = useMemo(
    () => [
      t("datePicker.mon"),
      t("datePicker.tue"),
      t("datePicker.wed"),
      t("datePicker.thu"),
      t("datePicker.fri"),
      t("datePicker.sat"),
      t("datePicker.sun"),
    ],
    [t],
  );

  const monthLabel = viewMonth.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="">
      <h2 className="text-[18px] font-bold mb-4 text-[var(--text-primary)]">
        {t("datePicker.title")}
      </h2>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          className="w-9 h-9 rounded-[10px] border border-[var(--border-default)] text-[18px] leading-none flex items-center justify-center hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          onClick={() =>
            onViewMonthChange(
              new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
            )
          }
          aria-label={t("datePicker.prevMonth")}
        >
          ‹
        </button>
        <span className="text-[16px] font-bold capitalize text-[var(--text-primary)]">
          {monthLabel}
        </span>
        <button
          type="button"
          className="w-9 h-9 rounded-[10px] border border-[var(--border-default)] text-[18px] leading-none flex items-center justify-center hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          onClick={() =>
            onViewMonthChange(
              new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
            )
          }
          aria-label={t("datePicker.nextMonth")}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day) => (
          <span
            key={day}
            className="text-center text-[12px] font-semibold text-[var(--text-muted)] p-1"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[6px] mb-7 justify-items-center">
        {calendarDays.map(({ date, inMonth }) => {
          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const isDisabled =
            !inMonth || isDateBeforeDay(date, minSelectableDate);

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={`aspect-square w-[44px] h-[44px] max-h-[44px] rounded-full text-[14px] font-semibold flex items-center justify-center transition-all duration-200
                ${!inMonth ? "text-[var(--text-muted)] opacity-50 cursor-not-allowed" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}
                ${isDisabled && inMonth ? "opacity-40 cursor-not-allowed hover:bg-transparent" : ""}
                ${selected ? "!bg-[#0a6af7] !text-white hover:!bg-[#0856c6]" : ""}
                ${isToday && !selected ? "border-2 border-[#0a6af7]" : ""}
              `}
              onClick={() => !isDisabled && onSelectedDateChange(date)}
              disabled={isDisabled}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
