"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useEffect, useState } from "react";
import desktop from "./businessDesktop.module.css";

type DeleteBusinessModalProps = {
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function ExitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="4"
        width="12"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10 12h10M17 9l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#e02424" />
      <path
        d="M12 7v6M12 17h.01"
        stroke="white"
        strokeWidth="2.2"
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

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isDeleting, onClose]);

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
      className={desktop.deleteBackdrop}
      data-testid="business-delete-modal-backdrop"
      onClick={onClose}
    >
      <section
        className={desktop.deleteModal}
        data-testid="business-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-delete-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={desktop.deleteHeader}>
          <div className={desktop.deleteHeaderLeft}>
            <span className={desktop.deleteIconWrap}>
              <TrashIcon />
            </span>
            <h3
              id="business-delete-modal-title"
              className={desktop.deleteTitle}
              data-testid="business-delete-modal-title"
            >
              {t("businessDeleteModal.title")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={desktop.deleteCloseButton}
            aria-label={t("common.close")}
            data-testid="business-delete-modal-close"
          >
            <ExitIcon />
          </button>
        </div>

        <p className={desktop.deleteConfirm}>
          {t("businessDeleteModal.confirmBefore")}{" "}
          <strong>{businessName}</strong>
          {t("businessDeleteModal.confirmAfter")}
        </p>
        <p className={desktop.deleteWarning}>{t("businessDeleteModal.warning")}</p>

        <div className={desktop.deleteAlertBox}>
          <span className={desktop.deleteAlertIcon}>
            <WarningIcon />
          </span>
          <p className={desktop.deleteAlertText}>
            {t("businessDeleteModal.irreversible")}
          </p>
        </div>

        <div className={desktop.deleteActions}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className={desktop.deleteCancelButton}
            data-testid="business-delete-cancel"
          >
            {t("businessDeleteModal.cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void handleConfirm()}
            className={desktop.deleteConfirmButton}
            data-testid="business-delete-confirm"
          >
            {isDeleting ? t("businessModal.saving") : t("businessDeleteModal.delete")}
          </button>
        </div>
      </section>
    </div>
  );
}
