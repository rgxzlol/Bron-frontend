"use client";

import { assets } from "@/lib/assets";
import {
  formatPrice,
  formatPriceInputOnChange,
  parsePrice,
} from "@/lib/formatPrice";
import {
  SERVICE_CATEGORIES,
  type BusinessBookingRequest,
  type BusinessService,
  useBusinessStore,
} from "@/store/business.store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { validateGalleryImageFile } from "@/lib/business/photos";
import {
  compareBookingsByTime,
  isBusinessBookingVisible,
  isPastBooking,
} from "@/lib/booking/classify";
import { useToastStore } from "@/store/toast.store";
import { businessesApi } from "@/lib/api";
import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import BusinessCardMenu from "./BusinessCardMenu";
import DeleteBusinessModal from "./DeleteBusinessModal";
import desktop from "./businessDashboardDesktop.module.css";
import BusinessCategoryIcon from "@/components/shared/BusinessCategoryIcon";

type Props = {
  businessId: string;
  onClose: () => void;
  onEditProfile: () => void;
  onBusinessIdChange?: (id: string) => void;
};

type View =
  | "servicesStaff"
  | "bookings"
  | "addService"
  | "addProduct"
  | "editService"
  | "editProduct";

type BookingTab = "all" | "pending" | "confirmed" | "past";

const inputClass =
  "w-full rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[16px] py-[14px] text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[#0a6af7]/30";

const MAX_DESC = 120;

function getCustomerInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase() ?? "")
    .join("");
}

const TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "19:00",
  "19:30",
  "20:00",
  "21:00",
  "22:00",
];

const SERVICE_DURATION_OPTIONS = [30, 60, 90, 120] as const;

function isAvailabilityTimeValid(time: string, durationMinutes: number) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes + durationMinutes <= 23 * 60 + 59;
}

const RU_MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const RU_WEEKDAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

/* ---------- icons ---------- */

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotsVerticalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function DashboardPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="var(--accent-fg)" strokeWidth="2" />
      <circle cx="9" cy="10" r="2" fill="var(--accent-fg)" />
      <path d="M21 15l-5-5-4 4-2-2-5 5" stroke="var(--accent-fg)" strokeWidth="2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12"
        stroke="#e02424"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseModalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
      <path
        d="M1 1.5L6 6.5L11 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- small shared pieces ---------- */

function WorkspaceTabs({
  active,
  onServicesStaff,
  onBookings,
  servicesLabel,
  bookingsLabel,
}: {
  active: "servicesStaff" | "bookings";
  onServicesStaff: () => void;
  onBookings: () => void;
  servicesLabel: string;
  bookingsLabel: string;
}) {
  const tabClass = (isActive: boolean) =>
    `flex-1 rounded-[12px] px-[14px] py-[12px] text-[14px] font-semibold transition ${
      isActive
        ? "bg-[#0a6af7] text-white"
        : "bg-[var(--bg-surface)] text-[var(--text-primary)]"
    }`;

  return (
    <div
      className="mb-[16px] flex gap-[8px] rounded-[16px] bg-[var(--bg-surface-muted)] p-[6px]"
      data-testid="business-dashboard-tabs"
      role="tablist"
    >
      <button
        type="button"
        role="tab"
        aria-selected={active === "servicesStaff"}
        data-testid="business-dashboard-tab-services-staff"
        className={tabClass(active === "servicesStaff")}
        onClick={onServicesStaff}
      >
        {servicesLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "bookings"}
        data-testid="business-dashboard-tab-bookings"
        className={tabClass(active === "bookings")}
        onClick={onBookings}
      >
        {bookingsLabel}
      </button>
    </div>
  );
}

