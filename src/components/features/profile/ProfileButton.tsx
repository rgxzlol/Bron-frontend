"use client";

import { useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";
import ProfileModal from "./ProfileModal";

export default function ProfileButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-full bg-[var(--bg-surface)] p-[16px] border border-[var(--border-default)]"
        aria-label={t("common.profile")}
        onClick={() => setIsOpen(true)}
      >
        <Image src={assets.header.profileIcon} alt="" />
      </button>

      <ProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
