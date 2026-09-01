"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { bookingExtras, type BookingExtra } from "@/data/bookingExtras";
import { formatPrice } from "@/lib/formatPrice";
import { getBookingExtraLabels } from "@/lib/booking/extras";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Button from "@/components/shared/Button";
import s from "./bookingExtrasModal.module.css";

export type OrderLineItem = {
  id: string;
  name: string;
  price: number;
  removable?: boolean;
  sourceId?: string;
};

type BookingExtrasModalProps = {
  baseItems: OrderLineItem[];
  extraQuantities: Record<string, number>;
  onAddExtra: (id: string) => void;
  onRemoveExtra: (id: string) => void;
  onClearExtra: (id: string) => void;
  onSkip: () => void;
  onContinue: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
};

export default function BookingExtrasModal({
  baseItems,
  extraQuantities,
  onAddExtra,
  onRemoveExtra,
  onClearExtra,
  onSkip,
  onContinue,
  onClose,
  isSubmitting = false,
}: BookingExtrasModalProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  const orderItems = useMemo(() => {
    const extras: OrderLineItem[] = Object.entries(extraQuantities).flatMap(
      ([id, quantity]) => {
        if (quantity <= 0) return [];
        const extra = bookingExtras.find((item) => item.id === id);
        if (!extra) return [];

        const labels = getBookingExtraLabels(id, t);

        return [
          {
            id: `extra-${id}`,
            sourceId: id,
            name: quantity > 1 ? `${labels.name} × ${quantity}` : labels.name,
            price: extra.price * quantity,
            removable: true,
          },
        ];
      },
    );

    return [...baseItems, ...extras];
  }, [baseItems, extraQuantities, t]);

  const total = orderItems.reduce((sum, item) => sum + item.price, 0);

  function scrollCarousel(direction: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 220;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className={s.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={t("booking.extrasTitle")}
      data-testid="booking-extras-modal"
    >
      <div className={s.modal}>
        <div className={s.handle} aria-hidden="true">
          <span className={s.handleBar} />
        </div>

        <div className={s.header}>
          <div className={s.headerText}>
            <h2 className={s.title} data-testid="booking-extras-title">
              {t("booking.extrasTitle")}
            </h2>
            <p className={s.subtitle}>{t("booking.extrasSubtitle")}</p>
          </div>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className={s.body}>
        <div className={s.carouselWrap}>
          <button
            type="button"
            className={s.carouselArrow}
            onClick={() => scrollCarousel(-1)}
            aria-label={t("common.back")}
          >
            ‹
          </button>

          <div className={s.carousel} ref={scrollRef}>
            {bookingExtras.map((extra: BookingExtra) => {
              const quantity = extraQuantities[extra.id] ?? 0;
              const labels = getBookingExtraLabels(extra.id, t);
              return (
                <article
                  key={extra.id}
                  className={`${s.productCard} ${quantity > 0 ? s.productSelected : ""}`}
                  data-testid={`booking-extra-product-${extra.id}`}
                >
                  <div className={s.productImageWrap}>
                    <Image
                      src={extra.image}
                      alt={labels.name}
                      fill
                      sizes="180px"
                      className={s.productImage}
                    />
                  </div>
                  <div className={s.productBody}>
                    <h3 className={s.productName}>{labels.name}</h3>
                    <p className={s.productDesc}>{labels.description}</p>
                    <p className={s.productPrice}>{formatPrice(extra.price)} сум</p>
                  </div>
                  {quantity > 0 ? (
                    <div className={s.qtyStepper} data-testid={`booking-extra-stepper-${extra.id}`}>
                      <button
                        type="button"
                        className={s.qtyBtn}
                        onClick={() => onRemoveExtra(extra.id)}
                        aria-label={t("booking.decreaseAria", { name: labels.name })}
                        data-testid={`booking-extra-decrease-${extra.id}`}
                      >
                        −
                      </button>
                      <span
                        className={s.qtyValue}
                        data-testid={`booking-extra-quantity-${extra.id}`}
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className={s.qtyBtn}
                        onClick={() => onAddExtra(extra.id)}
                        aria-label={t("booking.addAria", { name: labels.name })}
                        data-testid={`booking-extra-increase-${extra.id}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={s.addBtn}
                      onClick={() => onAddExtra(extra.id)}
                      aria-label={t("booking.addAria", { name: labels.name })}
                      data-testid={`booking-extra-add-${extra.id}`}
                    >
                      {t("booking.add")}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className={s.carouselArrow}
            onClick={() => scrollCarousel(1)}
            aria-label={t("common.forward")}
          >
            ›
          </button>
        </div>

        <div className={s.orderBlock} data-testid="booking-extras-order">
          <h3 className={s.orderTitle}>{t("booking.yourOrder")}</h3>
          {orderItems.map((item) => (
            <div key={item.id} className={s.orderLine} data-testid={`booking-extras-line-${item.id}`}>
              <span className={s.orderName}>{item.name}</span>
              <span className={s.orderPriceWrap}>
                <span
                  className={s.orderPrice}
                  data-testid={`booking-extras-line-price-${item.id}`}
                >
                  {formatPrice(item.price)} сум
                </span>
                {item.removable && item.sourceId && (
                  <button
                    type="button"
                    className={s.removeBtn}
                    onClick={() => onClearExtra(item.sourceId!)}
                    aria-label={t("booking.removeAria", { name: item.name })}
                  >
                    ×
                  </button>
                )}
              </span>
            </div>
          ))}

          <div className={s.totalRow}>
            <span className={s.totalLabel}>{t("booking.extrasTotal")}</span>
            <span
              className={s.totalAmount}
              data-testid="booking-extras-total"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatPrice(total)} сум
            </span>
          </div>
        </div>
        </div>

        <div className={s.footer}>
          <button
            type="button"
            className={s.skipBtn}
            onClick={onSkip}
            disabled={isSubmitting}
            data-testid="booking-extras-skip"
          >
            {t("booking.skip")}
          </button>
          <Button
            text={t("booking.continue")}
            className={s.continueBtn}
            onClick={onContinue}
            disabled={isSubmitting}
            data-testid="booking-extras-continue"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
