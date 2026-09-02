"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  anchorEl: HTMLElement | null;
  onEdit?: () => void;
  onDelete: () => void;
  onClose: () => void;
  editLabel?: string;
  deleteLabel?: string;
  variant?: "default" | "desktop";
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
  anchorEl,
  onEdit,
  onDelete,
  onClose,
  editLabel,
  deleteLabel,
  variant = "default",
}: Props) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const resolvedEditLabel = editLabel ?? t("businessCardMenu.editProfile");
  const resolvedDeleteLabel = deleteLabel ?? t("businessCardMenu.deleteBusiness");

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    function updatePosition() {
      if (!anchorEl) return;

      const rect = anchorEl.getBoundingClientRect();
      const menuWidth = 230;
      const gap = variant === "desktop" ? 10 : 8;
      const left = Math.max(12, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12));

      setPosition({
        top: rect.bottom + gap,
        left,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorEl, variant]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [anchorEl, onClose]);

  if (!mounted || !anchorEl) return null;

  const menu = (
    <div
      ref={menuRef}
      className={`fixed z-[100] min-w-[230px] overflow-hidden rounded-[18px] bg-[var(--bg-surface)] shadow-[0_12px_40px_rgba(0,0,0,0.16)] ${
        variant === "desktop" ? "p-[12px]" : "p-[10px]"
      }`}
      style={{ top: position.top, left: position.left }}
      data-testid="business-card-menu"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
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

  return createPortal(menu, document.body);
}
