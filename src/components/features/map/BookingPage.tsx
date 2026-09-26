"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { assets } from "@/lib/assets";
import { formatPrice, formatRating } from "@/lib/formatPrice";
import { pluralizeReviews } from "@/lib/pluralize";
import { getShopGallery, isRemoteShopImage } from "@/lib/business/shopImages";
import type { BookingExtra } from "@/data/bookingExtras";
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
import type { BookingListItem, BookingOrderItem } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import BookingExtrasModal, { type OrderLineItem } from "./BookingExtrasModal";
import CardPaymentModal from "./CardPaymentModal";
import ReviewModal from "@/components/features/review/ReviewModal";
import { addMinutesToTime, formatBookingDate } from "@/lib/api/mappers";
import { formatUzbekPhoneInput } from "@/lib/auth/validation";
import { useAuthStore } from "@/store/auth.store";
import { useBookingStore } from "@/store/booking.store";
import { useProfileStore } from "@/store/profile.store";
import { useToastStore } from "@/store/toast.store";
import { useNotificationStore } from "@/store/notification.store";
import { servicesApi } from "@/lib/api/services";
import type {
  ServiceAvailability,
  ServiceAvailableDate,
} from "@/lib/api/types";
import s from "./bookingPage.module.css";
import {
  fetchBookingApiContext,
  getShopHoursForDate,
  isBookingDateUnavailable,
  type BookingApiContext,
} from "@/lib/booking/apiContext";
import { translateLocation } from "@/lib/i18n/location";

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

function createLocalBookingId() {
  return -Date.now();
}

