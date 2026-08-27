"use client";
import { useState } from 'react';
import Image from 'next/image';
import { assets } from '@/lib/assets';
import { useBookingStore } from '@/store/booking.store';
import { useToastStore } from '@/store/toast.store';

interface BookingCancelModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId?: number;
    bookingDate?: string;
}

function formatBookingDate(value?: string) {
    if (!value) return '12 июля 2026';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date
        .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
        .replace(' г.', '');
}

export const BookingCancelModal = ({ isOpen, onClose, bookingId, bookingDate }: BookingCancelModalProps) => {
    const cancelBooking = useBookingStore((state) => state.cancelBooking);
    const showToast = useToastStore((state) => state.showToast);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (bookingId == null) {
            console.warn('BookingCancelModal: нет id брони — отмена невозможна');
            onClose();
            return;
        }
        setIsSubmitting(true);
        try {
            await cancelBooking(bookingId);
            showToast(
                'Бронирование отменено',
                'Запись отменена. Информация обновлена в вашем аккаунте.',
            );
        } catch (error) {
            console.error('Не удалось отменить бронь', error);
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-label="Отменить бронь?"
                className="relative w-full max-w-[360px] rounded-[20px] bg-[var(--bg-surface)] p-[20px] shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть"
                    className="absolute right-[14px] top-[14px] grid h-[36px] w-[36px] place-items-center rounded-full text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--bg-surface-muted)]"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                        <path d="M5 5l14 14M19 5L5 19" />
                    </svg>
                </button>

                <div className="mx-auto mt-[10px] grid h-[76px] w-[76px] place-items-center rounded-full bg-[#fde8e8] text-[#e02424]">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 7h16M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M6 7l1 12.4A2 2 0 0 0 9 21.2h6a2 2 0 0 0 2-1.8L18 7M10 11v6M14 11v6" />
                    </svg>
                </div>

                <h3 className="mt-[14px] text-center text-[20px] font-bold text-[var(--text-primary)]">
                    Отменить бронь?
                </h3>
                <p className="mx-auto mt-[6px] max-w-[260px] text-center text-[14px] font-medium text-[var(--text-secondary)]">
                    Вы уверены что хотите отменить бронь в BronFitness Club
                </p>

                <div className="mt-[16px] flex items-center gap-[12px] rounded-[14px] bg-[var(--bg-surface-muted)] p-[10px]">
                    <div className="relative h-[92px] w-[112px] shrink-0 overflow-hidden rounded-[10px]">
                        <Image src={assets.map.photo1} alt="BronFitness Club" fill className="object-cover" />
                    </div>
                    <div className="flex flex-col gap-[5px]">
                        <span className="text-[15px] font-bold text-[var(--text-primary)]">BronFitness Club</span>
                        <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                            ул. Сайрам 123, Ташкент
                        </span>
                        <span className="flex w-fit items-center gap-[6px] rounded-[8px] bg-[var(--bg-surface)] px-[10px] py-[6px] text-[12px] font-semibold text-[var(--text-primary)]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="5" width="18" height="16" rx="3" />
                                <path d="M3 10h18M8 3v4M16 3v4" />
                            </svg>
                            {formatBookingDate(bookingDate)}
                        </span>
                    </div>
                </div>

                <aside className="mt-[12px] flex items-start gap-[10px] rounded-[12px] bg-[#f0f4ff] p-[12px] dark:bg-[var(--bg-surface-muted)]">
                    <span className="mt-[1px] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[#0a6af7] text-[13px] font-bold text-white" aria-hidden="true">
                        !
                    </span>
                    <p className="text-[13px] font-semibold leading-[1.4] text-[var(--text-primary)]">
                        Средства будут возвращены на ваш счет в течение 3-5 рабочих дней
                    </p>
                </aside>

                <div className="mt-[16px] flex gap-[10px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-[14px] bg-[#0a6af7] py-4 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#0858ce] active:scale-[0.98]"
                    >
                        Не отменять
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="flex-1 rounded-[14px] bg-[#e02424] py-4 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#c81e1e] active:scale-[0.98] disabled:opacity-60"
                    >
                        {isSubmitting ? 'Отмена...' : 'Отменить бронь'}
                    </button>
                </div>
            </section>
        </div>
    );
};
