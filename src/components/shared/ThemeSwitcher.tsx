"use client";

import Image from 'next/image'
import { assets } from '@/lib/assets'
import { useProfileStore } from '@/store/profile.store'

export const ThemeSwitcher = () => {
    const theme = useProfileStore((s) => s.theme)
    const setTheme = useProfileStore((s) => s.setTheme)

    return (
        <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Переключить тему"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] transition-all duration-200 hover:bg-[var(--bg-surface-muted)] active:scale-95"
        >
            <Image src={assets.common.sunIcon} alt='theme' width={22} height={22} />
        </button>
    )
}
