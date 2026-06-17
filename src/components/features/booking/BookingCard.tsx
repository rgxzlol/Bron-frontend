"use client";
import { useState } from 'react';
import Image from 'next/image';
import { assets } from '@/lib/assets';
import { formatPrice } from '@/lib/formatPrice';
import { BookingDropdown } from './BookingDropdown';
import { BookingCancelModal } from './BookingCancelModal';
import { BookingEditModal } from './BookingEditModal';

interface BookingCardProps {
    status?: 'upcoming' | 'finished';
}

const ORDER_ITEMS = [
    { id: 'booking', name: 'Бронирование зала', price: 45000 },
    { id: 'isotonic', name: 'Изотоник', price: 29000 },
    { id: 'protein-bar', name: 'Протеиновый батончик', price: 24000 },
] as const;

function pluralizeItems(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${count} товара`;
    return `${count} товаров`;
}

function OrderComposition({ className = '' }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const total = ORDER_ITEMS.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className={className}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                className="group flex w-full justify-between items-center py-[25px] px-[14px] bg-[#FAFAFF] cursor-pointer rounded-[6px] transition-all duration-200 hover:bg-[#f0f0f5] active:scale-[0.99]"
            >
                <div className="flex items-center gap-[19px]">
                    <Image
                        src={assets.booking.bagIcon}
                        alt=""
                        className="transition-transform duration-200 group-hover:-translate-y-1"
                    />
                    <span className="font-semibold text-[20px] text-black">Состав заказа</span>
                    <span className="font-semibold text-[16px] text-[#0A6AF7]">
                        {pluralizeItems(ORDER_ITEMS.length)}
                    </span>
                </div>
                <span className="rounded-full w-[26px] h-[26px] bg-white grid place-items-center">
                    <Image
                        src={assets.booking.arrowDown}
                        alt=""
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </span>
            </button>

            {isOpen && (
                <div className="mt-[10px] rounded-[6px] bg-[#FAFAFF] px-[14px] py-[12px] flex flex-col gap-[10px]">
                    {ORDER_ITEMS.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-[16px] rounded-[8px] bg-white px-[14px] py-[12px]"
                        >
                            <span className="font-semibold text-[16px] text-black">{item.name}</span>
                            <span className="font-semibold text-[16px] text-black whitespace-nowrap">
                                {formatPrice(item.price)} сум
                            </span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between gap-[16px] px-[6px] pt-[4px]">
                        <span className="font-semibold text-[18px] text-black opacity-60">Итого</span>
                        <strong className="font-bold text-[22px] text-black whitespace-nowrap">
                            {formatPrice(total)} сум
                        </strong>
                    </div>
                </div>
            )}
        </div>
    );
}

export const BookingCard = ({ status = 'upcoming' }: BookingCardProps) => {
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const UpcomingCardContent = () => (
        <article className="flex flex-col max-w-[1525px] w-full rounded-[18px] bg-white overflow-hidden pr-[18px] pb-[18px]">
            <div className="flex flex-row mb-[18px]">
                <div className="shrink-0 w-[468px] relative">
                    <Image
                        src={assets.map.photo1}
                        alt="BronFitness Club"
                        fill
                        className="object-cover block"
                    />
                    <span className="rounded-[16px] w-[51px] h-[31px] bg-black/50 text-white text-[14px] font-semibold grid place-items-center absolute left-[12px] bottom-[10px]">
                        1/3
                    </span>
                </div>

                <div className="grow flex flex-col px-[24px] py-[20px] gap-[12px]">
                    <div className="flex items-start justify-between gap-[16px]">
                        <span className="rounded-[17px] py-[6px] px-[16px] bg-[#e7ebfd] font-semibold text-[16px] text-[#4a58fe] whitespace-nowrap">
                            Спорт зал
                        </span>
                        <div className="flex items-center gap-[10px]">
                            <span className="rounded-[18px] py-[7px] px-[22px] font-semibold text-[16px] text-[#00bd08] bg-[#e7f8ef] whitespace-nowrap">
                                • Подтверждено
                            </span>
                            <BookingDropdown onCancelClick={() => setIsCancelModalOpen(true)} onEditClick={() => setIsEditModalOpen(true)} />
                        </div>
                    </div>

                    <div className="flex flex-row justify-between gap-[16px]">
                        <div className="flex justify-start flex-col gap-0">
                            <h2 className="font-bold text-[32px] text-black mb-[4px]">
                                BronFitness Club
                            </h2>
                            <p className="font-semibold text-[20px] text-black flex items-center gap-[7px] mb-[20px]">
                                <Image src={assets.booking.gpsIcon} alt='gps' />
                                ул. Сайрам 123, Ташкент
                            </p>
                            <div className="flex gap-[11px]">
                                <div className="rounded-[12px] bg-[#FAFAFF] py-[10px] px-[12px] flex flex-col gap-[2px]">
                                    <span className="font-semibold text-[16px] text-black">Время</span>
                                    <span className="font-semibold text-[14px] text-black flex items-center gap-[6px]">
                                        12 июня 2026, ЧТ
                                    </span>
                                </div>
                                <div className="rounded-[12px] bg-[#FAFAFF] py-[10px] px-[12px] flex flex-col gap-[2px]">
                                    <span className="font-semibold text-[16px] text-black">Время</span>
                                    <span className="font-semibold text-[14px] text-black flex items-center gap-[6px]">
                                        12:00 – 13:00
                                    </span>
                                </div>
                                <div className="rounded-[12px] bg-[#FAFAFF] py-[10px] px-[12px] flex flex-col gap-[2px]">
                                    <span className="font-semibold text-[16px] text-black">Гости</span>
                                    <span className="font-semibold text-[14px] text-black flex items-center gap-[6px]">
                                        <Image src={assets.booking.guestsIcon} alt='guests' /> 1
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end">
                            <div className="flex flex-col gap-[2px] shrink-0">
                                <span className="font-semibold text-[20px] text-black opacity-60">Итог</span>
                                <strong className="font-bold text-[36px] text-black whitespace-nowrap">98 000 сум</strong>
                            </div>
                            <button
                                onClick={() => setIsCancelModalOpen(true)}
                                className="rounded-[12px] bg-[#FAFAFF] font-semibold text-[20px] text-black py-[16px] px-[28px] whitespace-nowrap mt-[38px] transition-all duration-200 hover:bg-gray-200 hover:shadow-sm active:scale-95"
                            >
                                Отменить бронь
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <OrderComposition className="ml-[18px]" />
        </article>
    );

    const FinishedCardContent = () => (
        <article className="flex flex-col max-w-[1525px] w-full rounded-[18px] bg-white overflow-hidden p-[20px] gap-[16px]">
            <div className="flex flex-row items-center gap-[24px]">
                <div className="shrink-0 w-[276px] h-[148px] rounded-[18px] overflow-hidden relative">
                    <Image
                        src={assets.map.photo1}
                        alt="BronFitness Club"
                        fill
                        className="object-cover block"
                    />
                </div>

                <div className="grow flex flex-row justify-between items-center gap-[16px]">
                    <div className="flex flex-col gap-[12px]">
                        <span className="w-fit rounded-[17px] py-[6px] px-[16px] bg-[#e7ebfd] font-semibold text-[16px] text-[#4a58fe] whitespace-nowrap">
                            Спорт зал
                        </span>
                        <h2 className="font-bold text-[32px] text-black">
                            BronFitness Club
                        </h2>
                        <p className="font-semibold text-[20px] text-black flex items-center gap-[7px]">
                            <Image src={assets.booking.gpsIcon} alt='gps' />
                            ул. Сайрам 123, Ташкент
                        </p>
                    </div>

                    <div className="flex gap-[16px]">
                        <div className="rounded-[12px] bg-[#FAFAFF] py-[14px] px-[20px] flex flex-col gap-[4px] min-w-[200px]">
                            <span className="font-semibold text-[18px] text-black">Время</span>
                            <span className="font-semibold text-[16px] text-[#6F6F6F]">
                                12 июня 2026, ЧТ
                            </span>
                        </div>
                        <div className="rounded-[12px] bg-[#FAFAFF] py-[14px] px-[20px] flex flex-col gap-[4px] min-w-[150px]">
                            <span className="font-semibold text-[18px] text-black">Время</span>
                            <span className="font-semibold text-[16px] text-[#6F6F6F]">
                                12:00 – 13:00
                            </span>
                        </div>
                        <div className="rounded-[12px] bg-[#FAFAFF] py-[14px] px-[20px] flex flex-col gap-[4px]">
                            <span className="font-semibold text-[18px] text-black">Гости</span>
                            <span className="font-semibold text-[16px] text-[#6F6F6F] flex items-center gap-[6px]">
                                <Image src={assets.booking.guestsIcon} alt='guests' /> 1
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-[16px]">
                        <span className="rounded-[18px] py-[7px] px-[22px] font-semibold text-[16px] text-[#4b4b4d] bg-black/5 whitespace-nowrap">
                            • Завершено
                        </span>
                        <strong className="font-bold text-[36px] text-black whitespace-nowrap">98 000 сум</strong>
                    </div>
                </div>
            </div>

            <OrderComposition />
        </article>
    );

    return (
        <>
            {status === 'finished' ? <FinishedCardContent /> : <UpcomingCardContent />}
            <BookingCancelModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} />
            <BookingEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
        </>
    );
};