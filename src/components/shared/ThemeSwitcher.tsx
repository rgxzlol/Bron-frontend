"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { useProfileStore } from "@/store/profile.store";
import s from "./themeToggle.module.css";

export const ThemeSwitcher = () => {
  const theme = useProfileStore((state) => state.theme);
  const setTheme = useProfileStore((state) => state.setTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      aria-pressed={isDark}
      data-testid="theme-switcher"
      className={`${s.toggle} flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] transition-all duration-200 hover:bg-[var(--bg-surface-muted)] active:scale-95`}
    >
      <Image
        src={isDark ? assets.profile.nightTheme : assets.profile.lightTheme}
        alt=""
        width={22}
        height={22}
        data-theme-aware
      />
    </button>
  );
};
