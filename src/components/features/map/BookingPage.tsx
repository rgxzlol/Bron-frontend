"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/lib/assets";
import { formatPrice, formatRating } from "@/lib/formatPrice";
import { pluralizeReviews } from "@/lib/pluralize";
import { getShopGallery, isRemoteShopImage } from "@/lib/business/shopImages";
import { bookingExtras } from "@/data/bookingExtras";
import { routes } from "@/config/routes";
import type { ShopsType } from "@/types/shops.types";
import Button from "@/components/shared/Button";
import DatePicker from "@/components/shared/DatePicker";
import TimePicker from "@/components/shared/TimePicker";
import { formatDateRu } from "@/lib/formatDate";
import {
  buildTimeGroupsFromHours,
  getAvailableSlotsForDate,
  getDefaultBookingTime,
  startOfDay,
} from "@/lib/booking/timeSlots";
import BookingExtrasModal, { type OrderLineItem } from "./BookingExtrasModal";
import CardPaymentModal from "./CardPaymentModal";
import ReviewModal from "@/components/features/review/ReviewModal";
import { branchesApi } from "@/lib/api";
import {
  addMinutesToTime,
  formatBookingDate,
} from "@/lib/api/mappers";
import { useAuthStore } from "@/store/auth.store";
import { useBookingStore } from "@/store/booking.store";
import { useToastStore } from "@/store/toast.store";
import s from "./bookingPage.module.css";

type BookingPageProps = {
  shop: ShopsType;
  selectedServiceIds?: string[];
  onBack: () => void;
};

type BookingStep = 1 | 2 | 3;

