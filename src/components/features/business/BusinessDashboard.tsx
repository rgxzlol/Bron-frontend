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
import { useToastStore } from "@/store/toast.store";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import BusinessCardMenu from "./BusinessCardMenu";
import DeleteBusinessModal from "./DeleteBusinessModal";

type Props = {
  businessId: string;
  onClose: () => void;
  onEditProfile: () => void;
};

type View =
  | "servicesStaff"
  | "bookings"
  | "addService"
  | "addProduct"
  | "editService"
  | "editProduct";

type BookingTab = "all" | "pending" | "confirmed";

const inputClass =
  "w-full rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[16px] py-[14px] text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[#0a6af7]/30";

const MAX_DESC = 120;

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

const RU_MONTHS_GEN = [
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

function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4L18.5 9.5a2.1 2.1 0 000-3L16.5 4.5a2.1 2.1 0 00-3 0L3 15v5h1z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 8h14l-1 12H6L5 8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 10V6a3 3 0 016 0v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l9 5-9 5-9-5 9-5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M3 13l9 5 9-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.5 9.5h17M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0a6af7" strokeWidth="2" />
      <circle cx="9" cy="10" r="2" fill="#0a6af7" />
      <path d="M21 15l-5-5-4 4-2-2-5 5" stroke="#0a6af7" strokeWidth="2" />
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
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative mb-[18px] flex min-h-[44px] items-center justify-center">
      <button
        type="button"
        onClick={onBack}
        aria-label="Назад"
        className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-primary)]"
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
  guestCapacity: number | null;
  quantity: number | null;
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

