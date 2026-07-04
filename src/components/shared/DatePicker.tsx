"use client";

import { useMemo } from "react";
import { isDateBeforeDay, isSameDay, startOfDay } from "@/lib/booking/timeSlots";

interface DatePickerProps {
  viewMonth: Date;
  onViewMonthChange: (date: Date) => void;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  today?: Date;
  minDate?: Date;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
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
  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const minSelectableDate = startOfDay(minDate ?? today);

  return (
    <div className="">
      <h2 className="text-[18px] font-bold mb-4 text-[var(--text-primary)]">Выбрать день</h2>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          className="w-9 h-9 rounded-[10px] border border-[var(--border-default)] text-[18px] leading-none flex items-center justify-center hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          onClick={() =>
            onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
          }
          aria-label="Предыдущий месяц"
        >
          ‹
        </button>
        <span className="text-[16px] font-bold capitalize text-[var(--text-primary)]">{getMonthLabel(viewMonth)}</span>
        <button
          type="button"
          className="w-9 h-9 rounded-[10px] border border-[var(--border-default)] text-[18px] leading-none flex items-center justify-center hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          onClick={() =>
            onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
          }
          aria-label="Следующий месяц"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-center text-[12px] font-semibold text-[var(--text-muted)] p-1">
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
