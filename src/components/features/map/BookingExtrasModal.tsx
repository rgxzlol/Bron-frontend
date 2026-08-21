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
  const scrollRef = useRef<HTMLDivElement>(null);

  const orderItems = useMemo(() => {
    const extras: OrderLineItem[] = Object.entries(extraQuantities).flatMap(
      ([id, quantity]) => {
        if (quantity <= 0) return [];
        const extra = bookingExtras.find((item) => item.id === id);
        if (!extra) return [];

        return [
          {
            id: `extra-${id}`,
            sourceId: id,
            name: quantity > 1 ? `${extra.name} × ${quantity}` : extra.name,
            price: extra.price * quantity,
            removable: true,
          },
        ];
      },
    );

    return [...baseItems, ...extras];
  }, [baseItems, extraQuantities]);

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
              const quantity = extraQuantities[extra.id] ?? 0;
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
                  {quantity > 0 ? (
                    <div className={s.qtyControls}>
                      <button
                        type="button"
                        className={s.qtyBtn}
                        onClick={() => onRemoveExtra(extra.id)}
                        aria-label={`Уменьшить ${extra.name}`}
                      >
                        −
                      </button>
                      <span className={s.qtyValue}>{quantity}</span>
                      <button
                        type="button"
                        className={s.qtyBtn}
                        onClick={() => onAddExtra(extra.id)}
                        aria-label={`Добавить ${extra.name}`}
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
                      Добавить
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
                  {item.removable && item.sourceId && (
                    <button
                      type="button"
                      className={s.removeBtn}
                      onClick={() => onRemoveExtra(item.sourceId!)}
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
