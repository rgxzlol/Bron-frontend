"use client";

import { useMemo } from "react";
import { useTranslations } from 'next-intl';

interface DatePickerProps {
  viewMonth: Date;
  onViewMonthChange: (date: Date) => void;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  today?: Date;
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

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DatePicker({
  viewMonth,
  onViewMonthChange,
  selectedDate,
  onSelectedDateChange,
  today = new Date(2026, 5, 2),
}: DatePickerProps) {
  const t = useTranslations('DatePicker');
  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  return (
    <div className="">
      <h2 className="text-[18px] font-bold mb-4 text-black">{t('selectDay')}</h2>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          className="w-9 h-9 rounded-[10px] border border-[#e5e7eb] text-[18px] leading-none flex items-center justify-center hover:border-[#0a6af7] hover:text-[#0a6af7] transition-colors"
          onClick={() =>
            onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
          }
          aria-label={t('prevMonth')}
        >
          ‹
        </button>
        <span className="text-[16px] font-bold capitalize text-black">{getMonthLabel(viewMonth)}</span>
        <button
          type="button"
          className="w-9 h-9 rounded-[10px] border border-[#e5e7eb] text-[18px] leading-none flex items-center justify-center hover:border-[#0a6af7] hover:text-[#0a6af7] transition-colors"
          onClick={() =>
            onViewMonthChange(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
          }
          aria-label={t('nextMonth')}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-center text-[12px] font-semibold text-[#9ca3af] p-1">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[6px] mb-7">
        {calendarDays.map(({ date, inMonth }) => {
          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          return (
            <button
              key={date.toISOString()}
              type="button"
              className={`aspect-square max-h-[44px] rounded-full text-[14px] font-semibold flex items-center justify-center transition-all duration-200
                ${!inMonth ? "text-[#d1d5db] cursor-not-allowed" : "text-[#374151] hover:bg-gray-100"}
                ${selected ? "!bg-[#0a6af7] !text-white hover:!bg-[#0856c6]" : ""}
                ${isToday && !selected ? "border-2 border-[#0a6af7]" : ""}
              `}
              onClick={() => inMonth && onSelectedDateChange(date)}
              disabled={!inMonth}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
