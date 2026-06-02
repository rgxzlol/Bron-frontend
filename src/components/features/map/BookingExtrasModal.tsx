"use client";

import Image from "next/image";
import { useMemo, useRef } from "react";
import { bookingExtras, type BookingExtra } from "@/data/bookingExtras";
import { formatPrice } from "@/lib/formatPrice";
import Button from "@/components/shared/Button";
import s from "./bookingExtrasModal.module.css";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const extrasInCart = useMemo(
    () => bookingExtras.filter((e) => selectedExtraIds.includes(e.id)),
    [selectedExtraIds],
  );

  const orderItems = useMemo(() => {
    const extras: OrderLineItem[] = extrasInCart.map((e) => ({
      id: e.id,
      name: e.name,
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
    <div className={s.backdrop} role="dialog" aria-modal="true" aria-label="Дополнительные услуги">
      <div className={s.modal}>
        <div className={s.header}>
          <div className={s.headerIcon} aria-hidden>
            🛍
          </div>
          <div className={s.headerText}>
            <h2 className={s.title}>Добавить что-нибудь к вашему бронированию</h2>
            <p className={s.subtitle}>
              Во время посещения вы можете приобрести напитки или доп услугу.
            </p>
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={s.carouselWrap}>
          <button
            type="button"
            className={s.carouselArrow}
            onClick={() => scrollCarousel(-1)}
            aria-label="Назад"
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
                  <h3 className={s.productName}>{extra.name}</h3>
                  <p className={s.productDesc}>{extra.description}</p>
                  <p className={s.productPrice}>{formatPrice(extra.price)} сум</p>
                  <button
                    type="button"
                    className={`${s.addBtn} ${isAdded ? s.addBtnActive : ""}`}
                    onClick={() => onToggleExtra(extra.id)}
                  >
                    {isAdded ? "Добавлено" : "Добавить"}
                  </button>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            className={s.carouselArrow}
            onClick={() => scrollCarousel(1)}
            aria-label="Вперёд"
          >
            ›
          </button>
        </div>

        <div className={s.summaryRow}>
          <div className={s.orderBlock}>
            <h3 className={s.orderTitle}>Ваш заказ</h3>
            {orderItems.map((item) => (
              <div key={item.id} className={s.orderLine}>
                <span className={s.orderName}>{item.name}</span>
                <span className={s.orderPriceWrap}>
                  <span className={s.orderPrice}>{formatPrice(item.price)} сум</span>
                  {item.removable && (
                    <button
                      type="button"
                      className={s.removeBtn}
                      onClick={() => onRemoveExtra(item.id)}
                      aria-label={`Удалить ${item.name}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className={s.totalBlock}>
            <span className={s.totalLabel}>Итого</span>
            <span className={s.totalAmount}>{formatPrice(total)} сум</span>
            <p className={s.totalHint}>✓ Экономия времени — оплатить сейчас</p>
          </div>
        </div>

        <div className={s.footer}>
          <button type="button" className={s.skipBtn} onClick={onSkip}>
            Пропустить
          </button>
          <Button text="Продолжить" className={s.continueBtn} onClick={onContinue} />
        </div>
      </div>
    </div>
  );
}