function getExtraLabels(
  extra: BookingExtra,
) {
  return { name: extra.name, description: extra.description };
}

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
  const [requestedTime, setRequestedTime] = useState(() => {
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
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotConflictMessage, setSlotConflictMessage] = useState<string | null>(null);
  const didPrefillFormRef = useRef(false);
  const { t, locale, language } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const createBooking = useBookingStore((state) => state.createBooking);
  const addLocalBooking = useBookingStore((state) => state.addLocalBooking);
  const showToast = useToastStore((state) => state.showToast);
  const addLocalNotification = useNotificationStore(
    (state) => state.addLocalNotification,
  );
  const profileFullName = useProfileStore((state) => state.fullName);
  const profilePhone = useProfileStore((state) => state.phone);
  const profileEmail = useProfileStore((state) => state.email);
  const savePhone = useProfileStore((state) => state.savePhone);
  const [apiContext, setApiContext] = useState<BookingApiContext | null>(null);
  const [apiContextBusinessId, setApiContextBusinessId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [apiAvailabilityState, setApiAvailabilityState] = useState<{
    key: string;
    availability: ServiceAvailability | null;
    status: "loading" | "ready" | "error";
  } | null>(null);
  const [apiAvailableDatesState, setApiAvailableDatesState] = useState<{
    key: string;
    dates: Set<string>;
  } | null>(null);
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);

  const today = useMemo(() => startOfDay(new Date()), []);
  const bookableService = pickBookableShopService(shop.services, selectedServiceIds);
  const serviceId =
    bookableService?.id && /^\d+$/.test(bookableService.id)
      ? Number(bookableService.id)
      : null;
  const currentApiContext =
    shop.apiBusinessId != null && apiContextBusinessId === shop.apiBusinessId
      ? apiContext
      : null;
  const availableDatesKey =
    shop.apiBusinessId != null && serviceId != null
      ? `${shop.apiBusinessId}:${serviceId}:${selectedStaffId ?? ""}`
      : null;
  const apiAvailableDates =
    availableDatesKey != null && apiAvailableDatesState?.key === availableDatesKey
      ? apiAvailableDatesState.dates
      : null;
  const availabilityKey =
    shop.apiBusinessId != null && serviceId != null
      ? `${shop.apiBusinessId}:${serviceId}:${formatBookingDate(selectedDate)}:${selectedStaffId ?? ""}:${availabilityRefreshKey}`
      : null;
  const currentAvailabilityState =
    availabilityKey != null && apiAvailabilityState?.key === availabilityKey
      ? apiAvailabilityState
      : null;
  const apiAvailability = currentAvailabilityState?.availability ?? null;
  const availabilityStatus = currentAvailabilityState?.status ??
    (shop.apiBusinessId && serviceId == null ? "error" : shop.apiBusinessId ? "loading" : "idle");

  useEffect(() => {
    if (!shop.apiBusinessId) {
      return;
    }

    let cancelled = false;

    void fetchBookingApiContext(shop.apiBusinessId).then((context) => {
      if (cancelled) return;
      setApiContext(context);
      setApiContextBusinessId(shop.apiBusinessId!);
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
    if (!shop.apiBusinessId || serviceId == null || availableDatesKey == null) {
      return;
    }

    let cancelled = false;
    void servicesApi
      .availableDates(serviceId, 60, selectedStaffId ?? undefined)
      .then(
        (dates: ServiceAvailableDate[]) => {
          if (cancelled) return;
          const available = new Set(dates.map((item) => item.date.slice(0, 10)));
          setApiAvailableDatesState({ key: availableDatesKey, dates: available });
        },
        (error: unknown) => {
          if (!cancelled) {
            console.warn("Не удалось загрузить доступные даты:", error);
            setApiAvailableDatesState({ key: availableDatesKey, dates: new Set() });
            setSlotConflictMessage(
              error instanceof Error ? error.message : t("booking.errorSlotUnavailable"),
            );
          }
        },
      );

    return () => {
      cancelled = true;
    };
  }, [shop.apiBusinessId, shop.services, selectedServiceIds, selectedStaffId, availableDatesKey, serviceId, t]);

  useEffect(() => {
    if (serviceId == null || availabilityKey == null) {
      return;
    }

    let cancelled = false;
    void servicesApi
      .availability(serviceId, formatBookingDate(selectedDate), selectedStaffId ?? undefined)
      .then((availability) => {
        if (!cancelled) {
          setApiAvailabilityState({ key: availabilityKey, availability, status: "ready" });
          setSlotConflictMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.warn("Не удалось загрузить доступные слоты:", error);
          setApiAvailabilityState({
            key: availabilityKey,
            availability: null,
            status: "error",
          });
          setSlotConflictMessage(
            error instanceof Error ? error.message : t("booking.errorSlotUnavailable"),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    serviceId,
    availabilityKey,
    selectedDate,
    selectedStaffId,
    t,
  ]);

  const resolvedHours = useMemo(
    () => getShopHoursForDate(currentApiContext, shop.hours, selectedDate),
    [currentApiContext, shop.hours, selectedDate],
  );

  const timeGroups = useMemo(() => {
    if (shop.apiBusinessId) {
      if (availabilityStatus !== "ready" || !apiAvailability) return [];
      return groupTimeSlots(apiAvailability.slots.map((slot) => slot.start_time.slice(0, 5)));
    }
    return buildTimeGroupsFromHours(resolvedHours);
  }, [apiAvailability, availabilityStatus, resolvedHours, shop.apiBusinessId]);

  const isDateDisabled = useCallback(
    (date: Date) =>
      isBookingDateUnavailable(currentApiContext, date) ||
      (shop.apiBusinessId && apiAvailableDates == null) ||
      (apiAvailableDates != null &&
        !apiAvailableDates.has(formatBookingDate(date))),
    [currentApiContext, apiAvailableDates, shop.apiBusinessId],
  );

  const allTimeSlots = useMemo(
    () => timeGroups.flatMap((group) => group.slots),
    [timeGroups],
  );

  const disabledTimeSlots = useMemo(() => {
    const available = getAvailableSlotsForDate(allTimeSlots, selectedDate, new Date());
    const availableSet = new Set(available);
    const occupied = new Set(
      (apiAvailability?.slots ?? [])
        .filter((slot) => !slot.is_available || slot.available_spots <= 0)
        .map((slot) => slot.start_time.slice(0, 5)),
    );
    return new Set(
      allTimeSlots.filter((slot) => !availableSet.has(slot) || occupied.has(slot)),
    );
  }, [allTimeSlots, selectedDate, apiAvailability]);

  const hourlyTimeSlots = useMemo(
    () =>
      shop.apiBusinessId && availabilityStatus === "ready" && apiAvailability
        ? apiAvailability.slots.map((slot) => slot.start_time.slice(0, 5))
        : shop.apiBusinessId
          ? []
          : allTimeSlots.filter((slot) => slot.endsWith(":00")),
    [allTimeSlots, apiAvailability, availabilityStatus, shop.apiBusinessId],
  );
  const availableHourlySlots = hourlyTimeSlots.filter(
    (slot) => !disabledTimeSlots.has(slot) &&
      getAvailableSlotsForDate([slot], selectedDate, new Date()).length > 0,
  );
  const selectedTime =
    availableHourlySlots.length > 0 && !availableHourlySlots.includes(requestedTime)
      ? availableHourlySlots[0] ??
        getDefaultBookingTime(allTimeSlots, selectedDate, new Date())
      : requestedTime;
  const selectedAvailabilitySlot = apiAvailability?.slots.find(
    (slot) => slot.start_time.slice(0, 5) === selectedTime,
  );

  useEffect(() => {
    if (step !== 2) {
      didPrefillFormRef.current = false;
      return;
    }

    if (didPrefillFormRef.current) return;

    didPrefillFormRef.current = true;
    const prefilledName = profileFullName?.trim() ?? "";
    setForm({
      name: validateBookingForm(prefilledName, "").name ? "" : prefilledName,
      phone: profilePhone?.trim() ?? "",
      email: profileEmail?.trim() ?? "",
    });
    setFormErrors({});
  }, [step, profileFullName, profilePhone, profileEmail]);

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

  const maxGuests = Math.max(
    1,
    selectedAvailabilitySlot?.available_spots ??
      apiAvailability?.capacity ??
      20,
  );
  const guestCount = Math.min(guests, maxGuests);
  const bookingPrice = useMemo(() => basePrice * guestCount, [basePrice, guestCount]);

  const baseLineItems = useMemo<OrderLineItem[]>(
    () => [
      {
        id: "booking-base",
        name:
          guestCount > 1
            ? t("booking.guestSuffix", { name: baseBookingName, guests: guestCount })
            : baseBookingName,
        price: bookingPrice,
      },
    ],
    [baseBookingName, bookingPrice, guestCount, t],
  );

  const availableExtras = useMemo<BookingExtra[]>(
    () =>
      (shop.services ?? [])
        .filter((service) => service.kind === "product")
        .map((service) => ({
          id: service.id,
          name: service.title,
          description: service.description,
          price: service.priceFrom,
        })),
    [shop.services],
  );

  const extraLineItems = useMemo(
    () =>
      Object.entries(extraQuantities).flatMap(([id, quantity]) => {
        if (quantity <= 0) return [];
        const extra = availableExtras.find((item) => item.id === id);
        if (!extra) return [];

        const labels = getExtraLabels(extra);

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
    [availableExtras, extraQuantities],
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
  const backLabel = origin === "home" ? t("common.close") : t("booking.backToMap");
  const activeDate = lockedSchedule?.date ?? selectedDate;
  const activeTime = lockedSchedule?.time ?? selectedTime;
  const localizedAddress = translateLocation(shop.address, language);
  const localizedDistrict = translateLocation(shop.district, language);

  function handleContinueFromStep1() {
    if (
      shop.apiBusinessId &&
      (!selectedAvailabilitySlot?.is_available ||
        (selectedAvailabilitySlot?.available_spots ?? 0) < guestCount)
    ) {
      setSlotConflictMessage(t("booking.errorSlotUnavailable"));
      return;
    }

    setLockedSchedule({
      date: startOfDay(selectedDate),
      time: selectedTime,
    });
    setSubmitAttempted(false);
    setStep(2);
  }

  function handleBackFromStep(stepNumber: BookingStep) {
    if (stepNumber > 1) {
      if (stepNumber === 2) {
        setLockedSchedule(null);
        setSubmitAttempted(false);
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
    const codes = validateBookingForm(form.name, form.email, form.phone);
    const errors = mapValidationCodesToMessages(codes);
    setFormErrors(errors);

    return Object.keys(codes).length === 0;
  }

  function handleContinueFromDetails() {
    setSubmitAttempted(true);

    if (!validateForm()) {
      setShowExtrasModal(false);
      return;
    }

    if (availableExtras.length > 0) {
      setShowExtrasModal(true);
      return;
    }

    void finishExtras();
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
    setAvailabilityRefreshKey((key) => key + 1);
    setShowExtrasModal(false);
    setShowCardModal(false);
    setLockedSchedule(null);
    setSubmitAttempted(false);
    setStep(1);
    setSlotConflictMessage(t("booking.errorSlotUnavailable"));
    showToast(t("booking.errorSlotUnavailable"), t("booking.errorSlotUnavailableHint"));
  }

  async function finishExtras(isPaymentConfirmed = false) {
    if (!token) {
      alert(t("booking.errorLoginRequired"));
      return;
    }

    if (!shop.apiBusinessId) {
      const bookingDate = formatBookingDate(activeDate);
      addLocalBooking({
        id: createLocalBookingId(),
        booking_date: bookingDate,
        start_time: activeTime,
        end_time: addMinutesToTime(activeTime, 60),
        status: "confirmed",
        total_price: total,
        business_id: shop.id,
        guest_count: guestCount,
      } satisfies BookingListItem);
      completeBookingFlow();
      return;
    }

    if (paymentMethod === "card" && !isPaymentConfirmed) {
      setShowCardModal(true);
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
      if (
        !selectedAvailabilitySlot?.is_available ||
        selectedAvailabilitySlot.available_spots < guestCount
      ) {
        handleSlotConflict();
        return;
      }

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
          const extra = availableExtras.find((item) => item.id === id);
          if (!extra) return [];
          return [
            {
              id,
              name: getExtraLabels(extra).name,
              price: extra.price,
              quantity,
              kind: "extra" as const,
            },
          ];
        }),
      ];

      if (form.phone.trim() !== profilePhone.trim()) {
        await savePhone(form.phone);
      }

      await createBooking({
        business_id: shop.apiBusinessId,
        service_id: serviceId,
        branch_id: branchId,
        booking_date: bookingDate,
        start_time: activeTime,
        end_time:
          selectedAvailabilitySlot?.end_time ??
          addMinutesToTime(activeTime, durationMin),
        guest_count: guestCount,
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
            {step === 2 ? (
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
                <span>{localizedAddress}</span>
                <span className={s.contactSub}>{localizedDistrict}</span>
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
              onSelectedTimeChange={setRequestedTime}
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
                const slotAvailability = apiAvailability?.slots.find(
                  (item) => item.start_time.slice(0, 5) === slot,
                );
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    className={`${s.timeChip} ${selected ? s.timeChipActive : ""}`}
                    data-testid={toBookingTimeTestId(slot)}
                    onClick={() => {
                      setRequestedTime(slot);
                      setSlotConflictMessage(null);
                    }}
                  >
                    {slot}
                    {apiAvailability && apiAvailability.capacity > 1 && slotAvailability?.is_available ? (
                      <span className="ml-1 text-[11px]">
                        {t("booking.spotsRemaining", {
                          count: slotAvailability.available_spots,
                        })}
                      </span>
                    ) : null}
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
    showPaymentMethods = true,
    title = t("booking.paymentTitle"),
  ) {
    return (
      <aside className={s.payCard} data-testid="booking-payment-panel">
        <h2 className={s.payTitle}>{title}</h2>

        <div className={s.orderItems} data-testid="booking-order-items">
          {items.map((item) => (
            <div key={item.id} className={s.lineItem}>
              <span className={s.lineName}>{item.name}</span>
              <span className={s.linePrice}>
                {t("booking.priceSum", { price: formatPrice(item.price) })}
              </span>
            </div>
          ))}
        </div>

        <div className={s.total}>
          <span>{t("booking.total")}</span>
          <span className={s.totalAmount}>
            {t("booking.priceSum", { price: formatPrice(itemsTotal) })}
          </span>
        </div>

        {!paid && showPaymentMethods && (
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
                setSubmitAttempted(false);
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
            handleContinueFromDetails();
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
            <span className={s.label}>
              {t("booking.phoneLabel")} <span className={s.required}>*</span>
            </span>
            <input
              className={`${s.input} ${formErrors.phone ? s.inputError : ""}`}
              type="tel"
              value={form.phone}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  phone: formatUzbekPhoneInput(e.target.value, { preserveOverflow: true }),
                }));
                if (formErrors.phone) {
                  setFormErrors((prev) => ({ ...prev, phone: undefined }));
                }
              }}
              placeholder="+998 90 000 00 00"
              autoComplete="tel"
              required
              aria-invalid={!!formErrors.phone}
              aria-describedby={formErrors.phone ? "booking-phone-error" : undefined}
              data-testid="booking-phone-input"
            />
            {formErrors.phone && (
              <span
                id="booking-phone-error"
                className={s.fieldError}
                role="alert"
                data-testid="booking-phone-error"
              >
                {formErrors.phone}
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
                  disabled={guestCount <= 1}
                  aria-label={t("booking.guestsDecrease")}
                  data-testid="booking-guests-decrease"
                >
                  −
                </button>
                <span className={s.counterValue} data-testid="booking-guests-count">
                  {guestCount}
                </span>
                <button
                  type="button"
                  className={s.counterBtn}
                  onClick={() => setGuests((n) => Math.min(maxGuests, n + 1))}
                  disabled={guestCount >= maxGuests}
                  aria-label={t("booking.guestsIncrease")}
                  data-testid="booking-guests-increase"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </form>

        {renderPaymentSummary(
          allLineItems,
          total,
          t("common.continue"),
          handleContinueFromDetails,
          false,
          false,
          t("booking.orderSummary"),
        )}
      </div>
    );
  }

  function renderPendingStep3() {
    return (
      <div className={s.confirmLayout} data-testid="booking-confirm-step">
        <section className={s.confirmStatus}>
          <div className={s.pendingIcon} aria-hidden="true">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <path d="M12 6v6l4 2.5M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 3v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className={s.confirmTitle} data-testid="booking-confirm-title">
            {t("booking.pendingTitle")}
          </h2>
          <div className={s.whatsNext}>
            <h3 className={s.whatsNextTitle}>{t("booking.whatsNext")}</h3>
            <div className={s.whatsNextRow}>
              <span className={s.whatsNextIcon} aria-hidden="true">●</span>
              <p className={s.whatsNextList}>{t("booking.arriveEarly")}</p>
            </div>
            <div className={s.whatsNextRow}>
              <span className={s.whatsNextIcon} aria-hidden="true">◷</span>
              <p className={s.whatsNextList}>{t("booking.cancelPolicy")}</p>
            </div>
          </div>
          <div className={s.confirmActions}>
            <Link
              href={routes.bookings}
              onClick={(event) => {
                event.preventDefault();
                window.location.assign(routes.bookings);
              }}
              className={s.secondaryBtn}
              data-testid="booking-go-bookings"
            >
              {t("booking.viewBooking")}
            </Link>
            <Link href={routes.home} className={`${s.primaryLink} ${s.primaryLinkBtn}`}>
              {t("booking.goHome")}
            </Link>
          </div>
        </section>
        <section className={s.confirmOrder} data-testid="booking-confirm-summary">
          <h2>{t("booking.totalCost")}</h2>
          <div className={s.orderLines}>
            {allLineItems.map((item) => (
              <div key={item.id} className={s.orderLine}>
                <span>{item.name}</span>
                <strong>{t("booking.priceSum", { price: formatPrice(item.price) })}</strong>
              </div>
            ))}
          </div>
          <div className={s.orderTotal}>
            <span>{t("booking.total")}</span>
            <strong data-testid="booking-confirm-total">
              {t("booking.priceSum", { price: formatPrice(total) })}
            </strong>
          </div>
        </section>
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

      {renderTopCard()}
      {renderStepper()}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderPendingStep3()}

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
          extras={availableExtras}
          apiProductImages={availableExtras.map((extra) => {
            const service = shop.services?.find((item) => item.id === extra.id);
            return typeof service?.icon === "string" ? service.icon : null;
          })}
          extraQuantities={extraQuantities}
          onAddExtra={addExtra}
          onRemoveExtra={removeExtra}
          onClearExtra={clearExtra}
          onSkip={finishExtras}
          onContinue={finishExtras}
          isSubmitting={isSubmitting}
        />
      )}

      {showCardModal && (
        <CardPaymentModal
          amountText={formatPrice(total)}
          onClose={() => setShowCardModal(false)}
          onPay={async () => {
            setShowCardModal(false);
            try {
              await finishExtras(true);
              addLocalNotification({
                id: `local-payment-${shop.apiBusinessId ?? shop.id}-${Date.now()}`,
                type: "payment",
                title: "Оплата бронирования подтверждена",
                description: `Платёж на ${formatPrice(total)} сум успешно выполнен`,
              });
            } catch {
              return;
            }
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
