import type { Metadata } from "next";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { SupportModal } from "@/components/features/auth/SupportModal";

export const metadata: Metadata = {
    title: "Вход",
};

export default function LoginPage() {
    return (
        <section className="mt-9.5 w-full">
            <form className="flex flex-col gap-3.25">
                <div className="flex flex-col gap-1.25">
                    <label htmlFor="name-input" className="font-semibold text-[20px] text-black opacity-60 mb-1.25">
                        Имя
                    </label>

                    <div className="relative flex items-center p-5.5 rounded-[22px] bg-white border border-transparent transition-all duration-200 max-h-16.75 focus-within:border-[#0A6AF7]">
                        <input
                            id="name-input"
                            type="text"
                            placeholder="Иван"
                            className="w-full bg-transparent outline-none text-[20px] font-semibold text-black placeholder:opacity-60"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.25">
                    <label htmlFor="password-input" className="font-semibold text-[20px] text-black opacity-60 mb-1.25">
                        Пароль
                    </label>

                    <div className="relative flex items-center p-5.5 rounded-[22px] bg-white border border-transparent transition-all duration-200 max-h-16.75 focus-within:border-[#0A6AF7]">
                        <input
                            id="password-input"
                            type="password"
                            placeholder="verturva2021"
                            className="w-full bg-transparent outline-none text-[20px] font-semibold text-black placeholder:opacity-60 pr-10"
                        />
                        <Image
                            src={assets.auth.eyeIcon}
                            alt="show password"
                            className="absolute top-5 right-5 cursor-pointer transition-all duration-200 hover:opacity-70 active:scale-90"
                        />
                    </div>
                </div>
            </form>

            <div className="mt-10.5 flex flex-col gap-6.5">
                <button className="border border-[rgba(0,0,0,0.08)] rounded-[22px] bg-[#0A6AF7] w-full font-semibold text-[24px] text-white p-4 transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.98]">
                    Войти
                </button>

                <button className="p-4 rounded-[41px] bg-white w-full font-semibold text-[24px] text-black flex justify-center items-center gap-1.25 transition-all duration-200 hover:bg-[#f2f2f7] active:scale-[0.98]">
                    <Image src={assets.auth.googleIcon} alt="google" />
                    Google
                </button>

                <div className="flex gap-4.75">
                    <SupportModal />
                    <button className="p-4 rounded-3xl bg-[#0A6AF7] font-semibold text-[20px] text-white w-full flex justify-center items-center gap-1.25 transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.98]">
                        Telegram
                        <Image src={assets.auth.telegramIcon} alt="telegram" />
                    </button>
                </div>
            </div>
        </section>
    );
}