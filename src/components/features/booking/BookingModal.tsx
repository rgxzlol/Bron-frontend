"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { assets } from "@/lib/assets";
import BookingPage from "@/components/features/map/BookingPage";
import type { ShopsType } from "@/types/shops.types";
import s from "./bookingModal.module.css";

type BookingModalProps = {
  isOpen: boolean;
  shop: ShopsType;
  onClose: () => void;
};

export default function BookingModal({ isOpen, shop, onClose }: BookingModalProps) {
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
      aria-label={`Бронирование: ${shop.title}`}
    >
      <div className={s.sheet} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className={s.closeBtn}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <Image src={assets.header.close} alt="" width={18} height={18} />
        </button>

        <div className={s.sheetBody}>
          <BookingPage
            shop={shop}
            onBack={onClose}
            origin="home"
            variant="sheet"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
