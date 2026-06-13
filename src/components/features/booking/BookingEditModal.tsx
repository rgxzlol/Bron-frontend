"use client";
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { assets } from '@/lib/assets';
import DatePicker from '@/components/shared/DatePicker';
import TimePicker from '@/components/shared/TimePicker';

interface BookingEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BookingEditModal = ({ isOpen, onClose }: BookingEditModalProps) => {
    const [viewMonth, setViewMonth] = useState(() => new Date(2026, 5, 1));
    const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 5, 12));
    const [selectedTime, setSelectedTime] = useState("12:00");
    const today = useMemo(() => new Date(2026, 5, 2), []);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <section
                className="relative w-full max-w-[1239px] pt-[18px] pb-[50px] px-[38px] rounded-[18px] flex flex-col bg-white shadow-lg overflow-y-auto max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="flex justify-between mb-4">
                    <div className="flex flex-col gap-[7px]">
                        <h3 className="font-semibold text-[20px] text-black">Изменить бронь?</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-[71px] h-[55px] rounded-[12px] bg-[#FAFAFF] transition-all duration-200 hover:bg-[#EAEAEF] active:opacity-80 group"
                    >
                        <div className="transition-transform duration-200 transform-gpu group-active:scale-90 flex items-center justify-center">
                            <Image
                                src={assets.map.quitIcon}
                                alt='Закрыть'
                                height={24}
                                width={24}
                            />
                        </div>
                    </button>
                </div>

                <div className="flex gap-[13px] mb-[54px]">
                    <Image src={assets.map.photo1} width={211} height={113} alt='gym' className="rounded-[17px] object-cover" />
                    <div className="flex flex-col items-start gap-[5px]">
                        <span className="rounded-[17px] padding-[6px_16px] px-4 py-[6px] bg-[#e7ebfd] font-semibold text-[16px] text-[#4a58fe] whitespace-nowrap">
                            Спорт зал
                        </span>
                        <h2 className="font-semibold text-[32px] text-black">BronFitness Club</h2>
                        <p className="flex items-center gap-[7px] font-semibold text-[20px] text-black">
                            <Image src={assets.booking.gpsIcon} alt='gps' />
                            ул. Сайрам 123, Ташкент
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[35px] mb-[35px]  mx-[100px] ">
                    <DatePicker
                        viewMonth={viewMonth}
                        onViewMonthChange={setViewMonth}
                        selectedDate={selectedDate}
                        onSelectedDateChange={setSelectedDate}
                        today={today}
                    />
                    <div className="mx-auto">
                        <TimePicker
                            selectedTime={selectedTime}
                            onSelectedTimeChange={setSelectedTime}
                        />

                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-[28px] justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-full max-w-[566px] h-[68px] rounded-[11px] bg-[#FAFAFF] text-black font-semibold text-[20px] transition-all duration-200 transform-gpu hover:bg-[#EAEAEF] active:scale-[0.98]"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-full max-w-[566px] h-[68px] rounded-[11px] bg-[#0A6AF7] text-white font-semibold text-[20px] transition-all duration-200 transform-gpu hover:bg-[#0856c6] active:scale-[0.98]"
                    >
                        Сохранить изменения
                    </button>
                </div>

            </section>
        </div>
    )
}