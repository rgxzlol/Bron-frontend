"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  formatBookingDate as formatBookingDateLabel,
  toBookingTimeTestId,
} from "@/lib/formatDate";
import {
  buildTimeGroupsFromHours,
  getAvailableSlotsForDate,
  getDefaultBookingTime,
  groupTimeSlots,
  startOfDay,
} from "@/lib/booking/timeSlots";
import {
  BOOKING_ERROR_MESSAGE_KEYS,
  type BookingFormErrorCodes,
  type BookingFormErrors,
  validateBookingForm,
} from "@/lib/booking/validation";
import { isMissingBookingTargetError, isSlotConflictError } from "@/lib/booking/errors";
import {
  buildSlotKey,
  releaseSlot,
  tryReserveSlot,
} from "@/lib/booking/slotLocks";
import {
  pickBookableShopService,
  resolveBookingTargetIds,
} from "@/lib/booking/payload";
import { getBookingExtraLabels } from "@/lib/booking/extras";
import type { BookingOrderItem } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import BookingExtrasModal, { type OrderLineItem } from "./BookingExtrasModal";
import CardPaymentModal from "./CardPaymentModal";
import ReviewModal from "@/components/features/review/ReviewModal";
import { addMinutesToTime, formatBookingDate } from "@/lib/api/mappers";
import { toUserFacingEmail } from "@/lib/auth/syntheticEmail";
import { useAuthStore } from "@/store/auth.store";
import { useBookingStore } from "@/store/booking.store";
import { useProfileStore } from "@/store/profile.store";
import { useToastStore } from "@/store/toast.store";
import s from "./bookingPage.module.css";
import {
  fetchAvailableSlots,
  fetchBookingApiContext,
  getShopHoursForDate,
  isBookingDateUnavailable,
  type BookingApiContext,
} from "@/lib/booking/apiContext";

type BookingPageProps = {
  shop: ShopsType;
  selectedServiceIds?: string[];
  onBack: () => void;
  origin?: "home" | "map";
  variant?: "page" | "sheet";
};

type BookingStep = 1 | 2 | 3;

type LockedSchedule = {
  date: Date;
  time: string;
};

