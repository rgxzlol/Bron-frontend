"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Props = {
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 000-3L16.5 4.5a2.1 2.1 0 00-3 0L3 15v5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BusinessCardMenu({ onEdit, onDelete, onClose }: Props) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[220px] rounded-[18px] bg-white p-[10px] shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
    >
      <button
        type="button"
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="flex w-full items-center gap-[12px] rounded-[14px] px-[14px] py-[12px] text-left text-[15px] font-semibold transition hover:bg-[#f4f4f8]"
      >
        <PencilIcon />
        {t("businessCardMenu.editProfile")}
      </button>
      <button
        type="button"
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="mt-[6px] flex w-full items-center gap-[12px] rounded-[14px] px-[14px] py-[12px] text-left text-[15px] font-semibold transition hover:bg-[#f4f4f8]"
      >
        <CloseIcon />
        {t("businessCardMenu.deleteBusiness")}
      </button>
    </div>
  );
}
