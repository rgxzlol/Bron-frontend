"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import { useTranslation } from "@/lib/i18n/useTranslation";

type ProfileButtonProps = {
  variant?: "default" | "header";
};

export default function ProfileButton({
  variant = "default",
}: ProfileButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);

  function handleClick() {
    if (hydrated && !token) {
      router.push(routes.login);
      return;
    }

    router.push(routes.profile);
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        className="rounded-full bg-white p-1"
        aria-label={t("common.profile")}
        aria-haspopup="dialog"
        data-testid="profile-button"
        onClick={handleClick}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)]">
          <Image src={assets.header.profileIcon} alt="" width={24} height={24} />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] p-[16px]"
      aria-label={token ? t("common.profile") : t("common.login")}
      aria-haspopup="dialog"
      onClick={handleClick}
    >
      <Image src={assets.header.profileIcon} alt="" />
    </button>
  );
}
