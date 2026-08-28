"use client";
import { useState } from 'react';
import Image from 'next/image';
import { assets } from '@/lib/assets';
import { BookingDropdown } from './BookingDropdown';
import { BookingCancelModal } from './BookingCancelModal';
import { BookingEditModal } from './BookingEditModal';

interface BookingCardProps {
    status?: 'upcoming' | 'past';
    bookingId?: number;
    bookingDate?: string;
    bookingTime?: string;
    totalPrice?: number;
    guestsCount?: number;
}

const ORDER_ITEMS = [
    { name: 'Бронирование зала', price: '80 000 сум', qty: 'X1', icon: 'hall' },
    { name: 'Протеиновый батончик', price: '10 000 сум', qty: 'X1', icon: 'bar' },
    { name: 'Бронирование зала', price: '80 000 сум', qty: 'X1', icon: 'bottle' },
] as const;

function formatBookingDate(value?: string) {
    if (!value) return '12 июля 2026';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date
        .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
        .replace(' г.', '');
}

function formatPrice(value?: number) {
    return value != null ? `${value.toLocaleString('ru-RU')}сум` : '98 000сум';
}

const CalendarIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
);

const ClockIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);

const GuestsIcon = () => (
    <svg width="16" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
        <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M18.5 15.5c1.7.7 2.7 2.2 3 4.5" />
    </svg>
);

const ChevronIcon = ({ className = '' }: { className?: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
        <path d="M6 9l6 6 6-6" />
    </svg>
);

const OrderItemIcon = ({ kind }: { kind: string }) => {
    if (kind === 'bar') {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2.5" y="8.5" width="19" height="7" rx="2" transform="rotate(-12 12 12)" />
                <path d="M8.2 9.6l1 4.6M12 8.8l1 4.6M15.8 8l1 4.6" />
            </svg>
        );
    }
    if (kind === 'bottle') {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 2.5h4M10.5 2.5v3M13.5 2.5v3M9 5.5h6c1 1.5 1.5 2.8 1.5 4.5v9a2.5 2.5 0 0 1-2.5 2.5h-4A2.5 2.5 0 0 1 7.5 19v-9c0-1.7.5-3 1.5-4.5Z" />
                <path d="M7.5 12h9M7.5 16h9" />
            </svg>
        );
    }
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 8.5a4.5 4.5 0 1 1 8 0" />
            <path d="M6.5 8.5h11l1 11a2 2 0 0 1-2 2.2h-9a2 2 0 0 1-2-2.2l1-11Z" />
        </svg>
    );
};

