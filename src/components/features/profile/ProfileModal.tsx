"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { assets } from "@/lib/assets";
import ProfilePageContent from "./ProfilePageContent";
import s from "./profilePage.module.css";

type ProfileSection =
  | "main"
  | "personal"
  | "payments"
  | "addCard"
  | "appSettings"
  | "notifications"
  | "theme"
  | "logout";

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const sectionTitles: Record<ProfileSection, string> = {
  main: "Настройки профиля",
  personal: "Личные данные",
  payments: "Платежи",
  addCard: "Добавить карту",
  appSettings: "Настройки",
  notifications: "Уведомления",
  theme: "Тема",
  logout: "Выйти из аккаунта",
};

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState<ProfileSection>("main");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSection("main");
    }
  }, [isOpen]);

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
      aria-label={sectionTitles[section]}
    >
      <div className={s.modal} onClick={(event) => event.stopPropagation()}>
        {section === "main" ? (
          <div className={s.modalHead}>
            <h1 className={s.title}>{sectionTitles.main}</h1>
            <button
              type="button"
              className={s.closeBtn}
              onClick={onClose}
              aria-label="Закрыть"
            >
              <Image src={assets.header.close} alt="" width={18} height={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={s.closeBtnFloating}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <Image src={assets.header.close} alt="" width={18} height={18} />
          </button>
        )}

        <div className={s.modalBody}>
          <ProfilePageContent onClose={onClose} onSectionChange={setSection} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
