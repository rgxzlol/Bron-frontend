"use client";
import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { useBookingStore } from "@/store/booking.store";
import { useToastStore } from "@/store/toast.store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { isRemoteShopImage } from "@/lib/business/shopImages";

interface BookingCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: number;
  bookingDate?: string;
  shopName?: string;
  shopAddress?: string;
  shopImage?: StaticImageData | string;
}

function formatBookingDate(value?: string, locale = "ru-RU") {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
    .replace(" г.", "");
}

export const BookingCancelModal = ({
  isOpen,
  onClose,
  bookingId,
  bookingDate,
  shopName = "",
  shopAddress = "",
  shopImage,
}: BookingCancelModalProps) => {
  const { t, locale } = useTranslation();
  const cancelBooking = useBookingStore((state) => state.cancelBooking);
  const showToast = useToastStore((state) => state.showToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (bookingId == null) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    try {
      await cancelBooking(bookingId);
      showToast(
        t("bookingsCancel.cancelledToast"),
        t("bookingsCancel.cancelledToastDesc"),
      );
    } catch (error) {
      console.error("Не удалось отменить бронь", error);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--backdrop)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("bookingsCancel.title")}
        className="relative w-full max-w-[360px] rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-[20px] shadow-[var(--shadow-modal)]"
        onClick={(e) => e.stopPropagation()}
        data-testid={
          bookingId != null ? `booking-cancel-modal-${bookingId}` : "booking-cancel-modal"
        }
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute right-[14px] top-[14px] grid h-[36px] w-[36px] place-items-center rounded-full text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--bg-surface-muted)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>

        <div className="mx-auto mt-[10px] grid h-[76px] w-[76px] place-items-center rounded-full bg-[rgba(224,36,36,0.14)] text-[#e02424]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M6 7l1 12.4A2 2 0 0 0 9 21.2h6a2 2 0 0 0 2-1.8L18 7M10 11v6M14 11v6" />
          </svg>
        </div>

        <h3 className="mt-[14px] text-center text-[20px] font-bold text-[var(--text-primary)]">
          {t("bookingsCancel.title")}
        </h3>
        <p className="mx-auto mt-[6px] max-w-[280px] text-center text-[14px] font-medium text-[var(--text-secondary)]">
          {`${t("bookingsCancel.confirmPrefix")} ${shopName}`.trim()}
        </p>

        <div className="mt-[16px] flex items-center gap-[12px] rounded-[14px] bg-[var(--bg-surface-muted)] p-[10px]">
          <div className="relative h-[92px] w-[112px] shrink-0 overflow-hidden rounded-[10px] bg-[var(--bg-inactive)]">
            {shopImage ? (
              <Image
                src={shopImage}
                alt={shopName}
                fill
                className="object-cover"
                unoptimized={isRemoteShopImage(shopImage)}
              />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-[5px]">
            <span className="truncate text-[15px] font-bold text-[var(--text-primary)]">
              {shopName}
            </span>
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">
              {shopAddress}
            </span>
            <span className="flex w-fit items-center gap-[6px] rounded-[8px] bg-[var(--bg-surface)] px-[10px] py-[6px] text-[12px] font-semibold text-[var(--text-primary)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
              {formatBookingDate(bookingDate, locale)}
            </span>
          </div>
        </div>

        <aside
          className="mt-[12px] flex items-start gap-[10px] rounded-[12px] bg-[var(--bg-active-soft)] p-[12px]"
          data-testid="booking-cancel-refund-info"
        >
          <span className="mt-[1px] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[var(--primary)] text-[13px] font-bold text-white" aria-hidden="true">
            !
          </span>
          <p className="text-[13px] font-semibold leading-[1.4] text-[var(--text-primary)]">
            {t("bookingsCancel.refundHint")}
          </p>
        </aside>

        <div className="mt-[16px] flex gap-[10px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[14px] bg-[var(--primary)] py-4 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--primary-hover)] active:scale-[0.98]"
            data-testid={
              bookingId != null
                ? `booking-cancel-dismiss-${bookingId}`
                : "booking-cancel-dismiss"
            }
          >
            {t("bookingsCancel.keep")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-[14px] bg-[#e02424] py-4 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#c81e1e] active:scale-[0.98] disabled:opacity-60"
            data-testid={
              bookingId != null
                ? `booking-cancel-confirm-${bookingId}`
                : "booking-cancel-confirm"
            }
          >
            {isSubmitting ? t("bookingsCancel.cancelling") : t("bookingsCancel.confirm")}
          </button>
        </div>
      </section>
    </div>
  );
};