export const BookingCard = ({
    status = 'upcoming',
    bookingId,
    bookingDate,
    bookingTime,
    totalPrice,
    guestsCount = 12,
}: BookingCardProps) => {
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isOrderOpen, setIsOrderOpen] = useState(false);

    const isPast = status === 'past';
    const displayDate = formatBookingDate(bookingDate);
    const displayTime = bookingTime ?? '12:00-13:00';
    const displayPrice = formatPrice(totalPrice);

    return (
        <>
            <article className="flex w-full flex-col rounded-[18px] bg-[var(--bg-surface)] p-[10px]">
                <div className="relative h-[180px] w-full overflow-hidden rounded-[12px] md:h-[210px]">
                    <Image
                        src={assets.map.photo1}
                        alt="BronFitness Club"
                        fill
                        className="object-cover"
                    />
                    <span className="absolute left-[10px] top-[10px] rounded-full bg-[#e7ebfd] px-[12px] py-[6px] text-[13px] font-semibold text-[#4a58fe]">
                        Спорт зал
                    </span>
                    <div className="absolute right-[10px] top-[10px] flex items-center gap-[8px]">
                        {isPast ? (
                            <span className="rounded-full bg-white px-[12px] py-[6px] text-[13px] font-semibold text-[#6b7280]">
                                Завершено
                            </span>
                        ) : (
                            <>
                                <span className="rounded-full bg-[#e7f8ef] px-[12px] py-[6px] text-[13px] font-semibold text-[#00bd08]">
                                    Подтверждено
                                </span>
                                <BookingDropdown
                                    onCancelClick={() => setIsCancelModalOpen(true)}
                                    onEditClick={() => setIsEditModalOpen(true)}
                                />
                            </>
                        )}
                    </div>
                    <span className="absolute bottom-[10px] left-[10px] rounded-[10px] bg-black/60 px-[10px] py-[4px] text-[12px] font-semibold text-white">
                        1/3
                    </span>
                </div>

                <div className="flex flex-col px-[6px] pt-[12px]">
                    <h2 className="text-[20px] font-bold text-[var(--text-primary)]">BronFitness Club</h2>
                    <p className="mt-[2px] text-[13px] font-medium text-[var(--text-secondary)]">
                        ул. Сайрам 123, Ташкент
                    </p>

                    <div className="mt-[12px] flex flex-wrap gap-[8px]">
                        <span className="flex items-center gap-[6px] rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[10px] py-[8px] text-[12px] font-semibold text-[var(--text-primary)]">
                            <CalendarIcon />
                            {displayDate}
                        </span>
                        <span className="flex items-center gap-[6px] rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[10px] py-[8px] text-[12px] font-semibold text-[var(--text-primary)]">
                            <ClockIcon />
                            {displayTime}
                        </span>
                        <span className="flex items-center gap-[6px] rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[10px] py-[8px] text-[12px] font-semibold text-[var(--text-primary)]">
                            <GuestsIcon />
                            {guestsCount} гостей
                        </span>
                    </div>

                    <div className="mt-[14px] flex items-center justify-between gap-[12px]">
                        {isPast ? (
                            <p className="flex items-baseline gap-[10px] text-[15px] font-medium text-[var(--text-primary)]">
                                Итого
                                <strong className="text-[18px] font-bold">{displayPrice}</strong>
                            </p>
                        ) : (
                            <>
                                <div className="flex flex-col">
                                    <span className="text-[14px] font-medium text-[var(--text-primary)]">Итого</span>
                                    <strong className="text-[18px] font-bold text-[var(--text-primary)]">
                                        {displayPrice}
                                    </strong>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCancelModalOpen(true)}
                                    className="rounded-[12px] border border-[var(--border-default)] px-[16px] py-[12px] text-[14px] font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--bg-surface-muted)] active:scale-95"
                                >
                                    Отменить бронь
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-[14px] overflow-hidden rounded-[12px] bg-[var(--bg-surface-muted)]">
                    <button
                        type="button"
                        onClick={() => setIsOrderOpen((prev) => !prev)}
                        aria-expanded={isOrderOpen}
                        className="flex w-full items-center justify-between px-[14px] py-[16px] transition-colors duration-200 hover:bg-[var(--bg-hover,rgba(0,0,0,0.03))]"
                    >
                        <span className="flex items-center gap-[10px]">
                            <Image src={assets.booking.bagIcon} alt="" width={20} height={20} />
                            <span className="text-[15px] font-bold text-[var(--text-primary)]">Состав заказа</span>
                            <span className="text-[14px] font-semibold text-[#0a6af7]">3 товара</span>
                        </span>
                        <span className="text-[var(--text-secondary)]">
                            <ChevronIcon className={`transition-transform duration-200 ${isOrderOpen ? 'rotate-180' : ''}`} />
                        </span>
                    </button>

                    {isOrderOpen && (
                        <ul className="flex flex-col gap-[8px] px-[8px] pb-[10px]">
                            {ORDER_ITEMS.map((item, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-[12px] rounded-[12px] bg-[var(--bg-surface)] p-[10px]"
                                >
                                    <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[10px] bg-[var(--bg-surface-muted)] text-[var(--text-primary)]">
                                        <OrderItemIcon kind={item.icon} />
                                    </span>
                                    <span className="flex grow flex-col">
                                        <span className="text-[14px] font-bold text-[var(--text-primary)]">{item.name}</span>
                                        <span className="text-[13px] font-medium text-[var(--text-secondary)]">{item.price}</span>
                                    </span>
                                    <span className="text-[14px] font-semibold text-[var(--text-primary)]">{item.qty}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </article>

            <BookingCancelModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                bookingId={bookingId}
                bookingDate={bookingDate}
            />
            <BookingEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                bookingId={bookingId}
                bookingDate={bookingDate}
                bookingTime={bookingTime}
            />
        </>
    );
};
