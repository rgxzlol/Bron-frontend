"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "@/lib/i18n/useTranslation";

type BusinessQRCodeModalProps = {
  businessName: string;
  businessId: number;
  bookingUrl: string;
  onClose: () => void;
};

export default function BusinessQRCodeModal({
  businessName,
  businessId,
  bookingUrl,
  onClose,
}: BusinessQRCodeModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
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
  }, [onClose]);

  function downloadQrCode() {
    if (!qrRef.current) return;

    const svg = new XMLSerializer().serializeToString(qrRef.current);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `bron-business-${businessId}-booking.svg`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-full max-w-[420px] flex-col items-center gap-5 rounded-[24px] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-modal)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-center">
          <h2 id={titleId} className="text-xl font-semibold">
            {t("businessDashboard.qrTitle")}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {businessName}
          </p>
        </div>

        <div className="max-w-full rounded-2xl bg-white p-3">
          <QRCodeSVG
            ref={qrRef}
            value={bookingUrl}
            size={256}
            level="H"
            marginSize={4}
            title={`${t("businessDashboard.qrTitle")}: ${businessName}`}
          />
        </div>

        <p className="break-all text-center text-xs text-[var(--text-secondary)]">
          {bookingUrl}
        </p>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={downloadQrCode}
            className="min-h-12 flex-1 rounded-xl bg-[#0a6af7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0858ce]"
          >
            {t("businessDashboard.downloadQr")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-muted)]"
          >
            {t("common.close")}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
