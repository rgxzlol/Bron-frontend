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
import ReviewModal from "@/components/features/review/ReviewModal";
import { branchesApi } from "@/lib/api";
import {
  addMinutesToTime,
  formatBookingDate,
} from "@/lib/api/mappers";
import { useAuthStore } from "@/store/auth.store";
import { useBookingStore } from "@/store/booking.store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  DEMO_SERVICE_KEYS,
  SHOP_CATEGORY_KEYS,
  SHOP_TYPE_KEYS,
  translateLabel,
} from "@/lib/i18n/labels";
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
  const { t, locale, language } = useTranslation();
  const [step, setStep] = useState<BookingStep>(1);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
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
    if (selectedServices.length === 1) {
      const service = selectedServices[0];
      const demo = DEMO_SERVICE_KEYS[service.id];
      return demo ? t(demo.title) : service.title;
    }
    if (selectedServices.length > 1) {
      return t("booking.servicesCount", { count: selectedServices.length });
    }
    return shop.type === "Больница"
      ? translateLabel(t, shop.category, SHOP_CATEGORY_KEYS)
      : t("booking.hallBooking");
  }, [selectedServices, shop, t]);

  const durationLabel = useMemo(() => {
    if (selectedServices.length > 0) {
      const mins = selectedServices.reduce((sum, svc) => sum + svc.durationMin, 0);
      return t("booking.durationMinutes", { mins });
    }
    return shop.type === "Больница"
      ? t("booking.durationMinutes", { mins: shop.time })
      : t("booking.durationOneHour");
  }, [selectedServices, shop, t]);

  const maxGuests = 20;

  const bookingPrice = useMemo(() => basePrice * guests, [basePrice, guests]);

  const baseLineItems = useMemo<OrderLineItem[]>(
    () => [
      {
        id: "booking-base",
        name:
          guests > 1
            ? t("booking.guestSuffix", { name: baseBookingName, guests })
            : baseBookingName,
        price: bookingPrice,
      },
    ],
    [baseBookingName, bookingPrice, guests, t],
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



  const priceLabel = t("booking.priceFrom", {
    price: formatPrice(shop.price, locale),
  });
  const priceSubLabel =
    shop.type === "Больница" ? t("booking.perVisit") : t("booking.perHour");
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
      errors.name = t("booking.errorName");
    }
    if (phoneDigits.length < 9) {
      errors.phone = t("booking.errorPhone");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handlePay() {
    if (!validateForm()) return;
    setShowExtrasModal(true);
  }

  async function finishExtras() {
    if (!token) {
      alert(t("booking.errorLoginRequired"));
      return;
    }

    if (!shop.apiBusinessId) {
      setShowExtrasModal(false);
      setStep(3);
      return;
    }

    const serviceId = selectedServiceIds[0] ?? shop.services?.[0]?.id;
    if (!serviceId || !/^\d+$/.test(serviceId)) {
      alert(t("booking.errorNoService"));
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
        throw new Error(t("booking.errorNoBranch"));
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
      setStep(3);
    } catch (error) {
      alert(error instanceof Error ? error.message : t("booking.errorCreateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStepper() {
    const steps = [
      { num: 1, label: t("booking.stepTime") },
      { num: 2, label: t("booking.stepDetails") },
      { num: 3, label: t("booking.stepConfirm") },
    ];

    return (
      <nav className={s.stepper} aria-label={t("booking.stepsAria")}>
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
          <span className={s.slideCounter}>1/{gallery.length}</span>
        </div>

        <div className={s.topBody}>
          <div className={s.topHead}>
            <div>
              <span className={s.tag}>
                {translateLabel(t, shop.type, SHOP_TYPE_KEYS)}
              </span>
              <h1 className={s.title}>{shop.title}</h1>
              <div className={s.rating}>
                <Image src={assets.popular.starRating} alt="" width={18} height={18} />
                <span>{formatRating(shop.rating, locale)}</span>
                <span className={s.ratingMuted}>
                  ({shop.reviews} {pluralizeReviews(shop.reviews, language)})
                </span>
              </div>
            </div>
            {step > 1 ? (
              <button
                type="button"
                className={s.backBtn}
                onClick={() => setStep((st) => (st - 1) as BookingStep)}
              >
                {t("booking.back")}
              </button>
            ) : (
              <button type="button" className={s.backBtn} onClick={onBack}>
                {t("booking.back")}
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
              <span className={s.statLabel}>{t("booking.open")}</span>
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
        </section>

        <div className={s.stepFooter}>
          <div className={s.stepFooterInfo}>
            <span>
              {t("booking.youSelected")}{" "}
              <strong>
                {formatDateRu(selectedDate, locale)}, {selectedTime}
              </strong>
            </span>
            <span className={s.stepFooterMuted}>
              {t("booking.durationLabel", { duration: durationLabel })}
            </span>
          </div>
          <div className={s.stepFooterActions}>
            <span className={s.stepFooterPrice}>
              {t("booking.totalForDuration", {
                duration: durationLabel,
                price: formatPrice(bookingPrice, locale),
              })}
            </span>
            <Button
              text={t("booking.continue")}
              className={s.continueBtn}
              onClick={() => setStep(2)}
            />
            <span className={s.footerHint}>{t("booking.dataProtected")}</span>
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
    payDisabled = false,
  ) {
    return (
      <aside className={s.payCard}>
        <h2 className={s.payTitle}>{t("booking.paymentTitle")}</h2>

        {items.map((item) => (
          <div key={item.id} className={s.lineItem}>
            <span className={s.lineName}>{item.name}</span>
            <span className={s.linePrice}>
              {t("booking.priceSum", { price: formatPrice(item.price, locale) })}
            </span>
          </div>
        ))}

        <div className={s.total}>
          <span>{t("booking.total")}</span>
          <span className={s.totalAmount}>
            {t("booking.priceSum", {
              price: formatPrice(itemsTotal, locale),
            })}
          </span>
        </div>

        {!paid && (
          <div
            className={s.payMethods}
            role="radiogroup"
            aria-label={t("booking.paymentMethodAria")}
          >
            {[
              {
                id: "card",
                title: t("booking.payCard"),
                sub: t("booking.payCardSub"),
              },
              {
                id: "click",
                title: t("booking.payClick"),
                sub: t("booking.payClickSub"),
              },
              {
                id: "other",
                title: t("booking.payOther"),
                sub: t("booking.payOtherSub"),
              },
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
          <h2 className={s.formTitle}>{t("booking.formTitle")}</h2>
          <p className={s.formSubtitle}>{t("booking.formSubtitle")}</p>

          <label className={s.field}>
            <span className={s.label}>
              {t("booking.nameLabel")} <span className={s.required}>*</span>
            </span>
            <input
              className={`${s.input} ${formErrors.name ? s.inputError : ""}`}
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder={t("booking.namePlaceholder")}
              required
            />
            {formErrors.name && <span className={s.fieldError}>{formErrors.name}</span>}
          </label>

          <label className={s.field}>
            <span className={s.label}>
              {t("booking.phoneLabel")} <span className={s.required}>*</span>
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
            <span className={s.label}>{t("booking.emailLabel")}</span>
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
                <span className={s.label}>{t("booking.guestsLabel")}</span>
              </div>
              <div className={s.counter}>
                <button
                  type="button"
                  className={s.counterBtn}
                  onClick={() => setGuests((n) => Math.max(1, n - 1))}
                  disabled={guests <= 1}
                  aria-label={t("booking.guestsDecrease")}
                >
                  −
                </button>
                <span className={s.counterValue}>{guests}</span>
                <button
                  type="button"
                  className={s.counterBtn}
                  onClick={() => setGuests((n) => Math.min(maxGuests, n + 1))}
                  disabled={guests >= maxGuests}
                  aria-label={t("booking.guestsIncrease")}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </section>

        {renderPaymentSummary(
          baseLineItems,
          bookingPrice,
          t("booking.pay"),
          handlePay,
          false,
          !isFormValid,
        )}
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
          <h2 className={s.confirmTitle}>{t("booking.confirmTitle")}</h2>
          <p className={s.confirmSub}>
            {t("booking.confirmEmailSent")}{" "} <br />
            <span className={s.confirmEmail}>{displayEmail}</span>
          </p>

          <div className={s.whatsNext}>
            <h3 className={`${s.whatsNextTitle} flex gap-[9px]`}>
              <Image src={assets.header.notification} alt="" className={s.whatsNextNotificationIcon} />
              {t("booking.whatsNext")}
            </h3>
            <ul className={s.whatsNextList}>
              <li className="flex gap-[5px]">
                <Image src={assets.popular.timeIcon} alt="" className={s.whatsNextTimeIcon} />
                {t("booking.arriveEarly")}
              </li>
              <li className="ml-[26px]">{t("booking.cancelPolicy")}</li>
            </ul>
            <Button
              className="bg-transparent border-2 border-[#0A6AF7] w-full mt-[42px] !text-black border-[]"
              text={t("booking.leaveReview")}
              onClick={() => setShowReviewModal(true)}
            />
          </div>

          <div className={s.confirmActions}>
            <Link href={routes.bookings} className={s.secondaryBtn}>
              {t("booking.viewBooking")}
            </Link>
            <Link href={routes.home} className={`${s.primaryLink}`}>
              <Button text={t("booking.goHome")} className={s.primaryLinkBtn} as="span" />
            </Link>
          </div>
        </section>

        {renderPaymentSummary(allLineItems, total, t("booking.paid"), undefined, true)}
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.pageTop}>
        <button type="button" className={s.backToMap} onClick={onBack}>
          {t("booking.backToMap")}
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
            <p className={s.securityTitle}>{t("booking.securityTitle")}</p>
            <p className={s.securityText}>{t("booking.securityText")}</p>
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

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        shopId={String(shop.id)}
        shopName={shop.title}
      />
    </div>
  );
}
