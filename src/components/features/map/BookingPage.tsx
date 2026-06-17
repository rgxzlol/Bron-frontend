"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/lib/assets";
import { formatPrice, formatRating } from "@/lib/formatPrice";
import { pluralizeReviews } from "@/lib/pluralize";
import { bookingExtras } from "@/data/bookingExtras";
import { routes } from "@/config/routes";
import type { ShopsType } from "@/types/shops.types";
import Button from "@/components/shared/Button";
import DatePicker from "@/components/shared/DatePicker";
import TimePicker from "@/components/shared/TimePicker";
import { formatDateRu } from "@/lib/formatDate";
import BookingExtrasModal, { type OrderLineItem } from "./BookingExtrasModal";
import s from "./bookingPage.module.css";

type BookingPageProps = {
  shop: ShopsType;
  selectedServiceIds?: string[];
  onBack: () => void;
};

type BookingStep = 1 | 2 | 3;



export default function BookingPage({
  shop,
  selectedServiceIds = [],
  onBack,
}: BookingPageProps) {
  const [step, setStep] = useState<BookingStep>(1);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => new Date(2026, 5, 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 5, 12));
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const today = useMemo(() => new Date(2026, 5, 2), []);

  const selectedServices = useMemo(() => {
    if (!shop.services?.length || !selectedServiceIds.length) return [];
    return shop.services.filter((svc) => selectedServiceIds.includes(svc.id));
  }, [shop.services, selectedServiceIds]);

  const basePrice = useMemo(() => {
    if (selectedServices.length > 0) {
      return selectedServices.reduce((sum, svc) => sum + svc.priceFrom, 0);
    }
    return shop.price;
  }, [selectedServices, shop.price]);

  const baseBookingName = useMemo(() => {
    if (selectedServices.length === 1) return selectedServices[0].title;
    if (selectedServices.length > 1) return `Услуги (${selectedServices.length})`;
    return shop.type === "Больница" ? shop.category : "Бронирование зала";
  }, [selectedServices, shop]);

  const durationLabel = useMemo(() => {
    if (selectedServices.length > 0) {
      const mins = selectedServices.reduce((sum, svc) => sum + svc.durationMin, 0);
      return `${mins} мин`;
    }
    return shop.type === "Больница" ? `${shop.time} мин` : "1 час";
  }, [selectedServices, shop]);

  const baseLineItems = useMemo<OrderLineItem[]>(
    () => [
      {
        id: "booking-base",
        name: baseBookingName,
        price: basePrice,
      },
    ],
    [baseBookingName, basePrice],
  );

  const extraLineItems = useMemo(
    () =>
      bookingExtras
        .filter((e) => selectedExtraIds.includes(e.id))
        .map((e) => ({
          id: e.id,
          name: e.name,
          price: e.price,
          removable: true,
        })),
    [selectedExtraIds],
  );

  const allLineItems = useMemo(
    () => [...baseLineItems, ...extraLineItems],
    [baseLineItems, extraLineItems],
  );

  const total = allLineItems.reduce((sum, item) => sum + item.price, 0);



  const priceLabel = `от ${formatPrice(shop.price)} сум`;
  const priceSubLabel = shop.type === "Больница" ? "за приём" : "за час";
  const displayEmail = form.email.trim() || "Ivan.Petrov@gmail.com";

  function toggleExtra(id: string) {
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function removeExtra(id: string) {
    setSelectedExtraIds((prev) => prev.filter((x) => x !== id));
  }

  function handlePay() {
    setShowExtrasModal(true);
  }

  function finishExtras() {
    setShowExtrasModal(false);
    setStep(3);
  }

  function renderStepper() {
    const steps = [
      { num: 1, label: "Выбор времени" },
      { num: 2, label: "Ваши данные" },
      { num: 3, label: "Подтверждение" },
    ];

    return (
      <nav className={s.stepper} aria-label="Шаги бронирования">
        {steps.map(({ num, label }) => {
          const isDone = step > num;
          const isActive = step === num;
          return (
            <div
              key={num}
              className={`${s.step} ${isDone ? s.stepDone : ""} ${isActive ? s.stepActive : ""}`}
            >
              <span className={s.stepCircle}>{isDone ? "✓" : num}</span>
              <span className={s.stepLabel}>{label}</span>
            </div>
          );
        })}
      </nav>
    );
  }

  function renderTopCard() {
    return (
      <section className={s.topCard}>
        <div className={s.imageWrap}>
          <Image
            className={s.image}
            src={shop.img}
            alt={shop.title}
            sizes="(max-width: 1024px) 100vw, 420px"
            priority
          />
          <span className={s.slideCounter}>1/3</span>
        </div>

        <div className={s.topBody}>
          <div className={s.topHead}>
            <div>
              <span className={s.tag}>{shop.type}</span>
              <h1 className={s.title}>{shop.title}</h1>
              <div className={s.rating}>
                <Image src={assets.popular.starRating} alt="" width={18} height={18} />
                <span>{formatRating(shop.rating)}</span>
                <span className={s.ratingMuted}>
                  ({shop.reviews} {pluralizeReviews(shop.reviews)})
                </span>
              </div>
            </div>
            {step > 1 ? (
              <button
                type="button"
                className={s.backBtn}
                onClick={() => setStep((st) => (st - 1) as BookingStep)}
              >
                Назад
              </button>
            ) : (
              <button type="button" className={s.backBtn} onClick={onBack}>
                Назад
              </button>
            )}
          </div>

          <div className={s.contactRow}>
            <div className={s.contactItem}>
              <Image src={assets.map.geoMark} alt="" width={20} height={20} />
              <div className={s.contactText}>
                <span>{shop.address}</span>
                <span className={s.contactSub}>{shop.district}</span>
              </div>
            </div>
            <div className={s.contactItem}>
              <Image src={assets.map.phoneIcon} alt="" width={20} height={20} />
              <a href={`tel:${shop.phone.replace(/\s/g, "")}`}>{shop.phone}</a>
            </div>
          </div>

          <div className={s.stats}>
            <div className={s.statBox}>
              <span className={s.statLabel}>Открыто</span>
              <span className={s.statValue}>{shop.hours}</span>
            </div>
            <div className={s.statBox}>
              <span className={s.statLabel}>Своб.Мест</span>
              <span className={`${s.statValue} ${s.statValueRow}`}>
                <Image src={assets.map.freeSeat} alt="" width={16} height={16} />
                {shop.freeSeats}
              </span>
            </div>
            <div className={s.statBox}>
              <span className={s.statLabel}>{priceLabel}</span>
              <span className={s.statValue}>{priceSubLabel}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderStep1() {
    return (
      <>
        <section className={s.timeCard}>
          <DatePicker
            viewMonth={viewMonth}
            onViewMonthChange={setViewMonth}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            today={today}
          />
          <TimePicker
            selectedTime={selectedTime}
            onSelectedTimeChange={setSelectedTime}
          />
        </section>

        <div className={s.stepFooter}>
          <div className={s.stepFooterInfo}>
            <span>
              Вы выбрали <strong>{formatDateRu(selectedDate)}, {selectedTime}</strong>
            </span>
            <span className={s.stepFooterMuted}>Продолжительность {durationLabel}</span>
          </div>
          <div className={s.stepFooterActions}>
            <span className={s.stepFooterPrice}>
              Итог за {durationLabel} {formatPrice(basePrice)} сум
            </span>
            <Button
              text="Продолжить"
              className={s.continueBtn}
              onClick={() => setStep(2)}
            />
            <span className={s.footerHint}>Ваши данные защищены</span>
          </div>
        </div>
      </>
    );
  }

  function renderPaymentSummary(
    items: OrderLineItem[],
    itemsTotal: number,
    payButtonText: string,
    onPay?: () => void,
    paid = false,
  ) {
    return (
      <aside className={s.payCard}>
        <h2 className={s.payTitle}>Оплата</h2>

        {items.map((item) => (
          <div key={item.id} className={s.lineItem}>
            <span className={s.lineName}>{item.name}</span>
            <span className={s.linePrice}>{formatPrice(item.price)} сум</span>
          </div>
        ))}

        <div className={s.total}>
          <span>Итого:</span>
          <span className={s.totalAmount}>{formatPrice(itemsTotal)} сум</span>
        </div>

        {!paid && (
          <div className={s.payMethods} role="radiogroup" aria-label="Способ оплаты">
            {[
              { id: "card", title: "Банковская карта", sub: "Visa, MasterCard, Uzcard" },
              { id: "click", title: "Click / Payme", sub: "Мгновенная оплата" },
              { id: "other", title: "Другие способы", sub: "Apple Pay, Google Pay" },
            ].map((method) => (
              <label
                key={method.id}
                className={`${s.payOption} ${paymentMethod === method.id ? s.payOptionSelected : ""
                  }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                <div>
                  <div className={s.payOptionTitle}>{method.title}</div>
                  <div className={s.payOptionSub}>{method.sub}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        <Button
          text={payButtonText}
          className={paid ? s.paidBtn : s.payBtn}
          onClick={onPay}
          disabled={paid}
        />
      </aside>
    );
  }

  function renderStep2() {
    return (
      <div className={s.columns}>
        <section className={s.formCard}>
          <h2 className={s.formTitle}>Ваши данные</h2>
          <p className={s.formSubtitle}>Заполните информацию для бронирования</p>

          <label className={s.field}>
            <span className={s.label}>Имя и фамилия</span>
            <input
              className={s.input}
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Иван Иванов"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Номер телефона</span>
            <input
              className={s.input}
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+998 90 000 00 00"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Электроная почта (необязательно)</span>
            <input
              className={s.input}
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </label>

          <div className={s.guests}>
            <div className={s.guestsRow}>
              <span className={s.label}>Количество гостей</span>
              <div className={s.counter}>
                <button
                  type="button"
                  className={s.counterBtn}
                  onClick={() => setGuests((n) => Math.max(1, n - 1))}
                  disabled={guests <= 1}
                  aria-label="Уменьшить"
                >
                  −
                </button>
                <span className={s.counterValue}>{guests}</span>
                <button
                  type="button"
                  className={s.counterBtn}
                  onClick={() => setGuests((n) => n + 1)}
                  aria-label="Увеличить"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </section>

        {renderPaymentSummary(baseLineItems, basePrice, "Оплатить", handlePay)}
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className={s.confirmColumns}>
        <section className={s.confirmCard}>
          <div className={s.successIcon} aria-hidden>
            ✓
          </div>
          <h2 className={s.confirmTitle}>Бронирование подтверждено!</h2>
          <p className={s.confirmSub}>
            Мы отправили подтверждение на вашу почту{" "} <br />
            <span className={s.confirmEmail}>{displayEmail}</span>
          </p>

          <div className={s.whatsNext}>
            <h3 className={`${s.whatsNextTitle} flex gap-[9px]`}>
              <Image src={assets.header.notification} alt="" className={s.whatsNextNotificationIcon} />
              Что дальше?
            </h3>
            <ul className={s.whatsNextList}>
              <li className="flex gap-[5px]">
                <Image src={assets.popular.timeIcon} alt="" className={s.whatsNextTimeIcon} />
                Приходите за 10–15 минут до начала бронирования.
              </li>
              <li className="ml-[26px]">Отмена возможна не позднее чем за 2 часа до визита.</li>
            </ul>
            <Button className="bg-transparent border-2 border-[#0A6AF7] w-full mt-[42px] !text-black border-[]" text="Оставить отзыв"></Button>
          </div>

          <div className={s.confirmActions}>
            <Link href={routes.bookings} className={s.secondaryBtn}>
              Посмотреть бронь
            </Link>
            <Link href={routes.home} className={`${s.primaryLink}`}>
              <Button text="На главную" className={s.primaryLinkBtn} as="span" />
            </Link>
          </div>
        </section>

        {renderPaymentSummary(allLineItems, total, "Оплачено", undefined, true)}
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.pageTop}>
        <button type="button" className={s.backToMap} onClick={onBack}>
          Назад к карте
        </button>
      </div>

      {renderTopCard()}
      {renderStepper()}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {step < 3 && (
        <div className={s.security}>
          <Image src={assets.map.security} alt="" />
          <div>
            <p className={s.securityTitle}>Ваши данные защищены</p>
            <p className={s.securityText}>
              Мы используем шифрование для защиты ваших персональных данных и платежей.
            </p>
          </div>
        </div>
      )}

      {showExtrasModal && (
        <BookingExtrasModal
          baseItems={baseLineItems}
          selectedExtraIds={selectedExtraIds}
          onToggleExtra={toggleExtra}
          onRemoveExtra={removeExtra}
          onSkip={finishExtras}
          onContinue={finishExtras}
          onClose={() => setShowExtrasModal(false)}
        />
      )}
    </div>
  );
}
