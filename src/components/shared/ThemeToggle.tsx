"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { useProfileStore } from "@/store/profile.store";
import s from "./themeToggle.module.css";

export default function ThemeToggle() {
  const theme = useProfileStore((state) => state.theme);
  const setTheme = useProfileStore((state) => state.setTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={s.toggle}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      aria-pressed={isDark}
    >
      <Image
        src={isDark ? assets.profile.nightTheme : assets.profile.lightTheme}
        alt=""
        width={20}
        height={20}
        data-theme-aware
      />
    </button>
  );
}
