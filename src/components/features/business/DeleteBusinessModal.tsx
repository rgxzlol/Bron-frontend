"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useState } from "react";

type DeleteBusinessModalProps = {
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"
        stroke="#e02424"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DeleteBusinessModal({
  businessName,
  isOpen,
  onClose,
  onConfirm,
}: DeleteBusinessModalProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  async function handleConfirm() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      data-testid="business-delete-modal-backdrop"
      onClick={onClose}
    >
      <section
        className="w-full max-w-[320px] rounded-[16px] bg-[var(--bg-surface)] p-[18px] shadow-lg lg:max-w-[400px] lg:p-[22px]"
        data-testid="business-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-delete-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-[10px]">
          <div className="flex items-center gap-[10px]">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#fde8e8]">
              <TrashIcon />
            </span>
            <h3
              id="business-delete-modal-title"
              className="text-[17px] font-bold"
              data-testid="business-delete-modal-title"
            >
              {t("businessDeleteModal.title")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-[6px] text-[var(--text-primary)] transition hover:opacity-70"
            aria-label={t("common.close")}
            data-testid="business-delete-modal-close"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="mt-[16px] text-[14px] font-semibold leading-snug">
          {t("businessDeleteModal.confirm", { name: businessName })}
        </p>
        <p className="mt-[8px] text-[13px] leading-snug text-[var(--text-secondary)]">
          {t("businessDeleteModal.warning")}
        </p>

        <div className="mt-[18px] grid grid-cols-2 gap-[10px]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-[10px] bg-[#0a6af7] py-[13px] text-[14px] font-semibold text-white transition hover:bg-[#0858ce] disabled:opacity-60"
            data-testid="business-delete-cancel"
          >
            {t("businessDeleteModal.cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void handleConfirm()}
            className="rounded-[10px] bg-[#e02424] py-[13px] text-[14px] font-semibold text-white transition hover:bg-[#c11f1f] disabled:opacity-60"
            data-testid="business-delete-confirm"
          >
            {isDeleting ? t("businessModal.saving") : t("businessDeleteModal.delete")}
          </button>
        </div>
      </section>
    </div>
  );
}
