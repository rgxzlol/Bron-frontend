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
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import BusinessCardMenu from "./BusinessCardMenu";
import DeleteBusinessModal from "./DeleteBusinessModal";

type Props = {
  businessId: string;
  onClose: () => void;
  onEditProfile: () => void;
};

type View =
  | "dashboard"
  | "services"
  | "products"
  | "bookings"
  | "addService"
  | "addProduct";

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
  return active ? (
    <span className="rounded-full bg-[#e7f8ef] px-[12px] py-[5px] text-[12px] font-semibold text-[#00bd08]">
      Активна
    </span>
  ) : (
    <span className="rounded-full bg-[var(--bg-surface-muted)] px-[12px] py-[5px] text-[12px] font-semibold text-[var(--text-muted)]">
      Неактивна
    </span>
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

async function readImageFile(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  if (file.size > 2 * 1024 * 1024) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/* ---------- add service / product form ---------- */

type ServiceFormData = {
  name: string;
  price: string;
  category: string;
  description: string;
  photo: string | null;
};

const emptyServiceForm = (): ServiceFormData => ({
  name: "",
  price: "",
  category: "",
  description: "",
  photo: null,
});

type FormFieldErrors = {
  name?: boolean;
  price?: boolean;
};

function getFormFieldErrors(form: ServiceFormData): FormFieldErrors {
  return {
    name: !form.name.trim(),
    price: parsePrice(form.price) <= 0,
  };
}

function hasFormFieldErrors(errors: FormFieldErrors): boolean {
  return Boolean(errors.name || errors.price);
}

function FieldError({ show }: { show?: boolean }) {
  if (!show) return null;
  return <span className="text-[13px] text-[#e02424]">Обязательное поле</span>;
}

function useRequiredFormSubmit(form: ServiceFormData) {
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

  function validate(): boolean {
    const errors = getFormFieldErrors(form);
    setFieldErrors(errors);
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

  return { fieldErrors, validate, clearFieldError };
}

function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        className={`${inputClass} appearance-none pr-[36px]`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Выберите категорию</option>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-semibold">{label}</span>
      <div className="flex items-stretch gap-[8px]">
        <input
          type="text"
          className={`${inputClass} min-w-0 flex-1`}
          placeholder="Введите цену"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(formatPriceInputOnChange(e.target.value))}
        />
        <div className="relative w-[96px] shrink-0">
          <select
            className="h-full w-full appearance-none rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-surface)] py-[14px] pl-[16px] pr-[32px] text-[15px] font-semibold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[#0a6af7]/30"
            defaultValue="sum"
            aria-label="Валюта"
          >
            <option value="sum">Сум</option>
          </select>
          <span className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2 text-[var(--text-primary)]">
            <ChevronDownIcon />
          </span>
        </div>
      </div>
      <FieldError show={error} />
    </div>
  );
}

function PhotoUploadField({
  label,
  photo,
  onPhotoChange,
}: {
  label: string;
  photo: string | null;
  onPhotoChange: (photo: string | null) => void;
}) {
  const inputId = `photo-upload-${label.length}`;

  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-semibold">{label}</span>
      <label
        htmlFor={inputId}
        className="flex h-[150px] cursor-pointer flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      >
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await readImageFile(file);
            if (url) onPhotoChange(url);
            e.target.value = "";
          }}
        />
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <PhotoIcon />
            <span className="text-[15px] font-semibold text-[#0a6af7] underline">
              Загрузить фото
            </span>
          </>
        )}
      </label>
    </div>
  );
}

function CalendarField({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
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
    <div className="rounded-[18px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-[16px]">
      <div className="flex items-center justify-between">
        <span className="text-[17px] font-bold">
          {RU_MONTHS[monthIndex]} {year}
        </span>
        <div className="flex items-center gap-[4px]">
          <button
            type="button"
            aria-label="Предыдущий месяц"
            onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-muted)]"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
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

