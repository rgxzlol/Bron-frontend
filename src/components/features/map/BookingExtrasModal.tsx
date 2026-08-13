"use client";

import Image from "next/image";
import { useMemo, useRef } from "react";
import { bookingExtras, type BookingExtra } from "@/data/bookingExtras";
import { formatPrice } from "@/lib/formatPrice";
import Button from "@/components/shared/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  EXTRAS_DESC_KEYS,
  EXTRAS_NAME_KEYS,
  translateLabel,
} from "@/lib/i18n/labels";
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
  onSkip: () => void;
  onContinue: () => void;
  onClose: () => void;
};

export default function BookingExtrasModal({
  baseItems,
  extraQuantities,
  onAddExtra,
  onRemoveExtra,
  onSkip,
  onContinue,
  onClose,
}: BookingExtrasModalProps) {
  const { t, locale } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  function extraName(id: string, fallback: string) {
    return translateLabel(t, id, EXTRAS_NAME_KEYS) || fallback;
  }

  function extraDesc(id: string, fallback: string) {
    return translateLabel(t, id, EXTRAS_DESC_KEYS) || fallback;
  }

  const orderItems = useMemo(() => {
    const extras: OrderLineItem[] = Object.entries(extraQuantities).flatMap(
      ([id, quantity]) => {
        if (quantity <= 0) return [];
        const extra = bookingExtras.find((item) => item.id === id);
        if (!extra) return [];

        const name = extraName(id, extra.name);

        return [
          {
            id: `extra-${id}`,
            sourceId: id,
            name: quantity > 1 ? `${name} × ${quantity}` : name,
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

  return (
    <div
      className={s.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={t("booking.extrasDialog")}
    >
      <div className={s.modal}>
        <div className={s.header}>
          <div className={s.headerIcon} aria-hidden>
            🛍
          </div>
          <div className={s.headerText}>
            <h2 className={s.title}>{t("booking.extrasTitle")}</h2>
            <p className={s.subtitle}>{t("booking.extrasSubtitle")}</p>
          </div>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className={s.carouselWrap}>
          <button
            type="button"
            className={s.carouselArrow}
            onClick={() => scrollCarousel(-1)}
            aria-label={t("booking.back")}
          >
            ‹
          </button>

          <div className={s.carousel} ref={scrollRef}>
            {bookingExtras.map((extra: BookingExtra) => {
              const quantity = extraQuantities[extra.id] ?? 0;
              const name = extraName(extra.id, extra.name);
              const description = extraDesc(extra.id, extra.description);
              return (
                <article key={extra.id} className={s.productCard}>
                  <div className={s.productImageWrap}>
                    <Image
                      src={extra.image}
                      alt={name}
                      fill
                      sizes="160px"
                      className={s.productImage}
                    />
                  </div>
                  <h3 className={s.productName}>{name}</h3>
                  <p className={s.productDesc}>{description}</p>
                  <p className={s.productPrice}>
                    {formatPrice(extra.price, locale)} {t("common.sum")}
                  </p>
                  {quantity > 0 ? (
                    <div className={s.qtyControls}>
                      <button
                        type="button"
                        className={s.qtyBtn}
                        onClick={() => onRemoveExtra(extra.id)}
                        aria-label={t("booking.decreaseAria", { name })}
                      >
                        −
                      </button>
                      <span className={s.qtyValue}>{quantity}</span>
                      <button
                        type="button"
                        className={s.qtyBtn}
                        onClick={() => onAddExtra(extra.id)}
                        aria-label={t("booking.addAria", { name })}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={s.addBtn}
                      onClick={() => onAddExtra(extra.id)}
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
            aria-label={t("booking.forward")}
          >
            ›
          </button>
        </div>

        <div className={s.summaryRow}>
          <div className={s.orderBlock}>
            <h3 className={s.orderTitle}>{t("booking.yourOrder")}</h3>
            {orderItems.map((item) => (
              <div key={item.id} className={s.orderLine}>
                <span className={s.orderName}>{item.name}</span>
                <span className={s.orderPriceWrap}>
                  <span className={s.orderPrice}>
                    {formatPrice(item.price, locale)} {t("common.sum")}
                  </span>
                  {item.removable && item.sourceId && (
                    <button
                      type="button"
                      className={s.removeBtn}
                      onClick={() => onRemoveExtra(item.sourceId!)}
                      aria-label={t("booking.removeAria", { name: item.name })}
                    >
                      ×
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className={s.totalBlock}>
            <span className={s.totalLabel}>{t("booking.extrasTotal")}</span>
            <span className={s.totalAmount}>
              {formatPrice(total, locale)} {t("common.sum")}
            </span>
            <p className={s.totalHint}>{t("booking.payNowHint")}</p>
          </div>
        </div>

        <div className={s.footer}>
          <button type="button" className={s.skipBtn} onClick={onSkip}>
            {t("booking.skip")}
          </button>
          <Button
            text={t("booking.continue")}
            className={s.continueBtn}
            onClick={onContinue}
          />
        </div>
      </div>
    </div>
  );
}
