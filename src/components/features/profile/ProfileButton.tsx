"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";

type ProfileButtonProps = {
  variant?: "default" | "header";
  displayName?: string | null;
  avatarUrl?: string | null;
};

export default function ProfileButton({
  variant = "default",
  displayName = null,
  avatarUrl = null,
}: ProfileButtonProps) {
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
        className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3"
        aria-label={displayName ? `Профиль: ${displayName}` : "Профиль"}
        aria-haspopup="dialog"
        data-testid="profile-button"
        onClick={handleClick}
      >
        <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image src={assets.header.profileIcon} alt="" width={24} height={24} />
          )}
        </span>
        {token && displayName ? (
          <span className="hidden max-w-[120px] truncate text-[14px] font-semibold text-[var(--text-primary)] lg:inline">
            {displayName}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] p-[16px]"
      aria-label={token ? "Профиль" : "Войти"}
      aria-haspopup="dialog"
      onClick={handleClick}
    >
      <Image src={assets.header.profileIcon} alt="" />
    </button>
  );
}
