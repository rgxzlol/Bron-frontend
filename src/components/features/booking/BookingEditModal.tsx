"use client";
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { assets } from '@/lib/assets';
import DatePicker from '@/components/shared/DatePicker';
import { useBookingStore } from '@/store/booking.store';
import { useToastStore } from '@/store/toast.store';
import {
  buildTimeGroupsFromHours,
  getAvailableSlotsForDate,
  getDefaultBookingTime,
  isDateBeforeDay,
  startOfDay,
} from '@/lib/booking/timeSlots';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface BookingEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    hours?: string;
    bookingId?: number;
    bookingDate?: string;
    bookingTime?: string;
}

function formatSelectedDate(date: Date) {
    return date
        .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
        .replace(' г.', '');
}

function parseInitialDate(value: string | undefined, today: Date) {
    if (value) {
        const parsed = new Date(`${value}T12:00:00`);
        if (!Number.isNaN(parsed.getTime()) && !isDateBeforeDay(parsed, today)) {
            return startOfDay(parsed);
        }
    }
    return today;
}

function toIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addHourToTime(time: string) {
    const match = time.match(/^(\d{2}):(\d{2})/);
    if (!match) return time;
    const totalMinutes = Number(match[1]) * 60 + Number(match[2]) + 60;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export const BookingEditModal = ({
    isOpen,
    onClose,
    hours = "10:00 - 23:00",
    bookingId,
    bookingDate,
    bookingTime,
}: BookingEditModalProps) => {
    const { t } = useTranslation();
    const rescheduleBooking = useBookingStore((state) => state.rescheduleBooking);
    const showToast = useToastStore((state) => state.showToast);
    const today = useMemo(() => startOfDay(new Date()), []);
    const [viewMonth, setViewMonth] = useState(() => parseInitialDate(bookingDate, startOfDay(new Date())));
    const [selectedDate, setSelectedDate] = useState(() => parseInitialDate(bookingDate, startOfDay(new Date())));
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const timeGroups = useMemo(() => buildTimeGroupsFromHours(hours), [hours]);
    const allTimeSlots = useMemo(
      () => timeGroups.flatMap((group) => group.slots),
      [timeGroups],
    );
    // В макете — сетка часовых слотов, поэтому показываем только "ровные" часы
    const displaySlots = useMemo(
      () => allTimeSlots.filter((slot) => slot.endsWith(':00')),
      [allTimeSlots],
    );

    const [selectedTime, setSelectedTime] = useState(() => {
      const match = bookingTime?.match(/^\d{2}:\d{2}/);
      if (match) return match[0];
      const slots = buildTimeGroupsFromHours(hours)
        .flatMap((group) => group.slots)
        .filter((slot) => slot.endsWith(':00'));
      return getDefaultBookingTime(slots, startOfDay(new Date()), new Date());
    });

    const disabledTimeSlots = useMemo(() => {
      const available = getAvailableSlotsForDate(displaySlots, selectedDate, new Date());
      const availableSet = new Set(available);
      return new Set(displaySlots.filter((slot) => !availableSet.has(slot)));
    }, [displaySlots, selectedDate]);

    useEffect(() => {
      if (!isOpen) return;

      const nextDate = parseInitialDate(bookingDate, today);
      setViewMonth(nextDate);
      setSelectedDate(nextDate);

      const match = bookingTime?.match(/^\d{2}:\d{2}/);
      if (match) {
        setSelectedTime(match[0]);
      }
    }, [bookingDate, bookingTime, isOpen, today]);

    useEffect(() => {
      if (!isOpen) return;

      const available = getAvailableSlotsForDate(displaySlots, selectedDate, new Date());
      if (available.length > 0 && !available.includes(selectedTime)) {
        setSelectedTime(getDefaultBookingTime(displaySlots, selectedDate, new Date()));
      }
    }, [displaySlots, isOpen, selectedDate, selectedTime]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (bookingId == null) {
            console.warn('BookingEditModal: нет id брони — изменения не сохранены');
            onClose();
            return;
        }
        setIsSaving(true);
        try {
            const endTime = addHourToTime(selectedTime);
            await rescheduleBooking(bookingId, {
                booking_date: toIsoDate(selectedDate),
                start_time: selectedTime,
                end_time: endTime,
            });
            showToast(t('bookingsEdit.updatedToast'), t('bookingsEdit.updatedToastDesc'));
        } catch (error) {
            console.warn('Не удалось сохранить изменения брони', error);
        } finally {
            setIsSaving(false);
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={onClose}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-label={t('bookingsEdit.editLabel')}
                className="flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-[20px] bg-[var(--bg-surface)] px-[16px] pb-[20px] pt-[10px] shadow-lg sm:max-w-[420px] sm:rounded-[20px] sm:p-[20px]"
                onClick={(e) => e.stopPropagation()}
                data-testid={
                    bookingId != null ? `booking-edit-modal-${bookingId}` : "booking-edit-modal"
                }
            >
                <span className="mx-auto mb-[10px] h-[5px] w-[48px] shrink-0 rounded-full bg-[var(--border-default)] sm:hidden" aria-hidden="true" />

                <div className="flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-[var(--text-primary)]">{t('bookingsEdit.editLabel')}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.close')}
                        className="grid h-[36px] w-[36px] place-items-center rounded-full text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--bg-surface-muted)]"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                            <path d="M5 5l14 14M19 5L5 19" />
                        </svg>
                    </button>
                </div>

                <div className="mt-[14px] flex items-center gap-[12px]">
                    <div className="relative h-[76px] w-[128px] shrink-0 overflow-hidden rounded-[12px]">
                        <Image src={assets.map.photo1} alt="BronFitness Club" fill className="object-cover" />
                    </div>
                    <div className="flex flex-col gap-[4px]">
                        <span className="w-fit rounded-full bg-[#e7ebfd] px-[10px] py-[4px] text-[12px] font-semibold text-[#4a58fe]">
                            Спорт зал
                        </span>
                        <span className="text-[16px] font-bold text-[var(--text-primary)]">BronFitness Club</span>
                        <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                            ул. Сайрам 123, Ташкент
                        </span>
                    </div>
                </div>

                <p className="mt-[18px] text-[14px] font-semibold text-[var(--text-primary)]">Выберите дату</p>
                <button
                    type="button"
                    onClick={() => setIsDateOpen((prev) => !prev)}
                    aria-expanded={isDateOpen}
                    className="mt-[8px] flex w-full items-center gap-[10px] rounded-[12px] border-[1.5px] border-[#0a6af7] px-[14px] py-[13px] text-[#0a6af7] transition-colors duration-200 hover:bg-[#f0f4ff] dark:hover:bg-[var(--bg-surface-muted)]"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="16" rx="3" />
                        <path d="M3 10h18M8 3v4M16 3v4" />
                    </svg>
                    <span className="grow text-left text-[15px] font-semibold">{formatSelectedDate(selectedDate)}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-200 ${isDateOpen ? 'rotate-90' : ''}`}>
                        <path d="M9 6l6 6-6 6" />
                    </svg>
                </button>

                {isDateOpen && (
                    <div className="mt-[10px] rounded-[14px] border border-[var(--border-default)] p-[12px]">
                        <DatePicker
                            viewMonth={viewMonth}
                            onViewMonthChange={setViewMonth}
                            selectedDate={selectedDate}
                            onSelectedDateChange={(date) => {
                                setSelectedDate(date);
                                setIsDateOpen(false);
                            }}
                            today={today}
                            minDate={today}
                        />
                    </div>
                )}

                <p className="mt-[16px] text-[14px] font-semibold text-[var(--text-primary)]">Выбери время</p>
                <div className="mt-[10px] grid grid-cols-4 gap-[8px]" data-testid="booking-edit-time-slots">
                    {displaySlots.map((slot) => {
                        const disabled = disabledTimeSlots.has(slot);
                        const selected = selectedTime === slot;
                        return (
                            <button
                                key={slot}
                                type="button"
                                disabled={disabled}
                                onClick={() => setSelectedTime(slot)}
                                className={`rounded-[10px] py-[12px] text-center text-[14px] font-semibold transition-colors duration-200
                                    ${selected
                                        ? 'bg-[#0a6af7] text-white'
                                        : 'bg-[var(--bg-surface-muted)] text-[var(--text-primary)] hover:bg-[#e8edfb] dark:hover:bg-[var(--bg-hover)]'}
                                    ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                                data-testid={`booking-edit-time-${slot.replace(':', '-')}`}
                            >
                                {slot}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="mt-[20px] w-full rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition-colors duration-200 hover:bg-[#0858ce] active:scale-[0.99] disabled:opacity-60"
                    data-testid={
                        bookingId != null
                            ? `booking-edit-save-${bookingId}`
                            : "booking-edit-save"
                    }
                >
                    {isSaving ? t('common.saving') : t('bookingsEdit.saveChanges')}
                </button>
            </section>
        </div>
    );
};
