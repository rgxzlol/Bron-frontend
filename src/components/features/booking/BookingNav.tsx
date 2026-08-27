"use client";
import { useSearchParams, useRouter } from 'next/navigation';

const TABS = [
    { id: 'upcoming', label: 'Предстоящие' },
    { id: 'past', label: 'Прошлые' },
] as const;

export const BookingNav = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentTab = searchParams.get('tab') === 'past' ? 'past' : 'upcoming';

    const handleTabChange = (tab: string) => {
        router.push(`?tab=${tab}`, { scroll: false });
    };

    return (
        <nav aria-label="Навигация по бронированиям">
            <div className="flex w-full gap-[10px] lg:max-w-[430px]">
                {TABS.map((tab) => {
                    const isActive = currentTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(tab.id)}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex-1 rounded-[12px] py-[13px] text-[15px] font-semibold transition-colors duration-200 focus:outline-none
                                ${isActive
                                    ? 'bg-[#0a6af7] text-white'
                                    : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)]'}`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