function serviceToFormData(item: BusinessService): ServiceFormData {
  return {
    name: item.name,
    price: String(item.price),
    category: item.category,
    description: item.description,
    photo: item.photo,
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
      <div className="flex items-stretch gap-[8px]">
        <input
          type="text"
          className={`${inputClass} min-w-0 flex-1 ${error ? "border-[#e02424]" : ""}`}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          data-testid={testId}
          aria-invalid={error || undefined}
          onChange={(e) => onChange(formatPriceInputOnChange(e.target.value))}
        />
        <div className="relative w-[96px] shrink-0">
          <select
            className="h-full w-full appearance-none rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-surface)] py-[14px] pl-[16px] pr-[32px] text-[15px] font-semibold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[#0a6af7]/30"
            defaultValue="sum"
            aria-label="Currency"
          >
            <option value="sum">UZS</option>
          </select>
          <span className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2 text-[var(--text-primary)]">
            <ChevronDownIcon />
          </span>
        </div>
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
  value: Date;
  onChange: (date: Date) => void;
  prevMonthLabel: string;
  nextMonthLabel: string;
}) {
  const [month, setMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const isSelected = (day: number) =>
    value.getFullYear() === year &&
    value.getMonth() === monthIndex &&
    value.getDate() === day;

  return (
    <div
      className="rounded-[18px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-[16px]"
      data-testid="business-service-calendar"
    >
      <div className="flex items-center justify-between">
        <span className="text-[17px] font-bold">
          {RU_MONTHS[monthIndex]} {year}
        </span>
        <div className="flex items-center gap-[4px]">
          <button
            type="button"
            aria-label={prevMonthLabel}
            data-testid="business-service-calendar-prev"
            onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-muted)]"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label={nextMonthLabel}
            data-testid="business-service-calendar-next"
            onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-muted)]"
          >
            <span className="rotate-180">
              <ChevronLeftIcon />
            </span>
          </button>
        </div>
      </div>

      <div className="mb-[14px] mt-[10px] border-b border-[var(--border-default)]" />

      <div className="grid grid-cols-7">
        {RU_WEEKDAYS.map((day) => (
          <span
            key={day}
            className="pb-[10px] text-center text-[11px] font-semibold tracking-[0.06em] text-[var(--text-muted)]"
          >
            {day}
          </span>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const selected = isSelected(day);
          return (
            <button
              key={day}
              type="button"
              data-testid={`business-service-calendar-day-${day}`}
              data-selected={selected ? "true" : "false"}
              aria-pressed={selected}
              onClick={() => onChange(new Date(year, monthIndex, day))}
              className={`mx-auto my-[3px] flex h-[36px] w-[36px] items-center justify-center rounded-full text-[15px] font-semibold transition ${
                selected
                  ? "bg-[#2596a5] text-white"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)]"
              }`}
            >
              {day}
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
  const inputId = useId();

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    const result = await validateGalleryImageFile(file);
    if (!result.ok) {
      onUploadError(`businessErrors.${result.errorKey}`);
      return;
    }
    onPhotoChange(result.dataUrl);
  }

  return (
    <div
      className="flex flex-col gap-[8px]"
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
        data-has-photo={photo ? "true" : "false"}
        className="flex h-[150px] w-full cursor-pointer flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            className="h-full w-full object-cover"
            data-testid={`${testIdPrefix}-photo-preview`}
          />
        ) : (
          <>
            <PhotoIcon />
            <span className="text-[15px] font-semibold text-[#0a6af7] underline">
              {uploadLabel}
            </span>
          </>
        )}
      </label>
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
  onSave: (data: ServiceFormData) => void;
}) {
  const { t } = useTranslation();
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
  const [times, setTimes] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(() => new Date());
  const [durationMin, setDurationMin] = useState<number | null>(null);

  function toggleTime(slot: string) {
    setTimes((prev) =>
      prev.includes(slot) ? prev.filter((value) => value !== slot) : [...prev, slot],
    );
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
    <div data-testid={formTestId}>
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
      />

      <p className="mb-[16px] text-[14px] text-[var(--text-secondary)]">
        {isService
          ? t("businessForms.addServiceSubtitle")
          : t("businessForms.addProductSubtitle")}
      </p>

      <div className="flex flex-col gap-[18px]">
        {submitAttempted && hasFormFieldErrors(fieldErrors) ? (
          <div
            role="alert"
            className="rounded-[12px] border border-[#e02424]/30 bg-[#fff1f1] px-4 py-3 text-[14px] font-semibold text-[#e02424]"
            data-testid={`${fieldPrefix}-form-errors`}
          >
            {t("businessForms.formValidationSummary")}
          </div>
        ) : null}

        <label className="flex flex-col gap-[8px]">
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

        <PriceField
          label={
            isService ? t("businessForms.servicePrice") : t("businessForms.price")
          }
          value={form.price}
          error={fieldErrors.price}
          errorMessage={t("businessForms.required")}
          placeholder={t("businessForms.pricePlaceholder")}
          testId={`${fieldPrefix}-price-input`}
          errorTestId={`${fieldPrefix}-price-error`}
          onChange={(price) => {
            setForm((current) => ({ ...current, price }));
            if (parsePrice(price) > 0) clearFieldError("price");
          }}
        />

        <label className="flex flex-col gap-[8px]">
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
        ) : (
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
        )}

        <label className="flex flex-col gap-[8px]">
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
            <div className="flex flex-col gap-[12px]" data-testid="business-service-time-slots">
              <span className="text-[14px] font-semibold">
                {t("businessForms.freeTimeLabel")}
              </span>
              <div className="grid grid-cols-4 gap-[10px]">
                {TIME_SLOTS.map((slot) => {
                  const selected = times.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      data-testid={`business-service-time-slot-${slot.replace(":", "-")}`}
                      data-selected={selected ? "true" : "false"}
                      aria-pressed={selected}
                      onClick={() => toggleTime(slot)}
                      className={`rounded-[12px] py-[11px] text-center text-[14px] font-semibold transition ${
                        selected
                          ? "bg-[#0a6af7] text-white"
                          : "border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-[8px]">
              <span className="text-[14px] font-semibold">
                {t("businessForms.dateLabel")}
              </span>
              <CalendarField
                value={date}
                onChange={setDate}
                prevMonthLabel={t("businessForms.prevMonthAria")}
                nextMonthLabel={t("businessForms.nextMonthAria")}
              />
            </div>

            <label className="flex flex-col gap-[8px]">
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
          </>
        ) : null}

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

        <div className="mt-[10px] flex flex-col gap-[10px]">
          <button
            type="button"
            data-testid={`${fieldPrefix}-save-button`}
            onClick={() => {
              if (!validate()) return;
              onSave({
                ...form,
                price: String(parsePrice(form.price)),
                guestCapacity: form.guestCapacity ?? 1,
                quantity: form.quantity ?? 1,
              });
            }}
            className="w-full rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce]"
          >
            {isService
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

function BookingStatusBadge({
  status,
}: {
  status: BusinessBookingRequest["status"];
}) {
  const { t } = useTranslation();

  if (status === "pending") {
    return (
      <span
        className="rounded-full bg-[#fff3e0] px-[12px] py-[5px] text-[12px] font-semibold text-[#ff9500]"
        data-testid="business-booking-status-pending"
      >
        {t("businessDashboard.bookingStatusPending")}
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span
        className="rounded-full bg-[#fde8e8] px-[12px] py-[5px] text-[12px] font-semibold text-[#e02424]"
        data-testid="business-booking-status-cancelled"
      >
        {t("business.cancelled")}
      </span>
    );
  }
  return (
    <span
      className="rounded-full bg-[#e7f8ef] px-[12px] py-[5px] text-[12px] font-semibold text-[#00bd08]"
      data-testid="business-booking-status-confirmed"
    >
      {t("businessDashboard.bookingStatusConfirmed")}
    </span>
  );
}

function BookingChip({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span className="flex items-center gap-[6px] rounded-[10px] bg-[var(--bg-surface-muted)] px-[10px] py-[7px] text-[13px] font-semibold text-[var(--text-primary)]">
      <span className="text-[var(--text-secondary)]">{icon}</span>
      {text}
    </span>
  );
}

function BookingCard({
  booking,
  dateLabel,
  onAccept,
  onCancel,
}: {
  booking: BusinessBookingRequest;
  dateLabel: string;
  onAccept: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const isConfirmed =
    booking.status === "accepted" || booking.status === "waiting";

  return (
    <div
      className="flex flex-col gap-[14px] rounded-[18px] bg-[var(--bg-surface)] p-[16px]"
      data-testid={`business-booking-card-${booking.id}`}
    >
      <div className="flex items-start gap-[10px]">
        <div className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full bg-[var(--bg-surface-muted)]">
          <Image
            src={assets.profile.avatar}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[15px] font-bold"
            data-testid={`business-booking-customer-${booking.id}`}
          >
            {booking.customerName}
          </p>
          <p className="truncate text-[13px] text-[var(--text-muted)]">
            {booking.serviceName}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[8px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <BookingChip icon={<ClockIcon size={15} />} text={booking.time} />
          <BookingChip icon={<CalendarIcon size={15} />} text={dateLabel} />
        </div>
        <span
          className="text-[15px] font-bold"
          data-testid={`business-booking-price-${booking.id}`}
        >
          {t("businessDashboard.bookingPrice", {
            price: `${formatPrice(booking.price)} ${t("businessForms.currencySum")}`,
          })}
        </span>
      </div>

      {booking.status === "pending" && (
        <div className="flex gap-[10px]">
          <button
            type="button"
            data-testid={`business-booking-cancel-${booking.id}`}
            onClick={onCancel}
            className="flex-1 rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] py-[12px] text-[14px] font-semibold text-[var(--text-primary)]"
          >
            {t("business.cancelBooking")}
          </button>
          <button
            type="button"
            data-testid={`business-booking-accept-${booking.id}`}
            onClick={onAccept}
            className="flex-1 rounded-[12px] bg-[#0a6af7] py-[12px] text-[14px] font-semibold text-white transition hover:bg-[#0858ce]"
          >
            {t("business.acceptBooking")}
          </button>
        </div>
      )}

      {isConfirmed && (
        <div
          className="rounded-[12px] border border-[#0a6af7] py-[12px] text-center text-[14px] font-semibold text-[#0a6af7]"
          data-testid={`business-booking-accepted-${booking.id}`}
        >
          {t("business.accepted")}
        </div>
      )}
    </div>
  );
}

/* ---------- main component ---------- */

export default function BusinessDashboard({
  businessId,
  onClose,
  onEditProfile,
}: Props) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const addService = useBusinessStore((s) => s.addService);
  const addProduct = useBusinessStore((s) => s.addProduct);
  const updateService = useBusinessStore((s) => s.updateService);
  const removeService = useBusinessStore((s) => s.removeService);
  const toggleService = useBusinessStore((s) => s.toggleService);
  const updateBookingStatus = useBusinessStore((s) => s.updateBookingStatus);
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

  const [view, setView] = useState<View>("servicesStaff");
  const [bookingTab, setBookingTab] = useState<BookingTab>("all");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<BusinessService | null>(null);
  const [showDeleteBusiness, setShowDeleteBusiness] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BusinessService | null>(
    null,
  );
  const menuAnchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const headerMenuAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (view !== "bookings") return;
    void refreshBusinessBookings(businessId);
  }, [view, businessId, refreshBusinessBookings]);

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

  const pendingBookings = business.bookingRequests.filter(
    (b) => b.status === "pending",
  );
  const confirmedBookings = business.bookingRequests.filter(
    (b) => b.status === "accepted" || b.status === "waiting",
  );
  const cancelledBookings = business.bookingRequests.filter(
    (b) => b.status === "cancelled",
  );

  const income = confirmedBookings.reduce((sum, b) => sum + b.price, 0);
  const activeServicesCount = services.filter((s) => s.active).length;

  const today = new Date();
  const bookingDateLabel = `${today.getDate()} ${
    RU_MONTHS_GEN[today.getMonth()]
  } ${today.getFullYear()}`;

  function handleGalleryScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setPhotoIndex(Math.max(0, Math.min(Math.max(photos.length, 1) - 1, idx)));
  }

  function handleAddService(data: ServiceFormData) {
    void addService(businessId, {
      name: data.name,
      category: data.category,
      price: parsePrice(data.price),
      description: data.description,
      photo: data.photo,
      guestCapacity: data.guestCapacity ?? undefined,
      type: "service",
    });
    setView("servicesStaff");
  }

  async function handleAddProduct(data: ServiceFormData) {
    try {
      await addProduct(businessId, {
        name: data.name,
        category: data.category,
        price: parsePrice(data.price),
        description: data.description,
        photo: data.photo,
        quantity: data.quantity ?? undefined,
      });
      setView("servicesStaff");
    } catch {
      showToast(
        t("businessForms.addProductTitle"),
        t("businessErrors.saveFailed"),
      );
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
          ? { guestCapacity: data.guestCapacity ?? undefined }
          : { quantity: data.quantity ?? undefined }),
      });
      closeEditItem();
    } catch {
      showToast(
        editingItem.type === "product"
          ? t("businessForms.editProductTitle")
          : t("businessForms.editServiceTitle"),
        t("businessErrors.saveFailed"),
      );
    }
  }

  function renderInventoryRow(item: BusinessService) {
    const isService = item.type !== "product";

    return (
      <div
        key={item.id}
        className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto_auto] items-center gap-[10px] border-b border-[var(--border-default)] px-[12px] py-[12px] last:border-b-0"
        data-testid={`business-inventory-row-${item.id}`}
      >
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{item.name}</p>
          <p className="mt-[2px] text-[12px] text-[var(--text-muted)]">
            {isService
              ? t("businessDashboard.typeService")
              : t("businessDashboard.typeProduct")}
          </p>
        </div>
        <p className="truncate text-[13px] text-[var(--text-secondary)]">
          {item.category || t("businessDashboard.defaultCategory")}
        </p>
        <p className="text-[13px] font-semibold">{formatPrice(item.price)}</p>
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
          <div
            ref={(el) => {
              menuAnchorRefs.current[`row-${item.id}`] = el;
            }}
          >
            <button
              type="button"
              aria-label={t("businessDashboard.deleteAria", { name: item.name })}
              data-testid={`business-inventory-menu-${item.id}`}
              onClick={() =>
                setItemMenuId(itemMenuId === item.id ? null : item.id)
              }
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-muted)]"
            >
              <DotsVerticalIcon />
            </button>
          </div>
          {itemMenuId === item.id && (
            <BusinessCardMenu
              anchorEl={menuAnchorRefs.current[`row-${item.id}`]}
              editLabel={t("businessDashboard.menuEdit")}
              deleteLabel={t("common.delete")}
              onEdit={() => openEditItem(item)}
              onDelete={() => setDeleteTarget(item)}
              onClose={() => setItemMenuId(null)}
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
          <div
            ref={(el) => {
              menuAnchorRefs.current[`card-${item.id}`] = el;
            }}
            className="relative"
          >
            <button
              type="button"
              aria-label={`Меню ${item.name}`}
              onClick={() =>
                setItemMenuId(itemMenuId === item.id ? null : item.id)
              }
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-muted)]"
            >
              <DotsVerticalIcon />
            </button>
            {itemMenuId === item.id && (
              <BusinessCardMenu
                anchorEl={menuAnchorRefs.current[`card-${item.id}`]}
                editLabel={t("businessDashboard.menuEdit")}
                deleteLabel={t("common.delete")}
                onEdit={() => openEditItem(item)}
                onDelete={() => setDeleteTarget(item)}
                onClose={() => setItemMenuId(null)}
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
        dateLabel={bookingDateLabel}
        onAccept={() =>
          updateBookingStatus(businessId, booking.id, "accepted")
        }
        onCancel={() =>
          updateBookingStatus(businessId, booking.id, "cancelled")
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
        className="mx-auto flex w-full max-w-[640px] flex-col pb-[24px]"
        data-testid="business-dashboard"
      >
        {view === "servicesStaff" && (
          <div data-testid="business-dashboard-workspace">
            <ScreenHeader
              title={business.name || t("business.untitled")}
              onBack={onClose}
              action={
                <div className="relative" ref={headerMenuAnchorRef}>
                  <button
                    type="button"
                    aria-label={t("business.menuAria")}
                    aria-expanded={headerMenuOpen}
                    data-testid="business-dashboard-menu"
                    onClick={() => setHeaderMenuOpen((v) => !v)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-primary)]"
                  >
                    <DotsVerticalIcon />
                  </button>
                  {headerMenuOpen && (
                    <BusinessCardMenu
                      anchorEl={headerMenuAnchorRef.current}
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

            <div className="rounded-[24px] bg-[var(--bg-surface)] p-[16px]">
              <h3 className="text-[18px] font-bold">
                {t("businessDashboard.servicesTitle")}
              </h3>
              <p className="mt-[4px] text-[14px] text-[var(--text-secondary)]">
                {t("businessDashboard.servicesSubtitle")}
              </p>

              {categoryTags.length > 0 && (
                <div
                  className="mt-[12px] flex flex-wrap gap-[8px]"
                  data-testid="business-category-tags"
                >
                  {categoryTags.map((tag, index) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#f0f4ff] px-[12px] py-[6px] text-[12px] font-semibold text-[#0a6af7]"
                      data-testid={`business-category-tag-${index}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="mt-[16px] overflow-hidden rounded-[16px] border border-[var(--border-default)]"
                data-testid="business-services-table"
              >
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto_auto] gap-[10px] bg-[var(--bg-surface-muted)] px-[12px] py-[10px] text-[12px] font-semibold text-[var(--text-secondary)]">
                  <span>{t("businessDashboard.colName")}</span>
                  <span>{t("businessDashboard.colCategory")}</span>
                  <span>{t("businessDashboard.colPrice")}</span>
                  <span>{t("businessDashboard.colStatus")}</span>
                  <span className="text-right">{t("businessDashboard.colAction")}</span>
                </div>

                {business.services.length === 0 ? (
                  <p className="px-[12px] py-[28px] text-center text-[14px] text-[var(--text-muted)]">
                    {t("businessDashboard.emptyServices")}
                  </p>
                ) : (
                  business.services.map(renderInventoryRow)
                )}
              </div>

              <div className="mt-[16px] grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setView("addService")}
                  className="rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce]"
                  data-testid="business-dashboard-add-service"
                >
                  {t("business.addService")}
                </button>
                <button
                  type="button"
                  onClick={() => setView("addProduct")}
                  className="rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce]"
                  data-testid="business-dashboard-add-product"
                >
                  {t("business.addProduct")}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "bookings" && (
          <div data-testid="business-dashboard-bookings">
            <ScreenHeader
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
            </div>

            <div
              className="mt-[16px] flex flex-col gap-[12px]"
              data-testid="business-bookings-list"
            >
              {business.bookingRequests.length === 0 && (
                <p className="py-[32px] text-center text-[15px] text-[var(--text-muted)]">
                  {t("businessDashboard.emptyBookings")}
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
                    business.bookingRequests.length > 0 && (
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
                    business.bookingRequests.length > 0 && (
                      <p className="py-[24px] text-center text-[15px] text-[var(--text-muted)]">
                        {t("businessDashboard.emptyConfirmedBookings")}
                      </p>
                    )}
                  {confirmedBookings.map(renderBookingCard)}
                </>
              )}
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
            } catch {
              showToast(
                deleteTarget.type === "product"
                  ? t("businessDashboard.deleteProductTitle")
                  : t("businessDashboard.deleteTitle"),
                t("businessErrors.saveFailed"),
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