const RU_MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function formatDateShortRu(date: Date) {
  return `${date.getDate()} ${RU_MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}

export default function BookingPage({
  shop,
  selectedServiceIds = [],
  onBack,
}: BookingPageProps) {
  const [step, setStep] = useState<BookingStep>(1);
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState(() => {
    const slots = buildTimeGroupsFromHours(shop.hours).flatMap((group) => group.slots);
    const todayDate = startOfDay(new Date());
    return getDefaultBookingTime(slots, todayDate, new Date());
  });
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = useAuthStore((state) => state.token);
  const createBooking = useBookingStore((state) => state.createBooking);
  const showToast = useToastStore((state) => state.showToast);

  const today = useMemo(() => startOfDay(new Date()), []);

  const timeGroups = useMemo(
    () => buildTimeGroupsFromHours(shop.hours),
    [shop.hours],
  );

  const allTimeSlots = useMemo(
    () => timeGroups.flatMap((group) => group.slots),
    [timeGroups],
  );

  const disabledTimeSlots = useMemo(() => {
    const available = getAvailableSlotsForDate(allTimeSlots, selectedDate, new Date());
    const availableSet = new Set(available);
    return new Set(allTimeSlots.filter((slot) => !availableSet.has(slot)));
  }, [allTimeSlots, selectedDate]);

  const hourlyTimeSlots = useMemo(
    () => allTimeSlots.filter((slot) => slot.endsWith(":00")),
    [allTimeSlots],
  );

  useEffect(() => {
    const available = getAvailableSlotsForDate(allTimeSlots, selectedDate, new Date());
    if (!available.includes(selectedTime)) {
      setSelectedTime(getDefaultBookingTime(allTimeSlots, selectedDate, new Date()));
    }
  }, [allTimeSlots, selectedDate, selectedTime]);

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

  const maxGuests = 20;

  const bookingPrice = useMemo(() => basePrice * guests, [basePrice, guests]);

  const baseLineItems = useMemo<OrderLineItem[]>(
    () => [
      {
        id: "booking-base",
        name:
          guests > 1 ? `${baseBookingName} (${guests} гост.)` : baseBookingName,
        price: bookingPrice,
      },
    ],
    [baseBookingName, bookingPrice, guests],
  );

  const extraLineItems = useMemo(
    () =>
      Object.entries(extraQuantities).flatMap(([id, quantity]) => {
        if (quantity <= 0) return [];
        const extra = bookingExtras.find((item) => item.id === id);
        if (!extra) return [];

        return [
          {
            id: `extra-${id}`,
            name: quantity > 1 ? `${extra.name} × ${quantity}` : extra.name,
            price: extra.price * quantity,
            removable: true,
            sourceId: id,
          },
        ];
      }),
    [extraQuantities],
  );

  const allLineItems = useMemo(
    () => [...baseLineItems, ...extraLineItems],
    [baseLineItems, extraLineItems],
  );

  const total = allLineItems.reduce((sum, item) => sum + item.price, 0);



  const priceLabel = `от ${formatPrice(shop.price)} сум`;
  const priceSubLabel = shop.type === "Больница" ? "за приём" : "за час";
  const displayEmail = form.email.trim() || "Ivan.Petrov@gmail.com";

  const isFormValid = useMemo(() => {
    const name = form.name.trim();
    const phoneDigits = form.phone.replace(/\D/g, "");
    return name.length >= 2 && phoneDigits.length >= 9;
  }, [form.name, form.phone]);

  function addExtra(id: string) {
    setExtraQuantities((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }

  function removeExtra(id: string) {
    setExtraQuantities((prev) => {
      const next = { ...prev };
      if (!next[id]) return prev;
      if (next[id] <= 1) {
        delete next[id];
      } else {
        next[id] -= 1;
      }
      return next;
    });
  }

  function validateForm() {
    const errors: { name?: string; phone?: string } = {};
    const name = form.name.trim();
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (name.length < 2) {
      errors.name = "Введите имя и фамилию";
    }
    if (phoneDigits.length < 9) {
      errors.phone = "Введите корректный номер телефона";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handlePay() {
    if (!validateForm()) return;
    setShowExtrasModal(true);
  }

  function proceedToPayment() {
    if (paymentMethod === "card") {
      setShowCardModal(true);
    } else {
      setStep(3);
      showToast(
        "Бронирование прошло успешно",
        "Бронирование прошло успешно, приходите за 10 мин до бронирования.",
      );
    }
  }

  async function finishExtras() {
    if (!token) {
      alert("Войдите в аккаунт, чтобы оформить бронь");
      return;
    }

    if (!shop.apiBusinessId) {
      setShowExtrasModal(false);
      proceedToPayment();
      return;
    }

    const serviceId = selectedServiceIds[0] ?? shop.services?.[0]?.id;
    if (!serviceId || !/^\d+$/.test(serviceId)) {
      alert("Для этого места не выбрана услуга из API");
      return;
    }

    setIsSubmitting(true);

    try {
      let branchId = shop.apiBranchId;
      if (!branchId) {
        const branches = await branchesApi.listByBusiness(shop.apiBusinessId);
        branchId = branches[0]?.id;
      }

      if (!branchId) {
        throw new Error("У бизнеса нет доступного филиала");
      }

      const durationMin =
        selectedServices[0]?.durationMin ??
        shop.services?.find((item) => item.id === serviceId)?.durationMin ??
        60;

      await createBooking({
        business_id: shop.apiBusinessId,
        service_id: Number(serviceId),
        branch_id: branchId,
        booking_date: formatBookingDate(selectedDate),
        start_time: selectedTime,
        end_time: addMinutesToTime(selectedTime, durationMin),
        guest_count: guests,
      });

      setShowExtrasModal(false);
      proceedToPayment();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Не удалось создать бронь");
    } finally {
      setIsSubmitting(false);
    }
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
    const gallery = getShopGallery(shop);
    const previewImage = gallery[0] ?? shop.img;

    return (
      <section className={s.topCard}>
        <div className={s.imageWrap}>
          {isRemoteShopImage(previewImage) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={s.image}
              src={previewImage}
              alt={shop.title}
            />
          ) : (
            <Image
              className={s.image}
              src={previewImage}
              alt={shop.title}
              sizes="(max-width: 1024px) 100vw, 420px"
              priority
            />
          )}
          <span className={`${s.tag} ${s.imageTag}`}>{shop.type}</span>
          <span className={s.slideCounter}>1/{gallery.length}</span>
        </div>

        <div className={s.topBody}>
          <div className={s.topHead}>
            <div>
              <span className={`${s.tag} ${s.bodyTag}`}>{shop.type}</span>
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
          <div className={s.desktopPickers}>
            <DatePicker
              viewMonth={viewMonth}
              onViewMonthChange={setViewMonth}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              today={today}
              minDate={today}
            />
            <TimePicker
              selectedTime={selectedTime}
              onSelectedTimeChange={setSelectedTime}
              timeGroups={timeGroups}
              disabledSlots={disabledTimeSlots}
            />
          </div>

          <div className={s.mobilePickers}>
            <h2 className={s.pickTitle}>Выбери дату</h2>
            <button
              type="button"
              className={s.dateField}
              onClick={() => setShowMobileCalendar((value) => !value)}
              aria-expanded={showMobileCalendar}
            >
              <span className={s.dateFieldLeft}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
                  <path d="M3.5 9.5h17M8 3v4M16 3v4" />
                </svg>
                {formatDateShortRu(selectedDate)}
              </span>
              <svg
                className={`${s.dateChevron} ${showMobileCalendar ? s.dateChevronOpen : ""}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 4.5 19 12 8 19.5v-15z" />
              </svg>
            </button>

            {showMobileCalendar && (
              <div className={s.mobileCalendar}>
                <DatePicker
                  viewMonth={viewMonth}
                  onViewMonthChange={setViewMonth}
                  selectedDate={selectedDate}
                  onSelectedDateChange={(date) => {
                    setSelectedDate(date);
                    setShowMobileCalendar(false);
                  }}
                  today={today}
                  minDate={today}
                />
              </div>
            )}

            <h2 className={s.pickTitle}>Выбери время</h2>
            <div className={s.timeGrid}>
              {hourlyTimeSlots.map((slot) => {
                const disabled = disabledTimeSlots.has(slot);
                const selected = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    className={`${s.timeChip} ${selected ? s.timeChipActive : ""}`}
                    onClick={() => setSelectedTime(slot)}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
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
              Итог за {durationLabel} {formatPrice(bookingPrice)} сум
            </span>
            <Button
              text="Продолжить"
              className={s.continueBtn}
              onClick={() => setStep(2)}
            />
            <span className={s.footerHint}>Ваши данные защищены</span>
          </div>
        </div>

        <div className={s.mobileFooter}>
          <p className={s.mobileTotal}>Итог: {formatPrice(bookingPrice)}сум</p>
          <Button
            text="Продолжить"
            className={s.mobileContinue}
            onClick={() => setStep(2)}
          />
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
    payDisabled = false,
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
          disabled={paid || payDisabled}
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
            <span className={s.label}>
              Имя и фамилия <span className={s.required}>*</span>
            </span>
            <input
              className={`${s.input} ${formErrors.name ? s.inputError : ""}`}
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Иван Иванов"
              required
            />
            {formErrors.name && <span className={s.fieldError}>{formErrors.name}</span>}
          </label>

          <label className={s.field}>
            <span className={s.label}>
              Номер телефона <span className={s.required}>*</span>
            </span>
            <input
              className={`${s.input} ${formErrors.phone ? s.inputError : ""}`}
              type="tel"
              value={form.phone}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, phone: e.target.value }));
                if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              placeholder="+998 90 000 00 00"
              required
            />
            {formErrors.phone && <span className={s.fieldError}>{formErrors.phone}</span>}
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
              <div>
                <span className={s.label}>Количество гостей</span>
              </div>
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
                  onClick={() => setGuests((n) => Math.min(maxGuests, n + 1))}
                  disabled={guests >= maxGuests}
                  aria-label="Увеличить"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </section>

        {renderPaymentSummary(baseLineItems, bookingPrice, "Оплатить", handlePay, false, !isFormValid)}
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center py-8 text-center">
        <div className="relative flex h-[150px] w-[150px] items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#16a34a]/10" />
          <span className="absolute inset-5 rounded-full bg-[#16a34a]/20" />
          <span className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#16a34a] shadow-[0_12px_28px_-6px_rgba(22,163,74,0.6)]">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        <h2 className="mt-6 text-[24px] font-semibold text-[var(--text-primary)]">
          Бронирование подтверждено!
        </h2>
        <p className="mt-2 text-[15px] font-semibold text-[var(--text-secondary)]">
          Мы отправили детали на вашу почту
        </p>
        <span className="mt-3 rounded-full bg-[var(--bg-surface-muted)] px-4 py-1.5 text-[14px] font-semibold text-[var(--text-primary)]">
          {displayEmail}
        </span>

        <div className="mt-10 flex w-full flex-col gap-3">
          <Link
            href={routes.home}
            className="w-full rounded-[14px] border border-[#0a6af7] py-4 text-center text-[16px] font-semibold text-[#0a6af7] transition hover:bg-[#0a6af7]/5"
          >
            На главную
          </Link>
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="w-full rounded-[14px] border border-[#0a6af7] py-4 text-[16px] font-semibold text-[#0a6af7] transition hover:bg-[#0a6af7]/5"
          >
            Оставить отзыв
          </button>
          <Link
            href={routes.bookings}
            className="w-full rounded-[14px] bg-[#0a6af7] py-4 text-center text-[16px] font-semibold text-white transition hover:bg-[#0858ce]"
          >
            Мои брони
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      {step < 3 && (
        <div className={s.pageTop}>
          <button
            type="button"
            className={s.backCircle}
            onClick={() => {
              if (step > 1) {
                setStep((st) => (st - 1) as BookingStep);
              } else {
                onBack();
              }
            }}
            aria-label="Назад"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14.5 6 8.5 12l6 6" />
            </svg>
          </button>
          <button type="button" className={s.backToMap} onClick={onBack}>
            Назад к карте
          </button>
        </div>
      )}

      {step < 3 && renderTopCard()}
      {step < 3 && renderStepper()}

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
          extraQuantities={extraQuantities}
          onAddExtra={addExtra}
          onRemoveExtra={removeExtra}
          onSkip={finishExtras}
          onContinue={finishExtras}
          onClose={() => setShowExtrasModal(false)}
        />
      )}

      {showCardModal && (
        <CardPaymentModal
          amountText={formatPrice(total)}
          onClose={() => setShowCardModal(false)}
          onPay={() => {
            setShowCardModal(false);
            setStep(3);
            showToast(
              "Оплата прошла успешно",
              "Оплата прошла успешно. Ожидайте подтверждения бронирования.",
            );
          }}
        />
      )}

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        shopId={String(shop.id)}
        shopName={shop.title}
      />
    </div>
  );
}