function ScreenHeader({
  title,
  onBack,
  action,
  sticky = false,
  className,
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  const [isBackFixed, setIsBackFixed] = useState(false);

  useEffect(() => {
    if (!sticky) return;

    const handleScroll = () => {
      setIsBackFixed(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sticky]);

  return (
    <div
      className={`relative mb-[18px] flex min-h-[44px] items-center justify-center ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Назад"
        className={`absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-primary)] ${
          isBackFixed ? "business-item-screen-sticky-back" : ""
        }`}
      >
        <ChevronLeftIcon />
      </button>
      <h2 className="max-w-[60%] truncate text-[18px] font-bold">{title}</h2>
      {action && <div className="absolute right-0">{action}</div>}
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  const { t } = useTranslation();

  return active ? (
    <span className="rounded-full bg-[#e7f8ef] px-[12px] py-[5px] text-[12px] font-semibold text-[#00bd08]">
      {t("businessDashboard.activeStatus")}
    </span>
  ) : (
    <span className="rounded-full bg-[var(--bg-surface-muted)] px-[12px] py-[5px] text-[12px] font-semibold text-[var(--text-muted)]">
      {t("businessDashboard.inactiveStatus")}
    </span>
  );
}

function ServiceStatusToggle({
  active,
  ariaLabel,
  testId,
  onToggle,
}: {
  active: boolean;
  ariaLabel: string;
  testId: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
      data-testid={testId}
      data-active={active ? "true" : "false"}
      onClick={onToggle}
      className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors ${
        active ? "bg-[#0a6af7]" : "bg-[var(--bg-inactive)]"
      }`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-[left] duration-200 ease-in-out ${
          active ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

function ItemPhoto({
  photo,
  alt,
}: {
  photo: string | null;
  alt: string;
}) {
  return (
    <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[14px] bg-[var(--bg-surface-muted)]">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <Image
          src={assets.map.photo1}
          alt={alt}
          fill
          sizes="104px"
          className="object-cover"
        />
      )}
    </div>
  );
}

/* ---------- add service / product form ---------- */

type ServiceFormData = {
  name: string;
  price: string;
  category: string;
  description: string;
  photo: string | null;
  duration?: number;
  guestCapacity: number | null;
  quantity: number | null;
  availability?: NonNullable<BusinessService["availability"]>;
};

const emptyServiceForm = (): ServiceFormData => ({
  name: "",
  price: "",
  category: "",
  description: "",
  photo: null,
  guestCapacity: null,
  quantity: null,

});

function parseLocalDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function serviceToFormData(item: BusinessService): ServiceFormData {
  return {
    name: item.name,
    price: String(item.price),
    category: item.category,
    description: item.description,
    photo: item.photo,
    duration: item.duration,
    guestCapacity: item.guestCapacity ?? null,
    quantity: item.quantity ?? null,
  };
}

type FormFieldErrors = {
  name?: boolean;
  price?: boolean;
  category?: boolean;
  guestCapacity?: boolean;
  quantity?: boolean;
};

function getFormFieldErrors(
  form: ServiceFormData,
  options?: { requireGuestCapacity?: boolean; requireProductQuantity?: boolean },
): FormFieldErrors {
  return {
    name: !form.name.trim(),
    price: parsePrice(form.price) <= 0,
    category: !form.category.trim(),
    guestCapacity: options?.requireGuestCapacity
      ? form.guestCapacity == null || form.guestCapacity <= 0
      : undefined,
    quantity: options?.requireProductQuantity
      ? form.quantity == null || form.quantity <= 0
      : undefined,
  };
}

function hasFormFieldErrors(errors: FormFieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function FieldError({
  show,
  message,
  testId,
}: {
  show?: boolean;
  message: string;
  testId?: string;
}) {
  if (!show) return null;
  return (
    <span className="text-[13px] text-[#e02424]" data-testid={testId} role="alert">
      {message}
    </span>
  );
}

function useRequiredFormSubmit(
  form: ServiceFormData,
  options?: { requireGuestCapacity?: boolean; requireProductQuantity?: boolean },
) {
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  function validate(): boolean {
    const errors = getFormFieldErrors(form, options);
    setFieldErrors(errors);
    setSubmitAttempted(true);
    return !hasFormFieldErrors(errors);
  }

  function clearFieldError(field: keyof FormFieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  return { fieldErrors, submitAttempted, validate, clearFieldError };
}

function CategorySelect({
  value,
  onChange,
  error,
  placeholder,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  placeholder: string;
  testId?: string;
}) {
  return (
    <div className="relative">
      <select
        className={`${inputClass} appearance-none pr-[36px] ${error ? "border-[#e02424]" : ""}`}
        value={value}
        data-testid={testId}
        aria-invalid={error || undefined}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {SERVICE_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
        <ChevronDownIcon />
      </span>
    </div>
  );
}

function PriceField({
  label,
  value,
  onChange,
  error,
  errorMessage,
  placeholder,
  testId,
  errorTestId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  errorMessage: string;
  placeholder: string;
  testId?: string;
  errorTestId: string;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-semibold">{label}</span>
      <div className="relative">
        <input
          type="text"
          className={`${inputClass} w-full ${error ? "border-[#e02424]" : ""}`}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          data-testid={testId}
          aria-invalid={error || undefined}
          onChange={(e) => onChange(formatPriceInputOnChange(e.target.value))}
        />
      </div>
      <FieldError show={error} message={errorMessage} testId={errorTestId} />
    </div>
  );
}

function QuantityStepperField({
  label,
  value,
  onChange,
  decreaseLabel,
  increaseLabel,
  error,
  errorMessage,
  placeholder,
  testId,
  decreaseTestId,
  increaseTestId,
  countTestId,
  errorTestId,
  max = 99,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  decreaseLabel: string;
  increaseLabel: string;
  error?: boolean;
  errorMessage: string;
  placeholder: string;
  testId: string;
  decreaseTestId: string;
  increaseTestId: string;
  countTestId: string;
  errorTestId: string;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-[8px]" data-testid={testId}>
      <span className="text-[14px] font-semibold">{label}</span>
      <div
        className={`flex items-center justify-between rounded-[14px] border bg-[var(--bg-surface)] px-[16px] py-[12px] ${
          error ? "border-[#e02424]" : "border-[var(--border-default)]"
        }`}
        aria-invalid={error || undefined}
      >
        <button
          type="button"
          aria-label={decreaseLabel}
          data-testid={decreaseTestId}
          disabled={value == null}
          onClick={() => {
            if (value == null) return;
            onChange(value <= 1 ? null : value - 1);
          }}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[20px] font-bold transition hover:bg-[var(--bg-surface-muted)] disabled:opacity-40"
        >
          −
        </button>
        <span
          className={`text-[18px] font-bold ${
            value == null ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
          }`}
          data-testid={countTestId}
          data-empty={value == null ? "true" : "false"}
        >
          {value ?? placeholder}
        </span>
        <button
          type="button"
          aria-label={increaseLabel}
          data-testid={increaseTestId}
          disabled={value != null && value >= max}
          onClick={() => onChange(value == null ? 1 : Math.min(max, value + 1))}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[20px] font-bold transition hover:bg-[var(--bg-surface-muted)] disabled:opacity-40"
        >
          +
        </button>
      </div>
      <FieldError show={error} message={errorMessage} testId={errorTestId} />
    </div>
  );
}

function CalendarField({
  value,
  onChange,
  prevMonthLabel,
  nextMonthLabel,
}: {
  value: Date[];
  onChange: (dates: Date[]) => void;
  prevMonthLabel: string;
  nextMonthLabel: string;
}) {
  const [month, setMonth] = useState(() => new Date());

  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const prevMonthDays = new Date(year, monthIndex, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: { date: Date; inMonth: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, monthIndex - 1, prevMonthDays - i),
        inMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, monthIndex, day),
        inMonth: true,
      });
    }

    while (days.length % 7 !== 0) {
      const nextDay = days.length - startOffset - daysInMonth + 1;
      days.push({
        date: new Date(year, monthIndex + 1, nextDay),
        inMonth: false,
      });
    }

    return days;
  }, [monthIndex, year]);

  const isSelected = (date: Date) =>
    value.some(
      (d) =>
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate(),
    );

  function toggleDate(date: Date) {
    if (isSelected(date)) {
      onChange(value.filter((d) => !isSameDay(d, date)));
    } else {
      onChange([...value, date]);
    }
  }

  function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  return (
    <div
      className="rounded-[20px] bg-[#f3f3f2] p-[12px] sm:p-[14px]"
      data-testid="business-service-calendar"
    >
      <div className="mb-[10px] flex items-center justify-between gap-[10px]">
        <button
          type="button"
          aria-label={prevMonthLabel}
          data-testid="business-service-calendar-prev"
          onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
          className="flex h-[36px] w-[36px] items-center justify-center text-[22px] leading-none text-[#7a7a7a] transition hover:text-[#0a6af7]"
        >
          <ChevronLeftIcon />
        </button>

        <span className="text-center text-[30px] font-bold tracking-[-0.03em] text-white">
          {RU_MONTHS[monthIndex]}
        </span>

        <button
          type="button"
          aria-label={nextMonthLabel}
          data-testid="business-service-calendar-next"
          onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
          className="flex h-[36px] w-[36px] items-center justify-center text-[22px] leading-none text-[#7a7a7a] transition hover:text-[#0a6af7]"
        >
          <span className="rotate-180">
            <ChevronLeftIcon />
          </span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-x-[8px] gap-y-[8px]">
        {RU_WEEKDAYS.map((day) => (
          <span
            key={day}
            className="pb-[6px] text-center text-[14px] font-medium text-[#5d5d5d]"
          >
            {day}
          </span>
        ))}

        {calendarDays.map(({ date, inMonth }) => {
          const selected = isSelected(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const day = new Date(date);
          day.setHours(0, 0, 0, 0);
          const isPast = day < today;

          return (
            <button
              key={date.toISOString()}
              type="button"
              data-testid={`business-service-calendar-day-${date.getDate()}`}
              data-selected={selected ? "true" : "false"}
              data-in-month={inMonth ? "true" : "false"}
              data-date-state={
                isPast ? "past" : day.getTime() === today.getTime() ? "today" : "future"
              }
              aria-pressed={selected}
              aria-disabled={isPast}
              disabled={isPast}
              onClick={() => !isPast && toggleDate(date)}
              className={`mx-auto flex h-[42px] w-[42px] items-center justify-center rounded-full text-[15px] font-semibold transition ${
                selected && !isPast
                  ? "bg-[#0a6af7] text-white shadow-sm"
                  : isPast
                    ? "text-[#7a7a7a]"
                    : "text-white hover:bg-[var(--bg-hover)]"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PhotoUploadField({
  label,
  photo,
  onPhotoChange,
  uploadLabel,
  testIdPrefix,
  onUploadError,
}: {
  label: string;
  photo: string | null;
  onPhotoChange: (photo: string | null) => void;
  uploadLabel: string;
  testIdPrefix: string;
  onUploadError: (message: string) => void;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewPhoto =
    !previewFailed &&
    photo &&
    (photo.startsWith("data:image/") ||
      photo.startsWith("blob:") ||
      /^https?:\/\//i.test(photo) ||
      photo.startsWith("/"))
      ? photo
      : null;

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    setPreviewFailed(false);
    const result = await validateGalleryImageFile(file);
    if (!result.ok) {
      onUploadError(`businessErrors.${result.errorKey}`);
      return;
    }
    onPhotoChange(result.dataUrl);
  }

  return (
    <div
      className="relative flex flex-col gap-[8px]"
      data-testid={`${testIdPrefix}-photo-section`}
    >
      <span className="text-[14px] font-semibold">{label}</span>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        data-testid={`${testIdPrefix}-photo-input`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileChange(file);
          e.target.value = "";
        }}
      />
      <label
        htmlFor={inputId}
        data-testid={`${testIdPrefix}-photo-upload`}
        data-has-photo={previewPhoto ? "true" : "false"}
        className="flex h-[150px] w-full cursor-pointer flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      >
        {previewPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewPhoto}
            alt=""
            className="h-full w-full object-cover"
            data-testid={`${testIdPrefix}-photo-preview`}
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <>
            <PhotoIcon />
            <span className="text-[15px] font-semibold text-[var(--accent-fg)] underline">
              {uploadLabel}
            </span>
          </>
        )}
      </label>
      {previewPhoto ? (
        <button
          type="button"
          aria-label={`${uploadLabel}: ${t("common.delete")}`}
          data-testid={`${testIdPrefix}-photo-delete`}
          onClick={() => {
            setPreviewFailed(false);
            onPhotoChange(null);
          }}
          className="absolute right-[8px] top-[38px] rounded-full bg-black/65 px-[10px] py-[6px] text-[12px] font-semibold text-white"
        >
          {t("common.delete")}
        </button>
      ) : null}
    </div>
  );
}

function AddItemScreen({
  kind,
  initialItem,
  onBack,
  onSave,
}: {
  kind: "service" | "product";
  initialItem?: BusinessService;
  onBack: () => void;
  onSave: (data: ServiceFormData) => Promise<void>;
}) {
  const { t, locale } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const isService = kind === "service";
  const isEditing = Boolean(initialItem);
  const formTestId = isService ? "business-add-service-form" : "business-add-product-form";
  const fieldPrefix = isService ? "business-service" : "business-product";

  const [form, setForm] = useState<ServiceFormData>(() =>
    initialItem ? serviceToFormData(initialItem) : emptyServiceForm(),
  );
  const { fieldErrors, submitAttempted, validate, clearFieldError } =
    useRequiredFormSubmit(form, {
      requireGuestCapacity: isService,
      requireProductQuantity: !isService,
    });
  const [descriptionLimitHit, setDescriptionLimitHit] = useState(false);
  const [times, setTimes] = useState<string[]>(
    () => initialItem?.availability?.[0]?.times ?? [],
  );
  const [dates, setDates] = useState<Date[]>(() => {
    if (!initialItem || !initialItem.availability || !isService) return [];
    return initialItem.availability
      .map(({ date }) => parseLocalDate(date))
      .filter((d): d is Date => d !== null);
  });
  const [availabilityTimesByDate, setAvailabilityTimesByDate] = useState<
    Record<string, string[]>
  >(() =>
    Object.fromEntries(
      (initialItem?.availability ?? []).map(({ date, times: dateTimes }) => [
        date,
        dateTimes,
      ]),
    ),
  );
  const [activeAvailabilityDate, setActiveAvailabilityDate] = useState(
    () => initialItem?.availability?.[0]?.date ?? "",
  );
  const [customAvailabilityTime, setCustomAvailabilityTime] = useState("");
  const [durationMin, setDurationMin] = useState<number | null>(
    () => initialItem?.duration ?? null,
  );
  const [showOnlyFree, setShowOnlyFree] = useState(true);
  const [rules, setRules] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedDateTimes = activeAvailabilityDate
    ? availabilityTimesByDate[activeAvailabilityDate] ?? times
    : times;
  const availabilityTimeOptions = [
    ...new Set([...TIME_SLOTS, ...selectedDateTimes]),
  ].sort();

  function updateDates(nextDates: Date[]) {
    const nextDateKeys = nextDates.map(formatLocalDate);
    if (new Set(nextDateKeys).size > 366) {
      showToast(t("businessForms.dateLabel"), t("businessForms.availabilityDateLimit"));
      return;
    }
    const activeTimes =
      (activeAvailabilityDate &&
        availabilityTimesByDate[activeAvailabilityDate]) ||
      times;
    setAvailabilityTimesByDate((current) =>
      Object.fromEntries(
        nextDateKeys.map((date) => [
          date,
          current[date] ?? activeTimes,
        ]),
      ),
    );
    setDates(nextDates);
    if (!nextDateKeys.includes(activeAvailabilityDate)) {
      setActiveAvailabilityDate(nextDateKeys[0] ?? "");
    }
  }

  function toggleTime(slot: string) {
    const toggle = (current: string[]) =>
      current.includes(slot)
        ? current.filter((value) => value !== slot)
        : [...current, slot];
    const currentlySelected = selectedDateTimes.includes(slot);
    if (!currentlySelected && !isAvailabilityTimeValid(slot, durationMin ?? 60)) {
      showToast(t("businessForms.freeTimeLabel"), t("businessForms.availabilityTimeOutOfRange"));
      return;
    }
    if (activeAvailabilityDate && dates.some((date) => formatLocalDate(date) === activeAvailabilityDate)) {
      setAvailabilityTimesByDate((current) => ({
        ...current,
        [activeAvailabilityDate]: toggle(
          current[activeAvailabilityDate] ?? times,
        ),
      }));
      return;
    }
    setTimes(toggle);
  }

  function addCustomAvailabilityTime() {
    if (!activeAvailabilityDate) return;
    const currentTimes = selectedDateTimes;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(customAvailabilityTime)) return;
    if (!isAvailabilityTimeValid(customAvailabilityTime, durationMin ?? 60)) {
      showToast(t("businessForms.freeTimeLabel"), t("businessForms.availabilityTimeOutOfRange"));
      return;
    }
    if (currentTimes.includes(customAvailabilityTime)) {
      setCustomAvailabilityTime("");
      return;
    }
    if (currentTimes.length >= 288) {
      showToast(t("businessForms.freeTimeLabel"), t("businessForms.availabilityTimeLimit"));
      return;
    }

    setAvailabilityTimesByDate((current) => ({
      ...current,
      [activeAvailabilityDate]: [...currentTimes, customAvailabilityTime].sort(),
    }));
    setCustomAvailabilityTime("");
  }

  function formatDurationLabel(minutes: number): string {
    if (minutes === 60) return t("businessForms.duration60");
    if (minutes === 90) return t("businessForms.duration90");
    if (minutes === 120) return t("businessForms.duration120");
    return t("businessForms.duration30");
  }

  function updateDescription(nextValue: string) {
    const truncated = nextValue.slice(0, MAX_DESC);
    setDescriptionLimitHit(nextValue.length > MAX_DESC);
    setForm((current) => ({ ...current, description: truncated }));
  }

  function handleDescriptionPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = event.clipboardData.getData("text");
    const target = event.currentTarget;
    const start = target.selectionStart ?? form.description.length;
    const end = target.selectionEnd ?? form.description.length;
    const merged =
      form.description.slice(0, start) + pasted + form.description.slice(end);

    if (merged.length > MAX_DESC) {
      event.preventDefault();
      updateDescription(merged);
    }
  }

  return (
    <div className="business-item-screen" data-testid={formTestId}>
      <ScreenHeader
        title={
          isService
            ? isEditing
              ? t("businessForms.editServiceTitle")
              : t("businessForms.addServiceTitle")
            : isEditing
              ? t("businessForms.editProductTitle")
              : t("businessForms.addProductTitle")
        }
        onBack={onBack}
        sticky
      />

      <p className="business-item-subtitle mb-[16px] text-[14px] text-[var(--text-secondary)]">
        {isService
          ? t("businessForms.addServiceSubtitle")
          : t("businessForms.addProductSubtitle")}
      </p>

      <div
        className={
          isService
            ? "business-service-form-grid"
            : "business-product-form-grid"
        }
      >
        {submitAttempted && hasFormFieldErrors(fieldErrors) ? (
          <div
            role="alert"
            className="rounded-[12px] border border-[#e02424]/30 bg-[#fff1f1] px-4 py-3 text-[14px] font-semibold text-[#e02424]"
            data-testid={`${fieldPrefix}-form-errors`}
          >
            {t("businessForms.formValidationSummary")}
          </div>
        ) : null}

        <label className="flex flex-col gap-[8px]" data-field="name">
          <span className="text-[14px] font-semibold">
            {isService
              ? t("businessForms.serviceName")
              : t("businessForms.productName")}
          </span>
          <input
            className={`${inputClass} ${fieldErrors.name ? "border-[#e02424]" : ""}`}
            placeholder={
              isService
                ? t("businessForms.serviceNamePlaceholder")
                : t("businessForms.productNamePlaceholder")
            }
            value={form.name}
            data-testid={`${fieldPrefix}-name-input`}
            aria-invalid={fieldErrors.name || undefined}
            onChange={(e) => {
              const name = e.target.value;
              setForm((current) => ({ ...current, name }));
              if (name.trim()) clearFieldError("name");
            }}
          />
          <FieldError
            show={fieldErrors.name}
            message={t("businessForms.required")}
            testId={`${fieldPrefix}-name-error`}
          />
        </label>

        <div data-field="price">
          <PriceField
            label={
              isService ? t("businessForms.servicePrice") : t("businessForms.price")
            }
            value={form.price}
            error={fieldErrors.price}
            errorMessage={t("businessForms.required")}
            placeholder={t("businessForms.servicePricePlaceholder")}
            testId={`${fieldPrefix}-price-input`}
            errorTestId={`${fieldPrefix}-price-error`}
            onChange={(price) => {
              setForm((current) => ({ ...current, price }));
              if (parsePrice(price) > 0) clearFieldError("price");
            }}
          />
        </div>

        <label className="flex flex-col gap-[8px]" data-field="category">
          <span className="text-[14px] font-semibold">
            {t("businessForms.category")}
          </span>
          <CategorySelect
            value={form.category}
            error={fieldErrors.category}
            placeholder={t("businessForms.selectCategory")}
            testId={`${fieldPrefix}-category-select`}
            onChange={(category) => {
              setForm((current) => ({ ...current, category }));
              if (category.trim()) clearFieldError("category");
            }}
          />
          <FieldError
            show={fieldErrors.category}
            message={t("businessForms.required")}
            testId={`${fieldPrefix}-category-error`}
          />
        </label>

        {isService ? (
          <div data-field="quantity">
            <QuantityStepperField
              label={t("businessForms.guestCapacity")}
              value={form.guestCapacity}
              error={fieldErrors.guestCapacity}
              errorMessage={t("businessForms.required")}
              placeholder={t("businessForms.guestCapacityPlaceholder")}
              decreaseLabel={t("businessForms.guestCapacityDecrease")}
              increaseLabel={t("businessForms.guestCapacityIncrease")}
              testId="business-service-guest-capacity"
              decreaseTestId="business-service-guest-decrease"
              increaseTestId="business-service-guest-increase"
              countTestId="business-service-guest-count"
              errorTestId="business-service-guest-capacity-error"
              onChange={(guestCapacity) => {
                setForm((current) => ({ ...current, guestCapacity }));
                if (guestCapacity != null && guestCapacity > 0) {
                  clearFieldError("guestCapacity");
                }
              }}
            />
          </div>
        ) : (
          <div data-field="quantity">
            <QuantityStepperField
              label={t("businessForms.productQuantity")}
              value={form.quantity}
              error={fieldErrors.quantity}
              errorMessage={t("businessForms.required")}
              placeholder={t("businessForms.productQuantityPlaceholder")}
              decreaseLabel={t("businessForms.productQuantityDecrease")}
              increaseLabel={t("businessForms.productQuantityIncrease")}
              testId="business-product-quantity"
              decreaseTestId="business-product-quantity-decrease"
              increaseTestId="business-product-quantity-increase"
              countTestId="business-product-quantity-count"
              errorTestId="business-product-quantity-error"
              max={999}
              onChange={(quantity) => {
                setForm((current) => ({ ...current, quantity }));
                if (quantity != null && quantity > 0) {
                  clearFieldError("quantity");
                }
              }}
            />
          </div>
        )}

        <label className="flex flex-col gap-[8px]" data-field="description">
          <span className="text-[14px] font-semibold">
            {isService
              ? t("businessForms.serviceDescription")
              : t("businessForms.description")}
          </span>
          <textarea
            className={`${inputClass} min-h-[90px] resize-none ${
              descriptionLimitHit ? "border-[#e02424]" : ""
            }`}
            placeholder={
              isService
                ? t("businessForms.serviceDescriptionPlaceholder")
                : t("businessForms.productDescriptionPlaceholder")
            }
            maxLength={MAX_DESC}
            value={form.description}
            data-testid={`${fieldPrefix}-description-input`}
            aria-invalid={descriptionLimitHit || undefined}
            aria-describedby={`${fieldPrefix}-description-counter`}
            onPaste={handleDescriptionPaste}
            onChange={(e) => updateDescription(e.target.value)}
          />
          <div className="flex items-center justify-between gap-[12px]">
            <FieldError
              show={descriptionLimitHit}
              message={t("businessForms.descriptionLimitReached", { max: MAX_DESC })}
              testId={`${fieldPrefix}-description-error`}
            />
            <span
              id={`${fieldPrefix}-description-counter`}
              className={`ml-auto text-[12px] font-semibold ${
                form.description.length >= MAX_DESC
                  ? "text-[#e02424]"
                  : "text-[var(--text-muted)]"
              }`}
              data-testid={`${fieldPrefix}-description-counter`}
            >
              {t("businessForms.descriptionCounter", {
                count: form.description.length,
                max: MAX_DESC,
              })}
            </span>
          </div>
        </label>

        {isService ? (
          <>
            <div className="flex flex-col gap-[12px]" data-field="time" data-testid="business-service-time-slots">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[14px] font-semibold">
                    {t("businessForms.freeTimeLabel")}
                  </span>
                  <p className="text-[12px] font-semibold text-[var(--text-muted)]">
                    {t("businessForms.freeTimeHint")}
                  </p>
                  {activeAvailabilityDate ? (
                    <p className="mt-[3px] text-[12px] text-[var(--accent-fg)]">
                      {parseLocalDate(activeAvailabilityDate)?.toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showOnlyFree}
                  aria-label={t("businessForms.freeTimeToggle")}
                  onClick={() => setShowOnlyFree((value) => !value)}
                  className={`relative h-[24px] w-[48px] shrink-0 rounded-full transition ${
                    showOnlyFree ? "bg-[#0a6af7]" : "bg-[var(--border-default)]"
                  }`}
                >
                  <span
                    className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition ${
                      showOnlyFree ? "right-[3px]" : "left-[3px]"
                    }`}
                  />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-[10px]">
                {availabilityTimeOptions.map((slot) => {
                  const selected = selectedDateTimes.includes(slot);
                  const invalid = !selected && !isAvailabilityTimeValid(slot, durationMin ?? 60);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={invalid || !activeAvailabilityDate}
                      data-testid={`business-service-time-slot-${slot.replace(":", "-")}`}
                      data-selected={selected ? "true" : "false"}
                      aria-pressed={selected}
                      onClick={() => toggleTime(slot)}
                      className={`rounded-[12px] py-[11px] text-center text-[14px] font-semibold transition ${
                        selected
                          ? "bg-[#0a6af7] text-white"
                          : "border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      } ${invalid || !activeAvailabilityDate ? "cursor-not-allowed opacity-40" : ""}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-[8px]">
                <input
                  type="time"
                  step={60}
                  value={customAvailabilityTime}
                  disabled={!activeAvailabilityDate}
                  onChange={(event) => setCustomAvailabilityTime(event.target.value)}
                  aria-label={t("businessForms.availabilityTimePlaceholder")}
                  className={`${inputClass} min-w-0 py-[10px]`}
                />
                <button
                  type="button"
                  disabled={!activeAvailabilityDate || !customAvailabilityTime}
                  onClick={addCustomAvailabilityTime}
                  className="shrink-0 rounded-[12px] bg-[var(--primary)] px-[14px] py-[10px] text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("businessForms.addTimeSlot")}
                </button>
              </div>
              <div className="business-service-time-legend" aria-label={t("businessForms.timeLegend")}>
                <span>
                  <i className="business-service-time-legend-dot business-service-time-legend-dot-free" />
                  {t("businessForms.availableTime")}
                </span>
                <span>
                  <i className="business-service-time-legend-dot business-service-time-legend-dot-busy" />
                  {t("businessForms.busyTime")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-[8px]" data-field="date">
              <span className="text-[14px] font-semibold">
                {t("businessForms.dateLabel")}
              </span>
              <CalendarField
                value={dates}
                onChange={updateDates}
                prevMonthLabel={t("businessForms.prevMonthAria")}
                nextMonthLabel={t("businessForms.nextMonthAria")}
              />
              {dates.length > 0 && (
                <div className="flex flex-wrap gap-[8px] mt-[12px]">
                  {[...dates]
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date) => {
                      const formatted = date.toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                      });
                      const dateKey = formatLocalDate(date);
                      const isActive = dateKey === activeAvailabilityDate;
                      return (
                        <div
                          key={date.toISOString()}
                          className={`inline-flex items-center gap-[6px] rounded-full px-[12px] py-[6px] text-[13px] font-semibold transition ${
                            isActive
                              ? "bg-[#0a6af7] text-white"
                              : "border border-[var(--border-default)] text-[var(--text-primary)]"
                          }`}
                        >
                          <button
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => setActiveAvailabilityDate(dateKey)}
                          >
                            {formatted}
                          </button>
                          <button
                            type="button"
                            aria-label={`${formatted}: ${t("common.delete")}`}
                            onClick={() =>
                              updateDates(
                                dates.filter((selected) => formatLocalDate(selected) !== dateKey),
                              )
                            }
                            className="text-[16px] leading-none"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <label className="flex flex-col gap-[8px]" data-field="duration">
              <span className="text-[14px] font-semibold">
                {t("businessForms.bookingDuration")}
              </span>
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none pr-[36px]`}
                  value={durationMin ?? ""}
                  data-testid="business-service-duration-select"
                  data-selected={durationMin != null ? "true" : "false"}
                  onChange={(e) => {
                    const next = e.target.value ? Number(e.target.value) : null;
                    setDurationMin(next);
                  }}
                >
                  <option value="">{t("businessForms.selectDuration")}</option>
                  {SERVICE_DURATION_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {formatDurationLabel(minutes)}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <ChevronDownIcon />
                </span>
              </div>
            </label>

            <label className="flex flex-col gap-[8px]" data-field="rules">
              <span className="text-[14px] font-semibold">
                {t("businessForms.bookingRules")}
              </span>
              <textarea
                className={`${inputClass} min-h-[90px] resize-none`}
                placeholder={t("businessForms.bookingRulesPlaceholder")}
                value={rules}
                onChange={(event) => setRules(event.target.value)}
              />
            </label>
          </>
        ) : null}

        <div data-field="photo">
          <PhotoUploadField
            label={
              isService
                ? t("businessForms.photo")
                : t("businessForms.photoServiceOrProduct")
            }
            uploadLabel={t("businessForms.uploadPhoto")}
            testIdPrefix={fieldPrefix}
            photo={form.photo}
            onPhotoChange={(photo) => setForm((current) => ({ ...current, photo }))}
            onUploadError={(messageKey) => {
              showToast(t("businessForms.uploadPhoto"), t(messageKey));
            }}
          />
        </div>

        <div className="mt-[10px] flex flex-col gap-[10px]" data-field="actions">
          <button
            type="button"
            data-testid={`${fieldPrefix}-save-button`}
            disabled={isSaving}
            onClick={async () => {
              if (!validate()) return;
              setIsSaving(true);
              try {
                await onSave({
                  ...form,
                  price: String(parsePrice(form.price)),
                  duration: isService ? durationMin ?? undefined : undefined,
                  guestCapacity: form.guestCapacity ?? 1,
                  quantity: form.quantity ?? 1,
                  availability: dates
                    .map((date) => formatLocalDate(date))
                    .sort()
                    .map((date) => ({
                      date,
                      times: availabilityTimesByDate[date] ?? times,
                    })),
                });
              } finally {
                setIsSaving(false);
              }
            }}
            className="w-full rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? t("common.loading")
              : isService
              ? t("businessForms.saveService")
              : t("businessForms.saveServiceOrProduct")}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-[14px] bg-[var(--bg-surface)] py-4 text-[16px] font-semibold text-[var(--text-primary)]"
          >
            {t("businessForms.back")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- delete item modal (Frame 238 / 239) ---------- */

function DeleteItemModal({
  item,
  onCancel,
  onConfirm,
}: {
  item: BusinessService;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const isProduct = item.type === "product";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--backdrop)] p-[20px]"
      data-testid={
        isProduct ? "business-delete-product-modal" : "business-delete-item-modal"
      }
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] rounded-[20px] bg-[var(--bg-surface)] p-[20px] shadow-[var(--shadow-modal)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex items-center gap-[12px]">
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#fde8e8]">
              <TrashIcon />
            </span>
            <h3 className="text-[18px] font-bold">
              {t(
                isProduct
                  ? "businessDashboard.deleteProductTitle"
                  : "businessDashboard.deleteTitle",
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("businessForms.closeAria")}
            data-testid="business-delete-item-close"
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-muted)]"
          >
            <CloseModalIcon />
          </button>
        </div>

        <p
          className="mt-[16px] text-[15px] font-semibold leading-snug"
          data-testid={
            isProduct
              ? "business-delete-product-confirm"
              : "business-delete-item-confirm"
          }
        >
          {t(
            isProduct
              ? "businessDashboard.deleteProductConfirm"
              : "businessDashboard.deleteConfirm",
          )}{" "}
          <strong>{item.name}</strong>?
        </p>
        <p className="mt-[10px] text-[14px] leading-snug text-[var(--text-muted)]">
          {t(
            isProduct
              ? "businessDashboard.deleteProductHint"
              : "businessDashboard.deleteHint",
          )}
        </p>

        <div className="mt-[20px] flex gap-[10px]">
          <button
            type="button"
            onClick={onCancel}
            data-testid="business-delete-item-cancel"
            className="flex-1 rounded-[12px] bg-[#0a6af7] py-[13px] text-[15px] font-semibold text-white transition hover:bg-[#0858ce]"
          >
            {t("businessDashboard.deleteCancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            data-testid={
              isProduct
                ? "business-delete-product-confirm-btn"
                : "business-delete-item-confirm-btn"
            }
            className="flex-1 rounded-[12px] bg-[#e02424] py-[13px] text-[15px] font-semibold text-white transition hover:bg-[#c41f1f]"
          >
            {t(
              isProduct
                ? "businessDashboard.deleteProductConfirmBtn"
                : "businessDashboard.deleteConfirmBtn",
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- booking card (Frame 236) ---------- */

function BookingCard({
  booking,
  readOnly = false,
  onStatusChange,
  onAttendance,
}: {
  booking: BusinessBookingRequest;
  readOnly?: boolean;
  onStatusChange: (status: "accepted" | "cancelled") => Promise<void>;
  onAttendance: (status: "on_time" | "late" | "no_show") => Promise<void>;
}) {
  const { t } = useTranslation();
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [attendanceSavingStatus, setAttendanceSavingStatus] = useState<
    "on_time" | "late" | "no_show" | null
  >(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const isConfirmed =
    booking.status === "accepted" || booking.status === "waiting";
  const orderPanelId = useId();
  const items = booking.items ?? [];
  const orderItemCount = items.length
    ? items.reduce((total, item) => total + item.quantity, 0)
    : 1;
  return (
    <div
      className="flex flex-col gap-[8px] rounded-[16px] bg-[var(--bg-surface-muted)] p-[10px]"
      data-testid={`business-booking-card-${booking.id}`}
    >
      <div className="grid min-w-0 gap-[8px] xl:grid-cols-[minmax(245px,1.1fr)_minmax(120px,1fr)_auto_minmax(270px,1.2fr)] xl:items-center">
        <div className="flex min-w-0 items-center gap-[8px]">
          <span className="shrink-0 rounded-[10px] px-[6px] py-[8px] text-[13px] font-bold text-[var(--text-primary)]">
            {booking.time}
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-[8px] rounded-[12px] bg-[var(--bg-surface)] px-[10px] py-[7px]">
            <div className="relative h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
              {booking.customerAvatar ? (
                <Image
                  src={booking.customerAvatar}
                  alt=""
                  fill
                  sizes="34px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[var(--text-secondary)]">
                  {getCustomerInitials(booking.customerName)}
                </span>
              )}
            </div>
            <p
              className="min-w-0 flex-1 truncate text-[13px] font-bold text-[var(--text-primary)]"
              data-testid={`business-booking-customer-${booking.id}`}
            >
              {booking.customerName}
            </p>
            <div
              className="flex shrink-0 flex-col items-center leading-none"
              aria-label={
                booking.customerRatingStatsAvailable &&
                (booking.customerEvaluatedBookingsCount ?? 0) > 0 &&
                booking.customerRating != null
                  ? t("businessDashboard.customerRating", {
                      rating: booking.customerRating.toFixed(2),
                      count: booking.customerEvaluatedBookingsCount ?? 0,
                    })
                  : booking.customerRatingStatsAvailable
                    ? t("profile.noRating")
                    : t("profile.ratingUnavailable")
              }
              data-testid={`business-booking-customer-rating-${booking.id}`}
            >
              <span className="flex items-center justify-center gap-[3px] text-[12px] font-semibold leading-none text-[var(--text-primary)]">
                <Image
                  src={assets.profile.leftBarg}
                  alt=""
                  width={8}
                  height={14}
                  data-theme-invert
                />
                <span>
                  {booking.customerRatingStatsAvailable &&
                  (booking.customerEvaluatedBookingsCount ?? 0) > 0 &&
                  booking.customerRating != null
                    ? booking.customerRating.toFixed(2)
                    : "—"}
                </span>
                <Image
                  src={assets.profile.rightBarg}
                  alt=""
                  width={8}
                  height={14}
                  data-theme-invert
                />
              </span>
              <span className="mt-[3px] whitespace-nowrap text-[9px] text-[var(--text-muted)]">
                {booking.customerRatingStatsAvailable
                  ? booking.customerEvaluatedBookingsCount
                    ? t("profile.ratedBookingsCount", {
                        count: booking.customerEvaluatedBookingsCount,
                      })
                    : t("profile.noRating")
                  : t("profile.ratingUnavailable")}
              </span>
            </div>
          </div>
        </div>

        <p className="min-w-0 px-[4px] text-[13px] font-semibold leading-tight text-[var(--text-secondary)]">
          {booking.serviceName}
        </p>

        <span className="shrink-0 px-[4px] text-[13px] font-bold text-[var(--text-primary)] xl:text-right">
          {t("businessDashboard.bookingPrice", {
            price: `${formatPrice(booking.price)} ${t("businessForms.currencySum")}`,
          })}
        </span>

        <div className="flex min-w-0 items-center gap-[8px]">
          {isConfirmed && !readOnly ? (
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-[7px]">
              {([
                ["no_show", "businessDashboard.attendanceNoShow", "bg-[#FFE9E8]/80 text-[#E92026]", "bg-[#FFE9E8]/50 text-[#E92026]"],
                ["late", "businessDashboard.attendanceLate", "bg-[#FFF3E3]/80 text-[#EC8009]", "bg-[#FFF3E3]/50 text-[#EC8009]"],
                ["on_time", "businessDashboard.attendanceOnTime", "bg-[#E7F8EF]/80 text-[#00BD08]", "bg-[#E7F8EF]/50 text-[#00BD08]"],
              ] as const).map(([status, labelKey, baseClass, selectedClass]) => {
                const selected = booking.attendanceStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={async () => {
                      if (attendanceSubmitting) return;
                      setAttendanceSubmitting(true);
                      setAttendanceSavingStatus(status);
                      setAttendanceError(null);
                      try {
                        await onAttendance(status);
                      } catch (error) {
                        setAttendanceError(
                          error instanceof Error && error.message.trim()
                            ? error.message
                            : t("businessDashboard.attendanceUpdateError"),
                        );
                      } finally {
                        setAttendanceSubmitting(false);
                        setAttendanceSavingStatus(null);
                      }
                    }}
                    disabled={attendanceSubmitting || selected}
                    aria-pressed={selected}
                    className={`whitespace-nowrap rounded-[9px] px-[10px] py-[13px] text-[10px] font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
                      selected ? selectedClass : baseClass
                    }`}
                    data-testid={`business-booking-attendance-${status}-${booking.id}`}
                  >
                    {attendanceSavingStatus === status
                      ? t("common.loading")
                      : t(labelKey)}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {booking.customerRatingStatsAvailable ? (
        <p
          className="text-[10px] leading-tight text-[var(--text-muted)] xl:pl-[250px]"
          data-testid={`business-booking-customer-attendance-stats-${booking.id}`}
        >
          {t("profile.bookingAttendanceStats", {
            onTime: booking.customerOnTimeCount ?? 0,
            late: booking.customerLateCount ?? 0,
            noShow: booking.customerNoShowCount ?? 0,
          })}
        </p>
      ) : null}

      {booking.status === "pending" && !readOnly ? (
        <div className="flex gap-[8px]">
          <button
            type="button"
            onClick={async () => {
              if (statusSubmitting) return;
              setStatusSubmitting(true);
              setStatusError(null);
              try {
                await onStatusChange("cancelled");
              } catch (error) {
                setStatusError(
                  error instanceof Error && error.message.trim()
                    ? error.message
                    : t("businessErrors.itemSaveFailed"),
                );
              } finally {
                setStatusSubmitting(false);
              }
            }}
            disabled={statusSubmitting}
            className="flex-1 rounded-[9px] bg-[var(--bg-surface)] px-[10px] py-[11px] text-[13px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)] disabled:cursor-wait disabled:opacity-60"
            data-testid={`business-booking-reject-${booking.id}`}
          >
            {statusSubmitting ? t("common.loading") : t("businessDashboard.rejectBooking")}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (statusSubmitting) return;
              setStatusSubmitting(true);
              setStatusError(null);
              try {
                await onStatusChange("accepted");
              } catch (error) {
                setStatusError(
                  error instanceof Error && error.message.trim()
                    ? error.message
                    : t("businessErrors.itemSaveFailed"),
                );
              } finally {
                setStatusSubmitting(false);
              }
            }}
            disabled={statusSubmitting}
            className="flex-1 rounded-[9px] bg-[#0a6af7] px-[10px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-[#0858ce] disabled:cursor-wait disabled:opacity-60"
            data-testid={`business-booking-accept-${booking.id}`}
          >
            {statusSubmitting ? t("common.loading") : t("business.acceptBooking")}
          </button>
        </div>
      ) : null}

      {statusError ? (
        <p
          className="text-[12px] font-medium text-[#d14343]"
          role="alert"
          data-testid={`business-booking-status-error-${booking.id}`}
        >
          {statusError}
        </p>
      ) : null}

      {attendanceError ? (
        <p
          className="text-[12px] font-medium text-[#d14343]"
          role="alert"
          data-testid={`business-booking-attendance-error-${booking.id}`}
        >
          {attendanceError}
        </p>
      ) : null}

      <div className="mt-[4px] overflow-hidden rounded-[10px] bg-[var(--bg-surface)]">
        <button
          type="button"
          onClick={() => setIsOrderOpen((open) => !open)}
          aria-expanded={isOrderOpen}
          aria-controls={orderPanelId}
          className=" flex w-full items-center justify-between gap-[8px] px-[10px] py-[9px] text-left transition-colors hover:bg-[var(--bg-hover)]"
          data-testid={`business-booking-order-toggle-${booking.id}`}
        >
          <span className="flex min-w-0 items-center gap-[7px]">
            <Image
              src={assets.booking.bagIcon}
              alt=""
              width={16}
              height={16}
              data-theme-invert
            />
            <span className="truncate text-[12px] font-bold text-[var(--text-primary)]">
              {t("bookingsCard.orderComposition")}
            </span>
            <span className="shrink-0 text-[12px] font-semibold text-[var(--accent-fg)]">
              {t("bookingsCard.itemsCount", { count: orderItemCount })}
            </span>
          </span>
          <span
            className={`text-[var(--text-secondary)] transition-transform ${isOrderOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <ChevronDownIcon />
          </span>
        </button>
        {isOrderOpen ? (
          <ul
            id={orderPanelId}
            className="mt-[10px] flex flex-col gap-[6px] px-[10px] pb-[9px]"
            data-testid={`business-booking-order-items-${booking.id}`}
          >
            {items.map((item) => (
              <li
                key={`${item.kind}-${item.id}`}
                className="flex items-center justify-between gap-[8px] text-[12px] text-[var(--text-secondary)]"
              >
                <span className="min-w-0 truncate">
                  {item.name}
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                </span>
                <span className="shrink-0 font-semibold text-[var(--text-primary)]">
                  {formatPrice(item.price * item.quantity)}{" "}
                  {t("businessForms.currencySum")}
                </span>
              </li>
            ))}
            {items.length === 0 ? (
              <li className="flex items-center justify-between gap-[8px] text-[12px] text-[var(--text-secondary)]">
                <span className="min-w-0 truncate">{booking.serviceName}</span>
                <span className="shrink-0 font-semibold text-[var(--text-primary)]">
                  {formatPrice(booking.price)} {t("businessForms.currencySum")}
                </span>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- main component ---------- */

export default function BusinessDashboard({
  businessId,
  onClose,
  onEditProfile,
  onBusinessIdChange,
}: Props) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const addService = useBusinessStore((s) => s.addService);
  const addProduct = useBusinessStore((s) => s.addProduct);
  const updateService = useBusinessStore((s) => s.updateService);
  const removeService = useBusinessStore((s) => s.removeService);
  const toggleService = useBusinessStore((s) => s.toggleService);
  const updateBookingStatus = useBusinessStore((s) => s.updateBookingStatus);
  const updateBookingAttendance = useBusinessStore((s) => s.updateBookingAttendance);
  const updateBusinessViews = useBusinessStore((s) => s.updateBusinessViews);
  const refreshBusinessBookings = useBusinessStore(
    (s) => s.refreshBusinessBookings,
  );
  const removeBusiness = useBusinessStore((s) => s.removeBusiness);
  const businesses = useBusinessStore((s) => s.businesses);

  const business = useMemo(() => {
    const item = businesses.find((entry) => entry.id === businessId);
    if (!item) return undefined;

    return {
      ...item,
      services: item.services ?? [],
      bookingRequests: item.bookingRequests ?? [],
    };
  }, [businessId, businesses]);

  useEffect(() => {
    if (!/^\d+$/.test(businessId)) return;

    let cancelled = false;
    const refreshViews = async () => {
      try {
        const currentBusiness = await businessesApi.get(Number(businessId));
        if (cancelled || currentBusiness.views_count == null) return;
        updateBusinessViews(businessId, currentBusiness.views_count);
      } catch (error) {
        if (!cancelled) {
          console.warn(`Не удалось обновить просмотры бизнеса ${businessId}:`, error);
        }
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshViews();
      }
    };

    void refreshViews();
    const intervalId = window.setInterval(refreshWhenVisible, 30_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [businessId, updateBusinessViews]);

  const [view, setView] = useState<View>("servicesStaff");
  const [bookingTab, setBookingTab] = useState<BookingTab>("all");
  const [now, setNow] = useState(() => new Date());
  const [photoIndex, setPhotoIndex] = useState(0);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<BusinessService | null>(null);
  const [showDeleteBusiness, setShowDeleteBusiness] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BusinessService | null>(
    null,
  );
  const [itemMenuAnchor, setItemMenuAnchor] = useState<HTMLElement | null>(null);
  const [headerMenuAnchor, setHeaderMenuAnchor] = useState<HTMLElement | null>(null);
  const [desktopMenuAnchor, setDesktopMenuAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (view !== "bookings") return;
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void refreshBusinessBookings(businessId);
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [view, businessId, refreshBusinessBookings]);

  useEffect(() => {
    if (view !== "bookings") return;
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, [view]);

  const categoryTags = useMemo(() => {
    if (!business) return [];
    const tags = new Set<string>();
    if (business.category) tags.add(business.category);
    business.services.forEach((item) => {
      if (item.category) tags.add(item.category);
    });
    return Array.from(tags);
  }, [business]);

  if (!business) return null;

  const photos = [business.profilePhoto, ...business.gallery].filter(
    (photo): photo is string => Boolean(photo),
  );

  const services = business.services.filter((s) => s.type !== "product");
  const products = business.services.filter((s) => s.type === "product");

  const visibleBookings = business.bookingRequests.filter((booking) =>
    isBusinessBookingVisible({
      booking_date: booking.bookingDate,
      end_time: booking.endTime,
    }),
  );
  const pastBookings = business.bookingRequests
    .filter((booking) =>
      isPastBooking(
        {
          booking_date: booking.bookingDate,
          start_time: booking.time,
          end_time: booking.endTime,
        },
        now,
      ),
    )
    .sort((a, b) =>
      compareBookingsByTime(
        {
          booking_date: b.bookingDate,
          start_time: b.time,
        },
        {
          booking_date: a.bookingDate,
          start_time: a.time,
        },
      ),
    );
  const pendingBookings = visibleBookings.filter(
    (b) => b.status === "pending",
  );
  const confirmedBookings = visibleBookings.filter(
    (b) => b.status === "accepted" || b.status === "waiting",
  );
  const cancelledBookings = visibleBookings.filter(
    (b) => b.status === "cancelled",
  );

  const income = confirmedBookings.reduce((sum, b) => sum + b.price, 0);
  const activeServicesCount = services.filter((s) => s.active).length;

  function handleGalleryScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setPhotoIndex(Math.max(0, Math.min(Math.max(photos.length, 1) - 1, idx)));
  }

  async function handleAddService(data: ServiceFormData) {
    try {
      const nextId = await addService(businessId, {
        name: data.name,
        category: data.category,
        price: parsePrice(data.price),
        description: data.description,
        photo: data.photo,
        duration: data.duration,
        guestCapacity: data.guestCapacity ?? undefined,
        type: "service",
        availability: data.availability ?? [],
      });
      if (nextId !== businessId) {
        onBusinessIdChange?.(nextId);
      }
      setView("servicesStaff");
    } catch (error) {
      const message =
        error instanceof Error && /business not found/i.test(error.message)
          ? t("businessErrors.itemSaveFailed")
          : error instanceof Error && error.message.trim()
            ? error.message
            : t("businessErrors.itemSaveFailed");
      showToast(t("businessForms.addServiceTitle"), message);
    }
  }

  async function handleAddProduct(data: ServiceFormData) {
    try {
      const nextId = await addProduct(businessId, {
        name: data.name,
        category: data.category,
        price: parsePrice(data.price),
        description: data.description,
        photo: data.photo,
        quantity: data.quantity ?? undefined,
      });
      if (nextId !== businessId) {
        onBusinessIdChange?.(nextId);
      }
      setView("servicesStaff");
    } catch (error) {
      const message =
        error instanceof Error && /business not found/i.test(error.message)
          ? t("businessErrors.itemSaveFailed")
          : error instanceof Error && error.message.trim()
            ? error.message
            : t("businessErrors.itemSaveFailed");
      showToast(t("businessForms.addProductTitle"), message);
    }
  }

  function openEditItem(item: BusinessService) {
    setEditingItem(item);
    setItemMenuId(null);
    setView(item.type === "product" ? "editProduct" : "editService");
  }

  function closeEditItem() {
    setEditingItem(null);
    setView("servicesStaff");
  }

  async function handleEditItem(data: ServiceFormData) {
    if (!editingItem) return;

    try {
      await updateService(businessId, editingItem.id, {
        name: data.name,
        category: data.category,
        price: parsePrice(data.price),
        description: data.description,
        photo: data.photo,
        ...(editingItem.type === "service"
          ? { duration: data.duration }
          : {}),
        ...(editingItem.type === "service"
          ? { guestCapacity: data.guestCapacity ?? undefined }
          : { quantity: data.quantity ?? undefined }),
        ...(editingItem.type === "service"
          ? {
              availability: data.availability ?? [],
            }
          : {}),
      });
      closeEditItem();
    } catch (error) {
      showToast(
        editingItem.type === "product"
          ? t("businessForms.editProductTitle")
          : t("businessForms.editServiceTitle"),
        error instanceof Error && error.message.trim()
          ? error.message
          : t("businessErrors.saveFailed"),
      );
    }
  }

  function renderInventoryRow(item: BusinessService) {
    const isService = item.type !== "product";

    return (
      <div
        key={item.id}
        className={`${desktop.inventoryRow} grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto_auto] items-center gap-[10px] border-b border-[var(--border-default)] px-[12px] py-[12px] last:border-b-0`}
        data-testid={`business-inventory-row-${item.id}`}
      >
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{item.name}</p>
          <p className="mt-[2px] text-[12px] text-[var(--text-muted)]">
            {isService
              ? t("businessDashboard.typeService")
              : t("businessDashboard.typeProduct")}
          </p>
          {isService && item.availability && item.availability.length > 0 && (
            <p className="mt-[4px] text-[11px] text-[#0a6af7] font-medium">
              {t("businessForms.dateLabel")}: {item.availability.length} {item.availability.length === 1 ? "дата" : "даты"}
            </p>
          )}
        </div>
        <p className="truncate text-[13px] text-[var(--text-secondary)]">
          {item.category || t("businessDashboard.defaultCategory")}
        </p>
        <p className="text-[13px] font-semibold">{formatPrice(item.price)}</p>
        <p className={desktop.inventoryDescription}>
          {item.description || "—"}
        </p>
        <div className={desktop.inventoryPhoto}>
          <ItemPhoto photo={item.photo} alt={item.name} />
        </div>
        <ServiceStatusToggle
          active={item.active}
          ariaLabel={t("businessDashboard.serviceStatusAria", { name: item.name })}
          testId={
            isService
              ? `business-service-status-toggle-${item.id}`
              : `business-product-status-toggle-${item.id}`
          }
          onToggle={() => void toggleService(businessId, item.id, !item.active)}
        />
        <div className="relative flex justify-end">
          <div>
            <button
              type="button"
              aria-label={t("businessDashboard.deleteAria", { name: item.name })}
              data-testid={`business-inventory-menu-${item.id}`}
              onClick={(event) => {
                setItemMenuAnchor(event.currentTarget.parentElement);
                setItemMenuId(itemMenuId === item.id ? null : item.id);
              }}
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-muted)]"
            >
              <DotsVerticalIcon />
            </button>
          </div>
          {itemMenuId === item.id && (
            <BusinessCardMenu
              anchorEl={itemMenuAnchor}
              editLabel={t("businessDashboard.menuEdit")}
              deleteLabel={t("common.delete")}
              onEdit={() => openEditItem(item)}
              onDelete={() => setDeleteTarget(item)}
              onClose={() => {
                setItemMenuId(null);
                setItemMenuAnchor(null);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  function renderItemCard(item: BusinessService) {
    return (
      <div
        key={item.id}
        className="relative flex gap-[12px] rounded-[18px] bg-[var(--bg-surface)] p-[10px]"
      >
        <ItemPhoto photo={item.photo} alt={item.name} />

        <div className="flex min-w-0 flex-1 flex-col py-[4px] pr-[36px]">
          <p className="text-[16px] font-bold leading-tight">{item.name}</p>
          <p className="mt-[3px] truncate text-[12px] text-[var(--text-muted)]">
            {item.category || item.description || "Без категории"}
          </p>
          <div className="mt-auto flex items-end justify-between gap-[8px]">
            <span className="text-[16px] font-bold">
              {formatPrice(item.price)} сум
            </span>
            <ActiveBadge active={item.active} />
          </div>
        </div>

        <div className="absolute right-[8px] top-[8px]">
          <div className="relative">
            <button
              type="button"
              aria-label={`Меню ${item.name}`}
              onClick={(event) => {
                setItemMenuAnchor(event.currentTarget.parentElement);
                setItemMenuId(itemMenuId === item.id ? null : item.id);
              }}
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-muted)]"
            >
              <DotsVerticalIcon />
            </button>
            {itemMenuId === item.id && (
              <BusinessCardMenu
                anchorEl={itemMenuAnchor}
                editLabel={t("businessDashboard.menuEdit")}
                deleteLabel={t("common.delete")}
                onEdit={() => openEditItem(item)}
                onDelete={() => setDeleteTarget(item)}
                onClose={() => {
                  setItemMenuId(null);
                  setItemMenuAnchor(null);
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderBookingCard(booking: BusinessBookingRequest) {
    return (
      <BookingCard
        key={booking.id}
        booking={booking}
        onStatusChange={(status) =>
          updateBookingStatus(businessId, booking.id, status)
        }
        onAttendance={(attendanceStatus) =>
          updateBookingAttendance(businessId, booking.id, attendanceStatus)
        }
      />
    );
  }

  const bookingTabClass = (active: boolean) =>
    `flex items-center gap-[8px] rounded-[12px] px-[16px] py-[10px] text-[14px] font-semibold transition ${
      active
        ? "bg-[#0a6af7] text-white"
        : "bg-[var(--bg-surface)] text-[var(--text-primary)]"
    }`;

  return (
    <>
      <div
        className={`${desktop.page} mx-auto flex w-full flex-col pb-[24px] ${
          view === "addService" ||
          view === "addProduct" ||
          view === "editService" ||
          view === "editProduct"
            ? "max-w-none"
            : "max-w-[640px]"
        }`}
        data-testid="business-dashboard"
      >
        {view === "servicesStaff" && (
          <div
            className={desktop.workspace}
            data-testid="business-dashboard-workspace"
          >
            <div className={desktop.pageHeader}>
              <h1>{t("businessDashboard.title")}</h1>
            </div>

            <ScreenHeader
              className={desktop.mobileHeader}
              title={business.name || t("business.untitled")}
              onBack={onClose}
              action={
                <div className="relative">
                  <button
                    type="button"
                    aria-label={t("business.menuAria")}
                    aria-expanded={headerMenuOpen}
                    data-testid="business-dashboard-menu"
                    onClick={(event) => {
                      setHeaderMenuAnchor(event.currentTarget.parentElement);
                      setHeaderMenuOpen((v) => !v);
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-primary)]"
                  >
                    <DotsVerticalIcon />
                  </button>
                  {headerMenuOpen && (
                    <BusinessCardMenu
                      anchorEl={headerMenuAnchor}
                      editLabel={t("businessDashboard.editProfile")}
                      onEdit={onEditProfile}
                      onDelete={() => {
                        setHeaderMenuOpen(false);
                        setShowDeleteBusiness(true);
                      }}
                      onClose={() => setHeaderMenuOpen(false)}
                    />
                  )}
                </div>
              }
            />

            <WorkspaceTabs
              active="servicesStaff"
              servicesLabel={t("businessDashboard.tabServices")}
              bookingsLabel={t("businessDashboard.tabBookings")}
              onServicesStaff={() => setView("servicesStaff")}
              onBookings={() => setView("bookings")}
            />

            <section
              className={desktop.profileCard}
              data-testid="business-dashboard-profile"
            >
              <div className={desktop.profileAvatar}>
                {business.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.profilePhoto} alt="" />
                ) : (
                  <Image src={assets.map.photo1} alt="" fill sizes="100px" />
                )}
              </div>
              <div className={desktop.profileDetails}>
                <h2>{business.name || t("business.untitled")}</h2>
                {business.category && (
                  <p className={desktop.profileCategory}>{business.category}</p>
                )}
                {business.address && (
                  <p className={desktop.profileAddress}>
                    <DashboardPinIcon />
                    <span>{business.address}</span>
                  </p>
                )}
              </div>
              <div className={desktop.profileActions}>
                <button type="button" onClick={onClose}>
                  {t("businessForms.back")}
                </button>
                <button type="button" onClick={onEditProfile}>
                  {t("businessDashboard.editProfile")}
                </button>
                <div className={desktop.profileMenu}>
                  <button
                    type="button"
                    aria-label={t("business.menuAria")}
                    aria-expanded={desktopMenuOpen}
                    data-testid="business-dashboard-menu-desktop"
                    onClick={(event) => {
                      setDesktopMenuAnchor(event.currentTarget.parentElement);
                      setDesktopMenuOpen((value) => !value);
                    }}
                  >
                    <DotsVerticalIcon />
                  </button>
                  {desktopMenuOpen && (
                    <BusinessCardMenu
                      anchorEl={desktopMenuAnchor}
                      editLabel={t("businessDashboard.editProfile")}
                      onEdit={onEditProfile}
                      onDelete={() => {
                        setDesktopMenuOpen(false);
                        setShowDeleteBusiness(true);
                      }}
                      onClose={() => setDesktopMenuOpen(false)}
                    />
                  )}
                </div>
              </div>
            </section>

            <section className={desktop.servicesCard}>
              <div className={desktop.servicesHeading}>
                <div>
                  <h3>{t("businessDashboard.servicesTitle")}</h3>
                  <p>{t("businessDashboard.servicesSubtitle")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setView("addProduct")}
                  data-testid="business-dashboard-add-product-desktop"
                >
                  {t("business.addProduct")}
                </button>
              </div>
              {categoryTags.length > 0 && (
                <div
                  className={desktop.categoryTags}
                  data-testid="business-category-tags"
                >
                  {categoryTags.map((tag, index) => (
                      <span
                        key={tag}
                        data-testid={`business-category-tag-${index}`}
                      >
                        <BusinessCategoryIcon
                          category={tag}
                          size={14}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        {tag}
                      </span>
                    ))}
                </div>
              )}

              <div
                className={desktop.servicesTable}
                data-testid="business-services-table"
              >
                <div className={desktop.tableHeader}>
                  <span>{t("businessDashboard.colName")}</span>
                  <span>{t("businessDashboard.colCategory")}</span>
                  <span>{t("businessDashboard.colPrice")}</span>
                  <span className={desktop.desktopColumn}>
                    {t("businessDashboard.colDescription")}
                  </span>
                  <span className={desktop.desktopColumn}>
                    {t("businessDashboard.colPhoto")}
                  </span>
                  <span>{t("businessDashboard.colStatus")}</span>
                  <span className="text-right">{t("businessDashboard.colAction")}</span>
                </div>

                {business.services.length === 0 ? (
                  <p className={desktop.emptyServices}>
                    {t("businessDashboard.emptyServices")}
                  </p>
                ) : (
                  business.services.map(renderInventoryRow)
                )}
              </div>

              <div className={desktop.serviceActions}>
                <button
                  type="button"
                  onClick={() => setView("addService")}
                  data-testid="business-dashboard-add-service"
                >
                  {t("business.addService")}
                </button>
                <button
                  type="button"
                  onClick={() => setView("addProduct")}
                  className={desktop.mobileProductButton}
                  data-testid="business-dashboard-add-product"
                >
                  {t("business.addProduct")}
                </button>
                <button
                  type="button"
                  onClick={onEditProfile}
                  className={desktop.desktopEditProfileButton}
                >
                  {t("businessDashboard.editProfile")}
                </button>
              </div>
            </section>
          </div>
        )}

        {view === "bookings" && (
          <div className={desktop.workspace} data-testid="business-dashboard-bookings">
            <div className={desktop.pageHeader}>
              <h1>{t("businessDashboard.title")}</h1>
            </div>
            <ScreenHeader
              className={desktop.mobileHeader}
              title={business.name || t("business.untitled")}
              onBack={onClose}
            />

            <WorkspaceTabs
              active="bookings"
              servicesLabel={t("businessDashboard.tabServices")}
              bookingsLabel={t("businessDashboard.tabBookings")}
              onServicesStaff={() => setView("servicesStaff")}
              onBookings={() => setView("bookings")}
            />

            <h3 className="mb-[12px] text-[18px] font-bold">
              {t("businessDashboard.bookingsTitle")}
            </h3>

            <div className="flex flex-wrap gap-[8px]" data-testid="business-bookings-tabs">
              <button
                type="button"
                onClick={() => setBookingTab("all")}
                data-testid="business-bookings-tab-all"
                className={bookingTabClass(bookingTab === "all")}
              >
                {t("businessDashboard.bookingsTabAll")}
              </button>
              <button
                type="button"
                onClick={() => setBookingTab("pending")}
                data-testid="business-bookings-tab-pending"
                className={bookingTabClass(bookingTab === "pending")}
              >
                {t("businessDashboard.bookingsTabPending")}
                {pendingBookings.length > 0 && (
                  <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#fff3e0] px-[5px] text-[11px] font-bold text-[#ff9500]">
                    {pendingBookings.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setBookingTab("confirmed")}
                data-testid="business-bookings-tab-confirmed"
                className={bookingTabClass(bookingTab === "confirmed")}
              >
                {t("businessDashboard.bookingsTabConfirmed")}
                {confirmedBookings.length > 0 && (
                  <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#e7f8ef] px-[5px] text-[11px] font-bold text-[#00bd08]">
                    {confirmedBookings.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setBookingTab("past")}
                data-testid="business-bookings-tab-past"
                className={bookingTabClass(bookingTab === "past")}
              >
                {t("businessDashboard.bookingsTabPast")}
              </button>
            </div>

            <div
              className="mt-[16px] flex flex-col gap-[12px]"
              data-testid="business-bookings-list"
            >
              {(bookingTab === "past"
                ? pastBookings.length === 0
                : visibleBookings.length === 0) && (
                <p className="py-[32px] text-center text-[15px] text-[var(--text-muted)]">
                  {bookingTab === "past"
                    ? t("businessDashboard.emptyPastBookings")
                    : t("businessDashboard.emptyBookings")}
                </p>
              )}

              {bookingTab === "all" && (
                <>
                  {pendingBookings.map(renderBookingCard)}
                  {confirmedBookings.length > 0 && (
                    <p className="mt-[8px] text-[15px] font-bold">
                      {t("businessDashboard.bookingsTabConfirmed")}
                    </p>
                  )}
                  {confirmedBookings.map(renderBookingCard)}
                  {cancelledBookings.map(renderBookingCard)}
                </>
              )}
              {bookingTab === "pending" && (
                <>
                  {pendingBookings.length === 0 &&
                    visibleBookings.length > 0 && (
                      <p className="py-[24px] text-center text-[15px] text-[var(--text-muted)]">
                        {t("businessDashboard.emptyPendingBookings")}
                      </p>
                    )}
                  {pendingBookings.map(renderBookingCard)}
                </>
              )}
              {bookingTab === "confirmed" && (
                <>
                  {confirmedBookings.length === 0 &&
                    visibleBookings.length > 0 && (
                      <p className="py-[24px] text-center text-[15px] text-[var(--text-muted)]">
                        {t("businessDashboard.emptyConfirmedBookings")}
                      </p>
                    )}
                  {confirmedBookings.map(renderBookingCard)}
                </>
              )}
              {bookingTab === "past" &&
                pastBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    readOnly
                    onStatusChange={(status) =>
                      updateBookingStatus(businessId, booking.id, status)
                    }
                    onAttendance={(attendanceStatus) =>
                      updateBookingAttendance(
                        businessId,
                        booking.id,
                        attendanceStatus,
                      )
                    }
                  />
                ))}
            </div>
          </div>
        )}

        {view === "addService" && (
          <AddItemScreen
            kind="service"
            onBack={() => setView("servicesStaff")}
            onSave={handleAddService}
          />
        )}

        {view === "addProduct" && (
          <AddItemScreen
            kind="product"
            onBack={() => setView("servicesStaff")}
            onSave={handleAddProduct}
          />
        )}

        {view === "editService" && editingItem && (
          <AddItemScreen
            kind="service"
            initialItem={editingItem}
            onBack={closeEditItem}
            onSave={handleEditItem}
          />
        )}

        {view === "editProduct" && editingItem && (
          <AddItemScreen
            kind="product"
            initialItem={editingItem}
            onBack={closeEditItem}
            onSave={handleEditItem}
          />
        )}
      </div>

      {deleteTarget && (
        <DeleteItemModal
          item={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              await removeService(businessId, deleteTarget.id);
              setDeleteTarget(null);
              setItemMenuId(null);
            } catch (error) {
              showToast(
                deleteTarget.type === "product"
                  ? t("businessDashboard.deleteProductTitle")
                  : t("businessDashboard.deleteTitle"),
                error instanceof Error && error.message.trim()
                  ? error.message
                  : t("businessErrors.saveFailed"),
              );
            }
          }}
        />
      )}

      <DeleteBusinessModal
        businessName={business.name || t("business.untitled")}
        isOpen={showDeleteBusiness}
        onClose={() => setShowDeleteBusiness(false)}
        onConfirm={async () => {
          await removeBusiness(businessId);
          setShowDeleteBusiness(false);
          showToast(t("business.deleteSuccessTitle"), t("business.deleteSuccessDesc"));
          onClose();
        }}
      />

    </>
  );
}