export default function BookingPage({
  shop,
  selectedServiceIds = [],
  onBack,
  origin = "map",
  variant = "page",
}: BookingPageProps) {
  const [step, setStep] = useState<BookingStep>(1);
  const [lockedSchedule, setLockedSchedule] = useState<LockedSchedule | null>(null);
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
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotConflictMessage, setSlotConflictMessage] = useState<string | null>(null);
  const didPrefillFormRef = useRef(false);
  const { t, locale } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const createBooking = useBookingStore((state) => state.createBooking);
  const showToast = useToastStore((state) => state.showToast);
  const profileFullName = useProfileStore((state) => state.fullName);
  const profilePhone = useProfileStore((state) => state.phone);
  const profileEmail = useProfileStore((state) => state.email);
  const [apiContext, setApiContext] = useState<BookingApiContext | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [apiAvailableSlots, setApiAvailableSlots] = useState<string[] | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    if (!shop.apiBusinessId) {
      setApiContext(null);
      setSelectedBranchId(null);
      setSelectedStaffId(null);
      return;
    }

    let cancelled = false;

    void fetchBookingApiContext(shop.apiBusinessId).then((context) => {
      if (cancelled) return;
      setApiContext(context);
      const preferredBranchId = shop.apiBranchId;
      const liveBranchId = context.branches.some((branch) => branch.id === preferredBranchId)
        ? preferredBranchId
        : (context.branches[0]?.id ?? null);
      setSelectedBranchId(liveBranchId ?? null);
      setSelectedStaffId(null);
    });

    return () => {
      cancelled = true;
    };
  }, [shop.apiBusinessId, shop.apiBranchId]);

  useEffect(() => {
    if (!shop.apiBusinessId || !selectedBranchId) {
      setApiAvailableSlots(null);
      return;
    }

    const bookableService = pickBookableShopService(shop.services, selectedServiceIds);
    const serviceId = bookableService?.id;
    if (!serviceId || !/^\d+$/.test(serviceId)) {
      setApiAvailableSlots(null);
      return;
    }

    let cancelled = false;

    void fetchAvailableSlots({
      businessId: shop.apiBusinessId,
      serviceId: Number(serviceId),
      branchId: selectedBranchId,
      date: formatBookingDate(selectedDate),
      staffId: selectedStaffId,
    }).then((slots) => {
      if (!cancelled) {
        setApiAvailableSlots(slots);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    shop.apiBusinessId,
    shop.services,
    selectedServiceIds,
    selectedBranchId,
    selectedDate,
    selectedStaffId,
  ]);

  const resolvedHours = useMemo(
    () => getShopHoursForDate(apiContext, shop.hours, selectedDate),
    [apiContext, shop.hours, selectedDate],
  );

  const timeGroups = useMemo(() => {
    if (apiAvailableSlots?.length) {
      return groupTimeSlots(apiAvailableSlots);
    }
    return buildTimeGroupsFromHours(resolvedHours);
  }, [apiAvailableSlots, resolvedHours]);

  const isDateDisabled = useCallback(
    (date: Date) => isBookingDateUnavailable(apiContext, date),
    [apiContext],
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

  useEffect(() => {
    if (step !== 2) {
      didPrefillFormRef.current = false;
      setSubmitAttempted(false);
      return;
    }

    if (didPrefillFormRef.current) return;

    didPrefillFormRef.current = true;
    const prefilledName = profileFullName?.trim() ?? "";
    setForm({
      name: validateBookingForm(prefilledName, "").name ? "" : prefilledName,
      // Real email only (e.g. Google); synthetic @bron.app placeholders stay empty.
      email: toUserFacingEmail(profileEmail),
    });
    setFormErrors({});
  }, [step, profileFullName, profileEmail]);

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
    if (selectedServices.length > 1) {
      return t("booking.servicesCount", { count: selectedServices.length });
    }
    return shop.type === "Больница" ? shop.category : t("booking.hallBooking");
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

        const labels = getBookingExtraLabels(id, t);

        return [
          {
            id: `extra-${id}`,
            name: quantity > 1 ? `${labels.name} × ${quantity}` : labels.name,
            price: extra.price * quantity,
            removable: true,
            sourceId: id,
          },
        ];
      }),
    [extraQuantities, t],
  );

  const allLineItems = useMemo(
    () => [...baseLineItems, ...extraLineItems],
    [baseLineItems, extraLineItems],
  );

  const total = allLineItems.reduce((sum, item) => sum + item.price, 0);

  const formattedSelectedDate = useMemo(
    () => formatBookingDateLabel(selectedDate, locale),
    [selectedDate, locale],
  );



  const priceLabel = t("booking.priceFrom", { price: formatPrice(shop.price) });
  const priceSubLabel =
    shop.type === "Больница" ? t("booking.perVisit") : t("booking.perHour");
  const displayEmail = form.email.trim() || "Ivan.Petrov@gmail.com";
  const backLabel = origin === "home" ? t("common.close") : t("booking.backToMap");
  const activeDate = lockedSchedule?.date ?? selectedDate;
  const activeTime = lockedSchedule?.time ?? selectedTime;

  function handleContinueFromStep1() {
    setLockedSchedule({
      date: startOfDay(selectedDate),
      time: selectedTime,
    });
    setStep(2);
  }

  function handleBackFromStep(stepNumber: BookingStep) {
    if (stepNumber > 1) {
      if (stepNumber === 2) {
        setLockedSchedule(null);
      }
      setStep((current) => (current - 1) as BookingStep);
      return;
    }

    onBack();
  }

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

  function clearExtra(id: string) {
    setExtraQuantities((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function mapValidationCodesToMessages(
    codes: BookingFormErrorCodes,
  ): BookingFormErrors {
    return Object.fromEntries(
      Object.entries(codes).map(([field, code]) => [
        field,
        t(BOOKING_ERROR_MESSAGE_KEYS[code as keyof typeof BOOKING_ERROR_MESSAGE_KEYS]),
      ]),
    ) as BookingFormErrors;
  }

  function validateForm() {
    const codes = validateBookingForm(form.name, form.email, profilePhone ?? "");
    const { phone: phoneCode, ...visibleCodes } = codes;
    const errors = mapValidationCodesToMessages(visibleCodes);
    setFormErrors(errors);

    if (phoneCode) {
      showToast(
        t(BOOKING_ERROR_MESSAGE_KEYS[phoneCode]),
        t("booking.errorPhone"),
      );
    }

    return Object.keys(codes).length === 0;
  }

  function handlePay() {
    setSubmitAttempted(true);

    if (!validateForm()) {
      setShowExtrasModal(false);
      return;
    }

    setShowExtrasModal(true);
  }

  function completeBookingFlow() {
    setShowExtrasModal(false);
    setShowCardModal(false);
    setStep(3);
    showToast(
      t("booking.successToast"),
      t("booking.successToastDesc"),
    );
  }

  function handleSlotConflict() {
    setShowExtrasModal(false);
    setShowCardModal(false);
    setLockedSchedule(null);
    setStep(1);
    setSlotConflictMessage(t("booking.errorSlotUnavailable"));
    showToast(t("booking.errorSlotUnavailable"), t("booking.errorSlotUnavailableHint"));
  }

  async function finishExtras() {
    if (!token) {
      alert(t("booking.errorLoginRequired"));
      return;
    }

    if (!shop.apiBusinessId) {
      completeBookingFlow();
      return;
    }

    const bookableService = pickBookableShopService(shop.services, selectedServiceIds);

    setIsSubmitting(true);

    let slotKey: string | null = null;

    try {
      const resolved = await resolveBookingTargetIds({
        businessId: shop.apiBusinessId,
        preferredServiceId: bookableService?.id,
        preferredBranchId: selectedBranchId ?? shop.apiBranchId,
        fallbackDurationMin:
          bookableService?.durationMin ??
          selectedServices[0]?.durationMin ??
          60,
      });

      if (!resolved.ok) {
        alert(
          resolved.reason === "branch"
            ? t("booking.errorNoBranch")
            : t("booking.errorNoService"),
        );
        return;
      }

      const { serviceId, branchId, durationMin } = resolved.targets;

      const bookingDate = formatBookingDate(activeDate);
      slotKey = buildSlotKey(shop.apiBusinessId, branchId, bookingDate, activeTime);

      if (!tryReserveSlot(slotKey)) {
        handleSlotConflict();
        return;
      }

      const orderItems: BookingOrderItem[] = [
        {
          id: "service",
          name: baseBookingName,
          price: bookingPrice,
          quantity: 1,
          kind: "service",
        },
        ...Object.entries(extraQuantities).flatMap(([id, quantity]) => {
          if (quantity <= 0) return [];
          const extra = bookingExtras.find((item) => item.id === id);
          if (!extra) return [];
          return [
            {
              id,
              name: getBookingExtraLabels(id, t).name,
              price: extra.price,
              quantity,
              kind: "extra" as const,
            },
          ];
        }),
      ];

      await createBooking({
        business_id: shop.apiBusinessId,
        service_id: serviceId,
        branch_id: branchId,
        booking_date: bookingDate,
        start_time: activeTime,
        end_time: addMinutesToTime(activeTime, durationMin),
        guest_count: guests,
        items: orderItems,
        total_price: total,
      });

      completeBookingFlow();
    } catch (error) {
      if (slotKey) releaseSlot(slotKey);

      if (isSlotConflictError(error)) {
        handleSlotConflict();
        return;
      }

      alert(
        isMissingBookingTargetError(error)
          ? t("booking.errorTargetNotFound")
          : error instanceof Error
            ? error.message
            : t("booking.errorCreateFailed"),
      );
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
      <nav className={s.stepper} aria-label={t("booking.stepsAria")} data-testid="booking-stepper">
        {steps.map(({ num, label }) => {
          const isDone = step > num;
          const isActive = step === num;
          return (
            <div
              key={num}
              className={`${s.step} ${isDone ? s.stepDone : ""} ${isActive ? s.stepActive : ""}`}
              data-testid={`booking-step-${num}`}
              data-active={isActive ? "true" : "false"}
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
                onClick={() => handleBackFromStep(step)}
              >
                {t("common.back")}
              </button>
            ) : null}
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
              <span className={s.statValue}>{resolvedHours}</span>
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
        {slotConflictMessage && (
          <div
            className={s.slotConflictAlert}
            role="alert"
            data-testid="booking-slot-conflict-error"
          >
            <strong>{slotConflictMessage}</strong>
            <span>{t("booking.errorSlotUnavailableHint")}</span>
          </div>
        )}

        <section className={s.timeCard} data-testid="booking-step-1-panel">
          <div className={s.desktopPickers}>
            <DatePicker
              viewMonth={viewMonth}
              onViewMonthChange={setViewMonth}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              today={today}
              minDate={today}
              isDateDisabled={shop.apiBusinessId ? isDateDisabled : undefined}
            />
            <TimePicker
              selectedTime={selectedTime}
              onSelectedTimeChange={setSelectedTime}
              timeGroups={timeGroups}
              disabledSlots={disabledTimeSlots}
            />
          </div>

          <div className={s.mobilePickers}>
            <h2 className={s.pickTitle}>{t("booking.pickDate")}</h2>
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
                {formatBookingDateLabel(selectedDate, locale)}
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
                  isDateDisabled={shop.apiBusinessId ? isDateDisabled : undefined}
                />
              </div>
            )}

            <h2 className={s.pickTitle}>{t("booking.pickTime")}</h2>
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
                    data-testid={toBookingTimeTestId(slot)}
                    onClick={() => {
                      setSelectedTime(slot);
                      setSlotConflictMessage(null);
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className={s.stepFooter} data-testid="booking-step1-summary">
          <div className={s.stepFooterInfo} aria-live="polite">
            <span>
              {t("booking.youSelected")}{" "}
              <strong>
                <span data-testid="booking-step1-selected-date">
                  {formattedSelectedDate}
                </span>
                ,{" "}
                <span data-testid="booking-step1-selected-time">{selectedTime}</span>
              </strong>
            </span>
            <span className={s.stepFooterMuted}>
              <span data-testid="booking-step1-duration">
                {t("booking.durationLabel", { duration: durationLabel })}
              </span>
            </span>
          </div>
          <div className={s.stepFooterActions}>
            <span className={s.stepFooterPrice} data-testid="booking-step1-total">
              {t("booking.totalForDuration", {
                duration: durationLabel,
                price: `${formatPrice(bookingPrice)}`,
              })}
            </span>
            <Button
              text={t("booking.continue")}
              className={s.continueBtn}
              data-testid="booking-continue-button"
              onClick={handleContinueFromStep1}
            />
            <span className={s.footerHint}>{t("booking.dataProtected")}</span>
          </div>
        </div>

        <div className={s.mobileFooter}>
          <p className={s.mobileTotal} data-testid="booking-step1-total-mobile">
            {t("booking.mobileTotal", { price: `${formatPrice(bookingPrice)}` })}
          </p>
          <Button
            text={t("booking.continue")}
            className={s.mobileContinue}
            data-testid="booking-continue-button"
            onClick={handleContinueFromStep1}
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
  ) {
    return (
      <aside className={s.payCard} data-testid="booking-payment-panel">
        <h2 className={s.payTitle}>{t("booking.paymentTitle")}</h2>

        {items.map((item) => (
          <div key={item.id} className={s.lineItem}>
            <span className={s.lineName}>{item.name}</span>
            <span className={s.linePrice}>
              {t("booking.priceSum", { price: formatPrice(item.price) })}
            </span>
          </div>
        ))}

        <div className={s.total}>
          <span>{t("booking.total")}</span>
          <span className={s.totalAmount}>
            {t("booking.priceSum", { price: formatPrice(itemsTotal) })}
          </span>
        </div>

        {!paid && (
          <div
            className={s.payMethods}
            role="radiogroup"
            aria-label={t("booking.paymentMethodAria")}
          >
            {[
              { id: "card", title: t("booking.payCard"), sub: t("booking.payCardSub") },
              { id: "click", title: t("booking.payClick"), sub: t("booking.payClickSub") },
              { id: "other", title: t("booking.payOther"), sub: t("booking.payOtherSub") },
            ].map((method) => (
              <label
                key={method.id}
                className={`${s.payOption} ${paymentMethod === method.id ? s.payOptionSelected : ""
                  }`}
                data-testid={`booking-payment-${method.id}`}
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
          data-testid="booking-pay-button"
        />
      </aside>
    );
  }

  function renderStep2() {
    const hasFormErrors = Object.keys(formErrors).length > 0;

    return (
      <div className={s.columns} data-testid="booking-step-2-panel">
        {lockedSchedule ? (
          <section className={s.lockedSchedule} data-testid="booking-locked-schedule">
            <div>
              <p className={s.lockedScheduleLabel}>{t("booking.lockedScheduleLabel")}</p>
              <p className={s.lockedScheduleValue}>
                <span data-testid="booking-locked-date">
                  {formatBookingDateLabel(lockedSchedule.date, locale)}
                </span>
                ,{" "}
                <span data-testid="booking-locked-time">{lockedSchedule.time}</span>
              </p>
            </div>
            <button
              type="button"
              className={s.lockedScheduleEdit}
              onClick={() => {
                setLockedSchedule(null);
                setStep(1);
              }}
            >
              {t("booking.lockedScheduleEdit")}
            </button>
          </section>
        ) : null}

        <form
          className={s.formCard}
          data-testid="booking-details-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            handlePay();
          }}
          data-validation-state={hasFormErrors ? "invalid" : "valid"}
        >
          <h2 className={s.formTitle}>{t("booking.formTitle")}</h2>
          <p className={s.formSubtitle}>{t("booking.formSubtitle")}</p>

          {submitAttempted && hasFormErrors ? (
            <div
              className={s.formValidationSummary}
              role="alert"
              data-testid="booking-form-errors"
            >
              {t("booking.formValidationSummary")}
            </div>
          ) : null}

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
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? "booking-name-error" : undefined}
              data-testid="booking-name-input"
            />
            {formErrors.name && (
              <span
                id="booking-name-error"
                className={s.fieldError}
                role="alert"
                data-testid="booking-name-error"
              >
                {formErrors.name}
              </span>
            )}
          </label>

          <label className={s.field}>
            <span className={s.label}>{t("booking.emailLabel")}</span>
            <input
              className={`${s.input} ${formErrors.email ? s.inputError : ""}`}
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value }));
                if (formErrors.email) {
                  setFormErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="email@example.com"
              autoComplete="email"
              aria-invalid={!!formErrors.email}
              aria-describedby={formErrors.email ? "booking-email-error" : undefined}
              data-testid="booking-email-input"
            />
            {formErrors.email && (
              <span
                id="booking-email-error"
                className={s.fieldError}
                role="alert"
                data-testid="booking-email-error"
              >
                {formErrors.email}
              </span>
            )}
          </label>

          <div className={s.guests} data-testid="booking-guests-control">
            <div className={s.guestsRow}>
              <div>
                <span className={s.label}>{t("booking.guestsLabel")}</span>
                <p className={s.guestsHint}>
                  {t("booking.guestsHint", { max: maxGuests })}
                </p>
              </div>
              <div className={s.counter}>
                <button
                  type="button"
                  className={s.counterBtn}
                  onClick={() => setGuests((n) => Math.max(1, n - 1))}
                  disabled={guests <= 1}
                  aria-label={t("booking.guestsDecrease")}
                  data-testid="booking-guests-decrease"
                >
                  −
                </button>
                <span className={s.counterValue} data-testid="booking-guests-count">
                  {guests}
                </span>
                <button
                  type="button"
                  className={s.counterBtn}
                  onClick={() => setGuests((n) => Math.min(maxGuests, n + 1))}
                  disabled={guests >= maxGuests}
                  aria-label={t("booking.guestsIncrease")}
                  data-testid="booking-guests-increase"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </form>

        {renderPaymentSummary(baseLineItems, bookingPrice, t("booking.pay"), handlePay)}
      </div>
    );
  }

  function renderStep3() {
    return (
      <div
        className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center py-8 text-center"
        data-testid="booking-confirm-step"
      >
        <div className="relative flex h-[150px] w-[150px] items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#16a34a]/10" />
          <span className="absolute inset-5 rounded-full bg-[#16a34a]/20" />
          <span className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#16a34a] shadow-[0_12px_28px_-6px_rgba(22,163,74,0.6)]">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        <h2
          className="mt-6 text-[24px] font-semibold text-[var(--text-primary)]"
          data-testid="booking-confirm-title"
        >
          {t("booking.confirmTitle")}
        </h2>
        <p className="mt-2 text-[15px] font-semibold text-[var(--text-secondary)]">
          {t("booking.confirmEmailSent")}
        </p>
        <span className="mt-3 rounded-full bg-[var(--bg-surface-muted)] px-4 py-1.5 text-[14px] font-semibold text-[var(--text-primary)]">
          {displayEmail}
        </span>

        <div
          className="mt-8 w-full rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface-muted)] p-4 text-left"
          data-testid="booking-confirm-summary"
        >
          <h3 className="mb-3 text-[16px] font-bold text-[var(--text-primary)]">
            {t("booking.confirmSummaryTitle")}
          </h3>
          <p className="text-[14px] font-semibold text-[var(--text-secondary)]">
            {formatBookingDateLabel(activeDate, locale)}, {activeTime}
          </p>
          {allLineItems.map((item) => (
            <div
              key={item.id}
              className="mt-2 flex items-center justify-between gap-3 text-[14px]"
            >
              <span className="text-[var(--text-secondary)]">{item.name}</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {t("booking.priceSum", { price: formatPrice(item.price) })}
              </span>
            </div>
          ))}
          <div className="mt-4 flex items-center justify-between border-t border-[var(--border-default)] pt-3 text-[16px] font-bold">
            <span>{t("booking.total")}</span>
            <span data-testid="booking-confirm-total">
              {t("booking.priceSum", { price: formatPrice(total) })}
            </span>
          </div>
        </div>

        <div className="mt-10 flex w-full flex-col gap-3">
          <Link
            href={routes.home}
            className="w-full rounded-[14px] border border-[#0a6af7] py-4 text-center text-[16px] font-semibold text-[var(--accent-fg)] transition hover:bg-[#0a6af7]/5"
            data-testid="booking-go-home"
          >
            {t("booking.goHome")}
          </Link>
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="w-full rounded-[14px] border border-[#0a6af7] py-4 text-[16px] font-semibold text-[var(--accent-fg)] transition hover:bg-[#0a6af7]/5"
            data-testid="booking-leave-review"
          >
            {t("booking.leaveReview")}
          </button>
          <Link
            href={routes.bookings}
            className="w-full rounded-[14px] bg-[#0a6af7] py-4 text-center text-[16px] font-semibold text-white transition hover:bg-[#0858ce]"
            data-testid="booking-go-bookings"
          >
            {t("booking.viewBooking")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${s.page} ${variant === "sheet" ? s.pageSheet : ""}`}
      data-testid="booking-wizard"
    >
      {step < 3 && variant !== "sheet" && (
        <div className={s.pageTop}>
          {step > 1 ? (
            <button
              type="button"
              className={s.backCircle}
              onClick={() => handleBackFromStep(step)}
              aria-label={t("common.back")}
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
          ) : null}
          {step === 1 ? (
            <button type="button" className={s.backToMap} onClick={onBack}>
              {backLabel}
            </button>
          ) : null}
        </div>
      )}

      {step < 3 && renderTopCard()}
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
          onClearExtra={clearExtra}
          onSkip={finishExtras}
          onContinue={finishExtras}
          onClose={() => setShowExtrasModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {showCardModal && (
        <CardPaymentModal
          amountText={formatPrice(total)}
          onClose={() => setShowCardModal(false)}
          onPay={() => {
            setShowCardModal(false);
            completeBookingFlow();
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
