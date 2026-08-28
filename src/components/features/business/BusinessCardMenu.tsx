"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useEffect, useRef } from "react";

type Props = {
  onEdit?: () => void;
  onDelete: () => void;
  onClose: () => void;
  editLabel?: string;
  deleteLabel?: string;
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

export default function BusinessCardMenu({
  onEdit,
  onDelete,
  onClose,
  editLabel,
  deleteLabel,
}: Props) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const resolvedEditLabel = editLabel ?? t("businessCardMenu.editProfile");
  const resolvedDeleteLabel = deleteLabel ?? t("businessCardMenu.deleteBusiness");

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
      className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[210px] rounded-[18px] bg-[var(--bg-surface)] p-[10px] shadow-[0_12px_40px_rgba(0,0,0,0.16)]"
      data-testid="business-card-menu"
    >
      {onEdit && (
        <button
          type="button"
          data-testid="business-card-menu-edit"
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="flex w-full items-center gap-[12px] rounded-[14px] px-[14px] py-[12px] text-left text-[15px] font-semibold transition hover:bg-[var(--bg-surface-muted)]"
        >
          <PencilIcon />
          {resolvedEditLabel}
        </button>
      )}
      <button
        type="button"
        data-testid="business-card-menu-delete"
        onClick={() => {
          onDelete();
          onClose();
        }}
        className={`${onEdit ? "mt-[6px] " : ""}flex w-full items-center gap-[12px] rounded-[14px] px-[14px] py-[12px] text-left text-[15px] font-semibold transition hover:bg-[var(--bg-surface-muted)]`}
      >
        <CloseIcon />
        {resolvedDeleteLabel}
      </button>
    </div>
  );
}
