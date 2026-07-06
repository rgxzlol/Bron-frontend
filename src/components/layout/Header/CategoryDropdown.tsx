"use client";

import { FC, useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { assets } from '@/lib/assets';
import { Category } from '@/types/category';
import { categories } from '@/data/categories';
import { usePluralize } from '@/lib/pluralize';

interface CategoryDropdownProps {
    selectedCategory: Category | null;
    onChange(category: Category | null): void;
}

export const CategoryDropdown: FC<CategoryDropdownProps> = ({ selectedCategory, onChange }) => {
    const t = useTranslations('CategoryDropdown');
    const tData = useTranslations('data');
    const td = (text: string) => text?.startsWith('data.') ? tData(text.replace('data.', '') as any) : text;
    const { pluralizeServices } = usePluralize();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-[72px] px-[18px] flex items-center justify-between rounded-[17px] bg-[#FAFAFF] border-2 transition-all duration-300 cursor-pointer text-left ${isOpen ? 'border-[#0A6AF7] bg-white shadow-sm' : 'border-transparent hover:border-gray-200'
                    }`}
            >
                {selectedCategory ? (
                    <div className="flex items-center gap-3 animate-in fade-in duration-200">
                        <div
                            style={{ backgroundColor: selectedCategory.color }}
                            className="w-[36px] h-[36px] rounded-full flex items-center justify-center shadow-inner transition-transform duration-300 hover:scale-105"
                        >
                            <Image
                                src={selectedCategory.icon}
                                alt={selectedCategory.title}
                                width={18}
                                height={18}
                            />
                        </div>
                        <span className="text-[18px] font-semibold text-black">
                            {td(selectedCategory.title)}
                        </span>
                        <span className="text-[14px] text-gray-500 font-normal">
                            ({selectedCategory.count} {pluralizeServices(selectedCategory.count)})
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-[16px] font-semibold text-black opacity-70">
                            {t('required')}
                        </span>
                    </div>
                )}

                <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <Image src={assets.booking.arrowDown} alt='expand' width={20} height={20} />
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[17px] shadow-xl border border-gray-100 p-2 flex flex-col gap-1 z-50 max-h-[280px] overflow-y-auto scrollbar-thin animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                        type="button"
                        onClick={() => {
                            onChange(null);
                            setIsOpen(false);
                        }}
                        className={`flex items-center gap-4 w-full px-[18px] py-[12px] hover:bg-[#FAFAFF] transition-all duration-200 rounded-[12px] ${selectedCategory === null
                                ? 'bg-blue-50/50 text-[#0A6AF7]'
                                : 'text-black'
                            }`}
                    >
                        <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center bg-gray-100 flex-shrink-0">
                            <span className="text-gray-400 text-lg">★</span>
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-[16px] font-semibold">{t('allCategories')}</span>
                        </div>
                        {selectedCategory === null && (
                            <span className="ml-auto text-[#0A6AF7] font-semibold animate-in zoom-in duration-200">✓</span>
                        )}
                    </button>

                    {categories.map((cat) => {
                        const isSelected = selectedCategory?.id === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                    onChange(cat);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-4 w-full px-[18px] py-[12px] hover:bg-[#FAFAFF] transition-all duration-200 rounded-[12px] ${isSelected
                                        ? 'bg-blue-50/50 text-[#0A6AF7]'
                                        : 'text-black'
                                    }`}
                            >
                                <div
                                    style={{ backgroundColor: cat.color }}
                                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0 shadow-inner"
                                >
                                    <Image src={cat.icon} alt={cat.title} width={18} height={18} />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[16px] font-semibold">{td(cat.title)}</span>
                                    <span className="text-[12px] opacity-70">
                                        {cat.count} {pluralizeServices(cat.count)}
                                    </span>
                                </div>
                                {isSelected && (
                                    <span className="ml-auto text-[#0A6AF7] font-semibold animate-in zoom-in duration-200">✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
