"use client";

import { useToastStore } from "@/store/toast.store";

type DeleteBusinessModalProps = {
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
  const showToast = useToastStore((state) => state.showToast);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="w-full max-w-[320px] rounded-[16px] bg-[var(--bg-surface)] p-[18px] shadow-lg lg:max-w-[400px] lg:p-[22px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-[10px]">
          <div className="flex items-center gap-[10px]">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#fde8e8]">
              <TrashIcon />
            </span>
            <h3 className="text-[17px] font-bold">Удалить бизнес?</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-[6px] text-[var(--text-primary)] transition hover:opacity-70"
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="mt-[16px] text-[14px] font-semibold leading-snug">
          Вы уверены что хотите удалить бизнес{" "}
          <strong>{businessName}</strong>?
        </p>
        <p className="mt-[8px] text-[13px] leading-snug text-[var(--text-secondary)]">
          Все данные, бронирования и статистика будут удалены без возможности
          восстановления
        </p>

        <div className="mt-[18px] grid grid-cols-2 gap-[10px]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] bg-[#0a6af7] py-[13px] text-[14px] font-semibold text-white transition hover:bg-[#0858ce]"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              showToast(
                "Бизнес успешно удален",
                "Бизнес удален и все данные о нем удалены.",
              );
            }}
            className="rounded-[10px] bg-[#e02424] py-[13px] text-[14px] font-semibold text-white transition hover:bg-[#c11f1f]"
          >
            Удалить бизнес
          </button>
        </div>
      </section>
    </div>
  );
}
