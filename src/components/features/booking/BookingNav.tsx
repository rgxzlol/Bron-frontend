"use client";
import { useSearchParams, useRouter } from 'next/navigation';

export const BookingNav = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const currentTab = searchParams.get('tab') || 'upcoming';
    const isUpcoming = currentTab === 'upcoming';

    const handleTabChange = (tab: string) => {
        router.push(`?tab=${tab}`, { scroll: false }); 
    };

    return (
        <nav aria-label="Навигация по бронированиям">
            <ul className="relative flex gap-[46px] isolate">
                <div
                    className={`absolute bottom-[-5px] left-0 h-[3px] bg-[#0A6AF7] transition-all duration-300 ease-in-out -z-10
                        ${isUpcoming ? 'w-[170px] translate-x-0' : 'w-[140px] translate-x-[216px]'}`}
                />

                <li>
                    <button
                        onClick={() => handleTabChange('upcoming')}
                        className={`flex items-center text-[20px] font-semibold transition-colors duration-300 focus:outline-none
                            ${isUpcoming ? 'text-[#0A6AF7] opacity-100' : 'text-black opacity-60 hover:opacity-80'}`}
                    >
                        Предстоящие
                        <span className={`ml-[7px] flex h-7 min-w-7 items-center justify-center rounded-full px-[7px] text-[20px] font-semibold text-white transition-colors duration-300
                            ${isUpcoming ? 'bg-[#0A6AF7]' : 'bg-[#1e1e1e]'}`}>
                            2
                        </span>
                    </button>
                </li>

                <li>
                    <button
                        onClick={() => handleTabChange('past')}
                        className={`flex items-center text-[20px] font-semibold transition-colors duration-300 focus:outline-none
                            ${!isUpcoming ? 'text-[#0A6AF7] opacity-100' : 'text-black opacity-60 hover:opacity-80'}`}
                    >
                        Прошлые
                        <span className={`ml-[7px] flex h-7 min-w-7 items-center justify-center rounded-full px-[7px] text-[20px] font-semibold text-white transition-colors duration-300
                            ${!isUpcoming ? 'bg-[#0A6AF7]' : 'bg-[#1e1e1e]'}`}>
                            4
                        </span>
                    </button>
                </li>
            </ul>
        </nav>
    );
};