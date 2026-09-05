"use client";

import { useToastStore } from "@/store/toast.store";
import { useTranslation } from "@/lib/i18n/useTranslation";

function CheckCircle() {
  return (
    <span
      className="mt-[1px] flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#0a6af7]"
      aria-hidden="true"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    </span>
  );
}

function ConfettiSparks() {
  return (
    <svg
      width="38"
      height="30"
      viewBox="0 0 38 30"
      fill="none"
      aria-hidden="true"
      className="shrink-0 self-center"
    >
      <path d="M5 11l4 2.6" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.5 4.5l1.4 4" stroke="#7eb1fb" strokeWidth="2" strokeLinecap="round" />
      <circle cx="21.5" cy="6" r="1.6" fill="var(--accent-fg)" />
      <path d="M28 10.5l4.4-2" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9.5" cy="20.5" r="1.5" fill="#7eb1fb" />
      <path d="M19 17.5l3.2 3" stroke="var(--accent-fg)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="30.5" cy="21.5" r="1.6" fill="var(--accent-fg)" />
      <path d="M33 14.5h.01" stroke="#7eb1fb" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function ToastContainer() {
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[min(92vw,400px)] -translate-x-1/2 flex-col gap-[10px]"
    >
      <style>{`@keyframes bronToastIn{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          style={{ animation: "bronToastIn 0.28s ease-out" }}
          className="pointer-events-auto flex items-start gap-[10px] rounded-[16px] bg-[var(--bg-surface)] py-[13px] pl-[12px] pr-[10px] shadow-[0_10px_30px_rgba(15,23,42,0.16)]"
        >
          <CheckCircle />

          <div className="min-w-0 flex-1 pt-[2px]">
            <p className="text-[14px] font-bold leading-[1.25] text-[var(--text-primary)]">
              {toast.title}
            </p>
            {toast.text && (
              <p className="mt-[3px] text-[12px] font-medium leading-[1.35] text-[var(--text-secondary)]">
                {toast.text}
              </p>
            )}
          </div>

          <ConfettiSparks />

          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label={t("common.closeNotification")}
            className="flex h-[28px] w-[28px] shrink-0 items-center justify-center self-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-muted)]"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
