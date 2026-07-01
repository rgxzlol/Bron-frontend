import { Logo } from "@/components/shared/Logo";
import LanguageSelector from "@/components/layout/Header/LanguageSelector";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { NavLink } from "@/components/shared/Navlink";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="bg-white min-h-screen">
            <div className="container mx-auto">

                <div className="flex justify-between items-center">
                    <Logo />
                    <div className="flex gap-5">
                        <LanguageSelector />
                        <ThemeSwitcher />
                    </div>
                </div>

                <div className="grid items-center justify-items-center min-h-[calc(100vh-90px)]">

                    <div className="max-w-[780px] w-full shadow-[0_4px_39px_-10px_rgba(0,0,0,0.08)] bg-[#f9f9fd] rounded-[24px] px-[60px] py-[33px] flex flex-col items-center">

                        <div className="relative rounded-[22px] w-full bg-white flex justify-between isolate border border-[rgba(0,0,0,0.08)] 
                            before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:bg-[#0A6AF7] before:rounded-[22px] before:-z-10 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] 
                            has-[.is-active:nth-child(2)]:before:translate-x-full"
                        >
                            <NavLink
                                href={'/login'}
                                className="relative text-center w-full font-semibold text-[20px] text-black opacity-70 py-[22px] rounded-[22px] transition-all duration-300 hover:opacity-100 active:scale-[0.98]"
                                activeClassName="is-active !text-white !opacity-100"
                            >
                                Войти в аккаунт
                            </NavLink>
                            <NavLink
                                href={'/register'}
                                className="relative text-center w-full font-semibold text-[20px] text-black opacity-70 py-[22px] rounded-[22px] transition-all duration-300 hover:opacity-100 active:scale-[0.98]"
                                activeClassName="is-active !text-white !opacity-100"
                            >
                                Создать аккаунт
                            </NavLink>
                        </div>

                        {children}

                    </div>

                </div>
            </div>
        </main>
    )
}