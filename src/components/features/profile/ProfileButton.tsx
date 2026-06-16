"use client";

import { useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import ProfileModal from "./ProfileModal";

export default function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-full bg-white p-[16px]"
        aria-label="Профиль"
        onClick={() => setIsOpen(true)}
      >
        <Image src={assets.header.profileIcon} alt="" />
      </button>

      <ProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
