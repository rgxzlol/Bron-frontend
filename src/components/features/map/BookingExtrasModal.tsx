"use client";

import Image from "next/image";
import { useMemo, useRef } from "react";
import { bookingExtras, type BookingExtra } from "@/data/bookingExtras";
import { formatPrice } from "@/lib/formatPrice";
import Button from "@/components/shared/Button";
import s from "./bookingExtrasModal.module.css";
import { useTranslations } from 'next-intl';

export type OrderLineItem = {
  id: string;
  name: string;
  price: number;
  removable?: boolean;
};

type BookingExtrasModalProps = {
  baseItems: OrderLineItem[];
  selectedExtraIds: string[];
  onToggleExtra: (id: string) => void;
  onRemoveExtra: (id: string) => void;
  onSkip: () => void;
  onContinue: () => void;
  onClose: () => void;
};

export default function BookingExtrasModal({
  baseItems,
  selectedExtraIds,
  onToggleExtra,
  onRemoveExtra,
  onSkip,
  onContinue,
  onClose,
}: BookingExtrasModalProps) {
  const t = useTranslations('BookingExtrasModal');
  const tData = useTranslations('data');
  const td = (text: string) => text?.startsWith('data.') ? tData(text.replace('data.', '') as any) : text;
  const scrollRef = useRef<HTMLDivElement>(null);

  const extrasInCart = useMemo(
    () => bookingExtras.filter((e) => selectedExtraIds.includes(e.id)),
    [selectedExtraIds],
  );

  const orderItems = useMemo(() => {
    const extras: OrderLineItem[] = extrasInCart.map((e) => ({
      id: e.id,
      name: td(e.name),
      price: e.price,
      removable: true,
    }));
    return [...baseItems, ...extras];
  }, [baseItems, extrasInCart]);

  const total = orderItems.reduce((sum, item) => sum + item.price, 0);

  function scrollCarousel(direction: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 220;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <div className={s.backdrop} role="dialog" aria-modal="true" aria-label={t('additionalServices')}>
      <div className={s.modal}>
        <div className={s.header}>
          <div className={s.headerIcon} aria-hidden>
            🛍
          </div>
          <div className={s.headerText}>
            <h2 className={s.title}>{t('addSomethingToYourBooking')}</h2>
            <p className={s.subtitle}>
              {t('duringVisitYouCanPurchaseDrinksOrAdditionalServices')}
            </p>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label={t('close')}>
            ×
          </button>
        </div>

        <div className={s.carouselWrap}>
          <button
            type="button"
            className={s.carouselArrow}
            onClick={() => scrollCarousel(-1)}
            aria-label={t('back')}
          >
            ‹
          </button>

          <div className={s.carousel} ref={scrollRef}>
            {bookingExtras.map((extra: BookingExtra) => {
              const isAdded = selectedExtraIds.includes(extra.id);
              return (
                <article key={extra.id} className={s.productCard}>
                  <div className={s.productImageWrap}>
                    <Image
                      src={extra.image}
                      alt={extra.name}
                      fill
                      sizes="160px"
                      className={s.productImage}
                    />
                  </div>
                  <h3 className={s.productName}>{td(extra.name)}</h3>
                  <p className={s.productDesc}>{td(extra.description)}</p>
                  <p className={s.productPrice}>{formatPrice(extra.price)} {t('sum')}</p>
                  <button
                    type="button"
                    className={`${s.addBtn} ${isAdded ? s.addBtnActive : ""}`}
                    onClick={() => onToggleExtra(extra.id)}
                  >
                    {isAdded ? t('added') : t('add')}
                  </button>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className={s.carouselArrow}
            onClick={() => scrollCarousel(1)}
            aria-label={t('forward')}
          >
            ›
          </button>
        </div>

        <div className={s.summaryRow}>
          <div className={s.orderBlock}>
            <h3 className={s.orderTitle}>{t('yourOrder')}</h3>
            {orderItems.map((item) => (
              <div key={item.id} className={s.orderLine}>
                <span className={s.orderName}>{item.name}</span>
                <span className={s.orderPriceWrap}>
                  <span className={s.orderPrice}>{formatPrice(item.price)} {t('sum')}</span>
                  {item.removable && (
                    <button
                      type="button"
                      className={s.removeBtn}
                      onClick={() => onRemoveExtra(item.id)}
                      aria-label={`${t('remove')} ${item.name}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className={s.totalBlock}>
            <span className={s.totalLabel}>{t('total')}</span>
            <span className={s.totalAmount}>{formatPrice(total)} {t('sum')}</span>
            <p className={s.totalHint}>{t('saveTimePayNow')}</p>
          </div>
        </div>

        <div className={s.footer}>
          <button type="button" className={s.skipBtn} onClick={onSkip}>
            {t('skip')}
          </button>
          <Button text={t('continue')} className={s.continueBtn} onClick={onContinue} />
        </div>
      </div>
    </div>
  );
}
