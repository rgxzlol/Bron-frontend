"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { useProfileStore } from "@/store/profile.store";

export const ThemeSwitcher = () => {
  const theme = useProfileStore((state) => state.theme);
  const setTheme = useProfileStore((state) => state.setTheme);
  const isDark = theme === "dark";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setTheme(isDark ? "light" : "dark");
        }
      }}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      aria-pressed={isDark}
      className="w-[58px] h-[58px] bg-[var(--bg-surface)] rounded-full grid place-items-center cursor-pointer transition-all duration-200 hover:bg-[#ebebf5] active:scale-95"
    >
      <Image src={assets.common.sunIcon} alt="theme" width={24} height={24} />
    </div>
  );
};
