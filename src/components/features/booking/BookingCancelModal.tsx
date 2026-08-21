"use client";
import Image from 'next/image';
import { assets } from '@/lib/assets';

interface BookingCancelModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BookingCancelModal = ({ isOpen, onClose }: BookingCancelModalProps) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <section 
                className="relative w-full max-w-[842px] p-[24px_27px] rounded-[18px] flex flex-col bg-white shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="flex justify-between mb-9">
                    <div className="flex flex-col gap-[7px]">
                        <h3 className="font-semibold text-[20px] text-black">Отменить бронь?</h3>
                        <p className="flex flex-col font-semibold text-[16px] text-[#585858]">
                            Вы уверены что хотите отменить бронь в
                            <strong className="text-black"> Bron Fitness Club на 16 мая 2026, с 18:00 до 19:00</strong>
                        </p>
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

                <div className="flex gap-[71px] mb-[28px]">
                    <div className="flex gap-[13px]">
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
                    <div className="flex flex-col gap-[4px]">
                        <span className="font-semibold text-[20px] text-black opacity-60">Итого</span>
                        <strong className="font-semibold text-[32px] text-black">98 000 сум</strong>
                    </div>
                </div>

                <aside className="flex items-center gap-[13px] rounded-[5px] bg-[#FAFAFF] p-[23px_19px] mb-[22px]">
                    <span className="grid place-items-center w-6 h-6 rounded-full bg-[#0A6AF7] text-white" aria-hidden="true">!</span>
                    <p className="font-semibold text-[15px] text-black">Средства будут возвращены на ваш счет в течение 3-5 рабочих дней</p>
                </aside>

                <div className="flex gap-[28px]">
                    <button 
                        onClick={onClose}
                        className="flex items-center justify-center w-full max-w-[380px] h-[75px] rounded-[11px] bg-[#0A6AF7] text-white font-semibold text-[20px] transition-all duration-200 transform-gpu hover:bg-[#0856c6] active:scale-[0.98]"
                    >
                        Не отменять
                    </button>
                    <button 
                        onClick={onClose}
                        className="flex items-center justify-center w-full max-w-[380px] h-[75px] rounded-[11px] bg-[#FAFAFF] text-black font-semibold text-[20px] transition-all duration-200 transform-gpu hover:bg-[#EAEAEF] active:scale-[0.98]"
                    >
                        Отменить бронь
                    </button>
                </div>

            </section>
        </div>
    )
}