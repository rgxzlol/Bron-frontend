"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useProfileStore } from "@/store/profile.store";

export const ThemeSwitcher = () => {
  const { t } = useTranslation();
  const theme = useProfileStore((state) => state.theme);
  const setTheme = useProfileStore((state) => state.setTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("themeToggle.enableLight") : t("themeToggle.enableDark")}
      aria-pressed={isDark}
      data-testid="theme-switcher"
      className="rounded-full bg-white p-1 transition-opacity hover:opacity-90 active:scale-95"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] transition-colors hover:bg-[var(--bg-hover)]">
        <Image
          src={isDark ? assets.profile.nightTheme : assets.profile.lightTheme}
          alt=""
          width={22}
          height={22}
          data-theme-aware
        />
      </span>
    </button>
  );
};
