"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import ProfileModal from "./ProfileModal";

export default function ProfileButton() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const [isOpen, setIsOpen] = useState(false);

  function handleClick() {
    if (hydrated && !token) {
      router.push(routes.login);
      return;
    }

    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        className="rounded-full bg-[var(--bg-surface)] p-[16px] border border-[var(--border-default)]"
        aria-label={token ? "Профиль" : "Войти"}
        onClick={handleClick}
      >
        <Image src={assets.header.profileIcon} alt="" />
      </button>

      <ProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
