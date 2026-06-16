"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { assets } from "@/lib/assets";
import ProfilePageContent from "./ProfilePageContent";
import s from "./profilePage.module.css";

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={s.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Профиль"
    >
      <div className={s.modal} onClick={(event) => event.stopPropagation()}>
        <div className={s.modalHead}>
          <h1 className={s.title}>Профиль</h1>
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <Image src={assets.header.close} alt="" width={18} height={18} />
          </button>
        </div>

        <div className={s.modalBody}>
          <ProfilePageContent />
        </div>
      </div>
    </div>,
    document.body,
  );
}
