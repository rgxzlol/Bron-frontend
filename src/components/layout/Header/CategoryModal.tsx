"use client";

import { FC, useState } from 'react';
import Image from 'next/image';
import { assets } from '@/lib/assets';
import { Category } from '@/types/category';
import { LocationSelector } from './LocationSelector';
import { CategoryDropdown } from './CategoryDropdown';
import { CurrencyDropdown } from './CurrencyDropdown';

interface CategoryModalProps {
    handleClose(): void;
}


export const CategoryModal: FC<CategoryModalProps> = ({ handleClose }) => {
    const [selectedLocation, setSelectedLocation] = useState<string>("nearby");
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [price, setPrice] = useState<string>("");
    const [currency, setCurrency] = useState<string>("sum");

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        console.log("Applied filters (demo):", {
            location: selectedLocation,
            category: selectedCategory,
            price,
            currency
        });
        handleClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex justify-center items-center bg-black/50 backdrop-blur-[4px] p-4 animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <section
                className="relative max-w-[659px] w-full p-6 rounded-[23px] flex flex-col bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                aria-modal="true"
                role="dialog"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative flex items-center justify-center w-full mb-6">
                    <h2 className="text-[24px] font-medium text-black">Категории</h2>
                    <button
                        onClick={handleClose}
                        className="absolute right-0 w-8 h-8 flex items-center justify-center bg-[#FAFAFF] hover:bg-[#EAEAEF] text-black  rounded-full transition-all duration-200 group"
                        aria-label="Закрыть окно"
                    >
                        <span className="w-4 h-4 flex items-center justify-center">
                            <Image
                                src={assets.header.close}
                                alt='close'
                                className="opacity-60 group-hover:opacity-100 transition-opacity"
                            />
                        </span>
                    </button>
                </div>

                <form className="flex flex-col gap-[16px]" onSubmit={handleSubmit}>

                    <div className="flex flex-col">
                        <h3 className="font-medium text-[16px] text-black mb-[9px]">
                            Местоположение
                        </h3>
                        <LocationSelector value={selectedLocation} onChange={setSelectedLocation} />
                    </div>


                    <div className="flex flex-col">
                        <label className="font-medium text-[16px] text-black mb-[9px]">
                            Категория бизнеса
                        </label>
                        <CategoryDropdown selectedCategory={selectedCategory} onChange={setSelectedCategory} />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="price-input" className="font-medium text-[16px] text-black mb-[9px]">
                            Введите приблизительную цену
                        </label>

                        <div className="flex items-center gap-[12px] w-full">
                            <div className="flex-1 h-[72px] px-[18px] py-[24px] rounded-[17px] bg-[#FAFAFF] border-2 border-transparent focus-within:border-[#0A6AF7] focus-within:bg-white transition-all duration-200 flex items-center">
                                <input
                                    id="price-input"
                                    type="text"
                                    placeholder="Введите цену"
                                    className="w-full bg-transparent outline-none text-[18px] font-semibold text-black placeholder:text-gray-400 placeholder:font-normal"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </div>

                            <CurrencyDropdown value={currency} onChange={setCurrency} />
                        </div>
                    </div>


                    <button
                        type="submit"
                        className="w-full py-[20px] rounded-[23px] bg-[#0A6AF7] hover:bg-[#0859d4] active:scale-[0.98] text-white font-semibold text-[20px] transition-all duration-200 shadow-md hover:shadow-lg mt-4 cursor-pointer"
                    >
                        Применить
                    </button>
                </form>
            </section>
        </div>
    );
};