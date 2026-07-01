import Image from 'next/image'
import { assets } from '@/lib/assets'

export const ThemeSwitcher = () => {
    return (
        <div className="w-[53px] h-[53px] bg-[#F9F9FD] rounded-full grid place-items-center cursor-pointer transition-all duration-200 hover:bg-[#ebebf5] active:scale-95">
            <Image src={assets.common.sunIcon} alt='theme' />
        </div>
    )
}