function AddItemScreen({
  kind,
  onBack,
  onSave,
}: {
  kind: "service" | "product";
  onBack: () => void;
  onSave: (data: ServiceFormData) => void;
}) {
  const isService = kind === "service";
  const noun = isService ? "услуги" : "товара";

  const [form, setForm] = useState<ServiceFormData>(emptyServiceForm);
  const { fieldErrors, validate, clearFieldError } = useRequiredFormSubmit(form);
  const [times, setTimes] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(() => new Date());

  function toggleTime(slot: string) {
    setTimes((prev) =>
      prev.includes(slot) ? prev.filter((t) => t !== slot) : [...prev, slot],
    );
  }

  return (
    <div>
      <ScreenHeader
        title={isService ? "Добавить услугу" : "Добавить товар"}
        onBack={onBack}
      />

      <div className="flex flex-col gap-[18px]">
        <label className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-semibold">Название {noun}</span>
          <input
            className={inputClass}
            placeholder="Введите название"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name }));
              if (name.trim()) clearFieldError("name");
            }}
          />
          <FieldError show={fieldErrors.name} />
        </label>

        <PriceField
          label={`Цена ${noun}`}
          value={form.price}
          error={fieldErrors.price}
          onChange={(price) => {
            setForm((f) => ({ ...f, price }));
            if (parsePrice(price) > 0) clearFieldError("price");
          }}
        />

        <label className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-semibold">Категория {noun}</span>
          <CategorySelect
            value={form.category}
            onChange={(category) => setForm((f) => ({ ...f, category }))}
          />
        </label>

        <label className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-semibold">Описание {noun}</span>
          <textarea
            className={`${inputClass} min-h-[90px] resize-none`}
            placeholder={isService ? "Опишите услугу" : "Опишите товар"}
            maxLength={MAX_DESC}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </label>

        {isService && (
          <>
            <div className="flex flex-col gap-[12px]">
              <span className="text-[14px] font-semibold">
                Выбери свободное время
              </span>
              <div className="grid grid-cols-4 gap-[10px]">
                {TIME_SLOTS.map((slot) => {
                  const selected = times.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
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
              <span className="text-[14px] font-semibold">Дата</span>
              <CalendarField value={date} onChange={setDate} />
            </div>
          </>
        )}

        <PhotoUploadField
          label={isService ? "Добавить фото" : "Добавить фото товара"}
          photo={form.photo}
          onPhotoChange={(photo) => setForm((f) => ({ ...f, photo }))}
        />

        <div className="mt-[10px] flex flex-col gap-[10px]">
          <button
            type="button"
            onClick={() => {
              if (!validate()) return;
              onSave({ ...form, price: String(parsePrice(form.price)) });
            }}
            className="w-full rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce]"
          >
            {isService ? "Сохранить услугу" : "Сохранить товар"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-[14px] bg-[var(--bg-surface)] py-4 text-[16px] font-semibold text-[var(--text-primary)]"
          >
            Назад
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
  const isProduct = item.type === "product";
  const nounAcc = isProduct ? "товар" : "услугу";
  const nounPrep = isProduct ? "о товаре" : "об услуге";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--backdrop)] p-[20px]"
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
              Удалить {nounAcc}?
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Закрыть"
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-muted)]"
          >
            <CloseModalIcon />
          </button>
        </div>

        <p className="mt-[16px] text-[15px] font-semibold leading-snug">
          Вы уверены, что хотите удалить {nounAcc}{" "}
          <strong>{item.name}</strong>
        </p>
        <p className="mt-[10px] text-[14px] leading-snug text-[var(--text-muted)]">
          Все данные {nounPrep}, время, даты и свободные слоты удалятся без
          возможности восстановить
        </p>

        <div className="mt-[20px] flex gap-[10px]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[12px] bg-[#0a6af7] py-[13px] text-[15px] font-semibold text-white transition hover:bg-[#0858ce]"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-[12px] bg-[#e02424] py-[13px] text-[15px] font-semibold text-white transition hover:bg-[#c41f1f]"
          >
            Удалить {nounAcc}
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
  if (status === "pending") {
    return (
      <span className="rounded-full bg-[#fff3e0] px-[12px] py-[5px] text-[12px] font-semibold text-[#ff9500]">
        Ожидает
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-[#fde8e8] px-[12px] py-[5px] text-[12px] font-semibold text-[#e02424]">
        Отменено
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#e7f8ef] px-[12px] py-[5px] text-[12px] font-semibold text-[#00bd08]">
      Подтвержденые
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
  const isConfirmed =
    booking.status === "accepted" || booking.status === "waiting";

  return (
    <div className="flex flex-col gap-[14px] rounded-[18px] bg-[var(--bg-surface)] p-[16px]">
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
          <p className="truncate text-[15px] font-bold">
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
        <span className="text-[15px] font-bold">
          {formatPrice(booking.price)} сум
        </span>
      </div>

      {booking.status === "pending" && (
        <div className="flex gap-[10px]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] py-[12px] text-[14px] font-semibold text-[var(--text-primary)]"
          >
            Отменить
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-[12px] bg-[#0a6af7] py-[12px] text-[14px] font-semibold text-white transition hover:bg-[#0858ce]"
          >
            Принять бронь
          </button>
        </div>
      )}

      {isConfirmed && (
        <div className="rounded-[12px] border border-[#0a6af7] py-[12px] text-center text-[14px] font-semibold text-[#0a6af7]">
          Бронь принята
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
  const addService = useBusinessStore((s) => s.addService);
  const addProduct = useBusinessStore((s) => s.addProduct);
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

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [bookingTab, setBookingTab] = useState<BookingTab>("all");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [itemMenuId, setItemMenuId] = useState<string | null>(null);
  const [showDeleteBusiness, setShowDeleteBusiness] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BusinessService | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (view !== "bookings") return;
    void refreshBusinessBookings(businessId);
  }, [view, businessId, refreshBusinessBookings]);

  if (!mounted || !business) return null;

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
      category: data.category || "Другое",
      price: parsePrice(data.price),
      description: data.description,
      photo: data.photo,
      type: "service",
    });
    setView("services");
  }

  function handleAddProduct(data: ServiceFormData) {
    void addProduct(businessId, {
      name: data.name,
      category: data.category || "Другое",
      price: parsePrice(data.price),
      description: data.description,
      photo: data.photo,
    });
    setView("products");
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
              onClick={() =>
                setItemMenuId(itemMenuId === item.id ? null : item.id)
              }
              className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-muted)]"
            >
              <DotsVerticalIcon />
            </button>
            {itemMenuId === item.id && (
              <BusinessCardMenu
                editLabel={item.active ? "Деактивировать" : "Активировать"}
                deleteLabel="Удалить"
                onEdit={() => toggleService(businessId, item.id, !item.active)}
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
      <div className="mx-auto flex w-full max-w-[640px] flex-col pb-[24px]">
        {view === "dashboard" && (
          <div>
            <ScreenHeader
              title={business.name || "Без названия"}
              onBack={onClose}
              action={
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Меню"
                    aria-expanded={headerMenuOpen}
                    onClick={() => setHeaderMenuOpen((v) => !v)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-primary)]"
                  >
                    <DotsVerticalIcon />
                  </button>
                  {headerMenuOpen && (
                    <BusinessCardMenu
                      editLabel="Редактировать бизнес"
                      deleteLabel="Удалить бизнес"
                      onEdit={onEditProfile}
                      onDelete={() => setShowDeleteBusiness(true)}
                      onClose={() => setHeaderMenuOpen(false)}
                    />
                  )}
                </div>
              }
            />

            <div className="rounded-[24px] bg-[var(--bg-surface)] p-[12px]">
              <div className="relative overflow-hidden rounded-[16px]">
                <div
                  onScroll={handleGalleryScroll}
                  style={{ scrollbarWidth: "none" }}
                  className="flex aspect-[2/1] w-full snap-x snap-mandatory overflow-x-auto [&::-webkit-scrollbar]:hidden"
                >
                  {photos.length > 0 ? (
                    photos.map((photo, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={photo}
                        alt={business.name}
                        className="h-full w-full shrink-0 snap-center object-cover"
                      />
                    ))
                  ) : (
                    <div className="relative h-full w-full shrink-0">
                      <Image
                        src={assets.map.photo1}
                        alt={business.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 640px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {business.category && (
                  <span className="absolute right-[10px] top-[10px] rounded-full bg-[#eef1ff]/95 px-[14px] py-[6px] text-[13px] font-semibold text-[#4f66eb]">
                    {business.category}
                  </span>
                )}
                <span className="absolute bottom-[10px] left-[12px] text-[12px] font-semibold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
                  {photoIndex + 1}/{Math.max(photos.length, 1)}
                </span>
              </div>

              <div className="mt-[14px] flex items-center justify-between gap-[10px] px-[4px]">
                <h3 className="min-w-0 truncate text-[22px] font-bold">
                  {business.name || "Без названия"}
                </h3>
                <span className="shrink-0 rounded-full bg-[#e7f8ef] px-[12px] py-[6px] text-[13px] font-semibold text-[#00bd08]">
                  Подтверждено
                </span>
              </div>
              <p className="mt-[4px] px-[4px] text-[15px] text-[var(--text-secondary)]">
                {business.address || "Ташкент, Узбекистан"}
              </p>

              <div className="mt-[16px] grid grid-cols-2 gap-[10px]">
                <div className="rounded-[16px] bg-[var(--bg-surface-muted)] px-[10px] py-[16px] text-center">
                  <p className="text-[20px] font-bold">{business.bookings}</p>
                  <p className="mt-[2px] text-[13px] text-[var(--text-secondary)]">
                    Бронирований
                  </p>
                </div>
                <div className="rounded-[16px] bg-[var(--bg-surface-muted)] px-[10px] py-[16px] text-center">
                  <p className="text-[20px] font-bold">
                    {formatPrice(business.views)}
                  </p>
                  <p className="mt-[2px] text-[13px] text-[var(--text-secondary)]">
                    Просмотров
                  </p>
                </div>
                <div className="rounded-[16px] bg-[var(--bg-surface-muted)] px-[10px] py-[16px] text-center">
                  <p className="text-[20px] font-bold">{formatPrice(income)}</p>
                  <p className="mt-[2px] text-[13px] text-[var(--text-secondary)]">
                    Доход{" "}
                    <span className="text-[var(--text-muted)]">(сум)</span>
                  </p>
                </div>
                <div className="rounded-[16px] bg-[var(--bg-surface-muted)] px-[10px] py-[16px] text-center">
                  <p className="text-[20px] font-bold">{activeServicesCount}</p>
                  <p className="mt-[2px] text-[13px] text-[var(--text-secondary)]">
                    Активные услуги
                  </p>
                </div>
              </div>

              <div className="mt-[20px] flex flex-col gap-[10px]">
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="flex w-full items-center gap-[12px] rounded-[14px] bg-[var(--bg-surface-muted)] px-[16px] py-[17px] text-[15px] font-semibold transition hover:bg-[var(--bg-hover)]"
                >
                  <PencilIcon />
                  Редактировать бизнес
                </button>
                <button
                  type="button"
                  onClick={() => setView("services")}
                  className="flex w-full items-center gap-[12px] rounded-[14px] bg-[var(--bg-surface-muted)] px-[16px] py-[17px] text-[15px] font-semibold transition hover:bg-[var(--bg-hover)]"
                >
                  <BagIcon />
                  Услуги
                </button>
                <button
                  type="button"
                  onClick={() => setView("products")}
                  className="flex w-full items-center gap-[12px] rounded-[14px] bg-[var(--bg-surface-muted)] px-[16px] py-[17px] text-[15px] font-semibold transition hover:bg-[var(--bg-hover)]"
                >
                  <LayersIcon />
                  Товары
                </button>
                <button
                  type="button"
                  onClick={() => setView("bookings")}
                  className="flex w-full items-center gap-[12px] rounded-[14px] bg-[var(--bg-surface-muted)] px-[16px] py-[17px] text-[15px] font-semibold transition hover:bg-[var(--bg-hover)]"
                >
                  <CalendarIcon />
                  Бронирования
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "services" && (
          <div>
            <ScreenHeader title="Услуги" onBack={() => setView("dashboard")} />
            <div className="flex flex-col gap-[12px]">
              {services.length === 0 && (
                <p className="py-[32px] text-center text-[15px] text-[var(--text-muted)]">
                  Услуг пока нет. Добавьте первую услугу.
                </p>
              )}
              {services.map(renderItemCard)}
            </div>
            <button
              type="button"
              onClick={() => setView("addService")}
              className="mt-[20px] w-full rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce]"
            >
              Добавить услугу
            </button>
          </div>
        )}

        {view === "products" && (
          <div>
            <ScreenHeader title="Товары" onBack={() => setView("dashboard")} />
            <div className="flex flex-col gap-[12px]">
              {products.length === 0 && (
                <p className="py-[32px] text-center text-[15px] text-[var(--text-muted)]">
                  Товаров пока нет. Добавьте первый товар.
                </p>
              )}
              {products.map(renderItemCard)}
            </div>
            <button
              type="button"
              onClick={() => setView("addProduct")}
              className="mt-[20px] w-full rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce]"
            >
              Добавить товар
            </button>
          </div>
        )}

        {view === "bookings" && (
          <div>
            <ScreenHeader
              title="Бронирования"
              onBack={() => setView("dashboard")}
            />

            <div className="flex flex-wrap gap-[8px]">
              <button
                type="button"
                onClick={() => setBookingTab("all")}
                className={bookingTabClass(bookingTab === "all")}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => setBookingTab("pending")}
                className={bookingTabClass(bookingTab === "pending")}
              >
                Ожидает
                {pendingBookings.length > 0 && (
                  <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#fff3e0] px-[5px] text-[11px] font-bold text-[#ff9500]">
                    {pendingBookings.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setBookingTab("confirmed")}
                className={bookingTabClass(bookingTab === "confirmed")}
              >
                Подтвержденые
                {confirmedBookings.length > 0 && (
                  <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#e7f8ef] px-[5px] text-[11px] font-bold text-[#00bd08]">
                    {confirmedBookings.length}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-[16px] flex flex-col gap-[12px]">
              {business.bookingRequests.length === 0 && (
                <p className="py-[32px] text-center text-[15px] text-[var(--text-muted)]">
                  Бронирований пока нет
                </p>
              )}

              {bookingTab === "all" && (
                <>
                  {pendingBookings.map(renderBookingCard)}
                  {confirmedBookings.length > 0 && (
                    <p className="mt-[8px] text-[15px] font-bold">
                      Подтвержденые
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
                        Нет заявок в ожидании
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
                        Нет подтверждённых броней
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
            onBack={() => setView("services")}
            onSave={handleAddService}
          />
        )}

        {view === "addProduct" && (
          <AddItemScreen
            kind="product"
            onBack={() => setView("products")}
            onSave={handleAddProduct}
          />
        )}
      </div>

      {deleteTarget && (
        <DeleteItemModal
          item={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            void removeService(businessId, deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}

      <DeleteBusinessModal
        businessName={business.name || "Без названия"}
        isOpen={showDeleteBusiness}
        onClose={() => setShowDeleteBusiness(false)}
        onConfirm={async () => {
          try {
            await removeBusiness(businessId);
            setShowDeleteBusiness(false);
            onClose();
          } catch {
            alert("Не удалось удалить бизнес. Попробуйте ещё раз.");
          }
        }}
      />
    </>
  );
}
