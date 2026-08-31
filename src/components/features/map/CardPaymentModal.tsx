"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

type CardPaymentModalProps = {
  amountText: string;
  onClose: () => void;
  onPay: () => void;
};

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function CardPaymentModal({ amountText, onClose, onPay }: CardPaymentModalProps) {
  const { t } = useTranslation();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const valid = number.replace(/\s/g, "").length === 16 && expiry.length === 5 && cvc.length >= 3;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-t-[24px] bg-[var(--bg-surface)] p-5 shadow-2xl sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("common.cardPaymentAria")}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">{t("booking.cardPaymentTitle")}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-muted)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <label className="mb-4 flex flex-col gap-2">
          <span className="text-[14px] font-semibold text-[var(--text-secondary)]">Номер карты</span>
          <div className="flex items-center gap-2 rounded-[12px] border border-[var(--border-strong)] px-4 focus-within:border-[#0a6af7]">
            <input
              className="w-full bg-transparent py-3.5 text-[16px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={number}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
            />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
              <rect x="2" y="5" width="20" height="14" rx="3" stroke="var(--text-muted)" strokeWidth="2" />
              <path d="M2 9h20" stroke="var(--text-muted)" strokeWidth="2" />
            </svg>
          </div>
        </label>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold text-[var(--text-secondary)]">Срок действия</span>
            <input
              className="rounded-[12px] border border-[var(--border-strong)] bg-transparent px-4 py-3.5 text-[16px] font-semibold text-[var(--text-primary)] outline-none focus:border-[#0a6af7] placeholder:font-normal placeholder:text-[var(--text-muted)]"
              inputMode="numeric"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold text-[var(--text-secondary)]">CVC/CVV</span>
            <div className="flex items-center gap-2 rounded-[12px] border border-[var(--border-strong)] px-4 focus-within:border-[#0a6af7]">
              <input
                className="w-full bg-transparent py-3.5 text-[16px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)]"
                inputMode="numeric"
                maxLength={4}
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
                <circle cx="12" cy="12" r="9" stroke="var(--text-muted)" strokeWidth="2" />
                <path d="M12 8v5" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="var(--text-muted)" />
              </svg>
            </div>
          </label>
        </div>

        <button
          type="button"
          onClick={onPay}
          disabled={!valid}
          className="w-full rounded-[14px] bg-[#0a6af7] py-4 text-[17px] font-semibold text-white transition-all duration-200 hover:bg-[#0858ce] active:scale-[0.99] disabled:opacity-50"
        >
          Оплатить {amountText}сум
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-[13px] font-semibold text-[var(--text-muted)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="#0a6af7" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 12l2 2 4-4" stroke="#0a6af7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Безопасное соединение
        </div>
      </div>
    </div>
  );
}
