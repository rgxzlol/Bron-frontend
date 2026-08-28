"use client";

import {
  TIME_OPTIONS,
  calcWeeklyHours,
  type DayKey,
  type DaySchedule,
} from "@/lib/business/schedule";
import {
  validateGalleryImageFile,
  validateProfileImageFile,
} from "@/lib/business/photos";
import {
  BUSINESS_ERROR_MESSAGE_KEYS,
  BUSINESS_DESCRIPTION_MAX_LENGTH,
  clampBusinessDescription,
  validateBusinessForm,
  type BusinessFormErrorCodes,
  type BusinessFormErrors,
} from "@/lib/business/validation";
import { formatUzbekPhoneInput } from "@/lib/auth/validation";
import {
  BUSINESS_CATEGORIES,
  useBusinessStore,
} from "@/store/business.store";
import { ApiError } from "@/lib/api/client";
import { GeocodingError } from "@/lib/geocoding";
import { useTranslation } from "@/lib/i18n/useTranslation";
import AddressAutocomplete from "./AddressAutocomplete";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToastStore } from "@/store/toast.store";
import s from "./businessModal.module.css";

const GALLERY_SLOT_COUNT = 6;
const DAY_I18N_KEYS: Record<DayKey, string> = {
  mon: "businessModal.dayMon",
  tue: "businessModal.dayTue",
  wed: "businessModal.dayWed",
  thu: "businessModal.dayThu",
  fri: "businessModal.dayFri",
  sat: "businessModal.daySat",
  sun: "businessModal.daySun",
};

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

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

function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 4h6l2 3h4a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2h4l2-3z"
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="88" height="88" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="9.5" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5.5 19.2c1.2-2.8 3.6-4.4 6.5-4.4s5.3 1.6 6.5 4.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhotoIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="3" fill="#0a6af7" />
      <circle cx="9" cy="10" r="1.6" fill="white" />
      <path
        d="M21 16l-4.5-4.5-4 4-2-2L5 19h14a2 2 0 002-2v-1z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}

function SelectChevron({ className = "" }: { className?: string }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M1 1l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TimeSelect({
  value,
  onChange,
  ariaLabel,
  dataTestId,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  dataTestId?: string;
}) {
  return (
    <span className="relative inline-flex">
      <select
        aria-label={ariaLabel}
        data-testid={dataTestId}
        className="appearance-none rounded-[8px] bg-[var(--bg-surface-muted)] py-[8px] pl-[10px] pr-[26px] text-[13px] font-semibold outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {TIME_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <SelectChevron className="pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2" />
    </span>
  );
}

const inputClass =
  "w-full rounded-[12px] border border-black/5 bg-[var(--bg-surface)] px-[16px] py-[14px] text-[15px] shadow-[0_1px_5px_rgba(15,23,42,0.05)] outline-none placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[#0a6af7]/30";

const inputErrorClass =
  "border-[#e02424] ring-2 ring-[#e02424]/20 focus:ring-[#e02424]/20";

const labelClass = "text-[13px] font-semibold";

function fieldClass(hasError: boolean) {
  return hasError ? `${inputClass} ${inputErrorClass}` : inputClass;
}

function ScheduleToggle({
  isOpen,
  dayLabel,
  dayKey,
  onToggle,
}: {
  isOpen: boolean;
  dayLabel: string;
  dayKey: DayKey;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOpen}
      aria-label={`Toggle ${dayLabel}`}
      data-testid={`business-schedule-toggle-${dayKey}`}
      onClick={onToggle}
      className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors ${
        isOpen ? "bg-[#0a6af7]" : "bg-[var(--bg-inactive)]"
      }`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform ${
          isOpen ? "translate-x-[23px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default function BusinessModal({ onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const draft = useBusinessStore((s2) => s2.draft);
  const updateDraft = useBusinessStore((s2) => s2.updateDraft);
  const setDraftSchedule = useBusinessStore((s2) => s2.setDraftSchedule);
  const resetDraft = useBusinessStore((s2) => s2.resetDraft);
  const saveDraft = useBusinessStore((s2) => s2.saveDraft);
  const editingId = useBusinessStore((s2) => s2.editingId);
  const showToast = useToastStore((s2) => s2.showToast);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formErrors, setFormErrors] = useState<BusinessFormErrors>({});

  const weeklyHours = useMemo(
    () => Math.round(calcWeeklyHours(draft.schedule) * 10) / 10,
    [draft.schedule],
  );

  function getDayLabel(key: DayKey) {
    return t(DAY_I18N_KEYS[key]);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  function showBusinessError(errorKey: string) {
    alert(t(errorKey));
  }

  function mapValidationCodesToMessages(
    codes: BusinessFormErrorCodes,
  ): BusinessFormErrors {
    return Object.fromEntries(
      Object.entries(codes).map(([field, code]) => [
        field,
        t(BUSINESS_ERROR_MESSAGE_KEYS[code as keyof typeof BUSINESS_ERROR_MESSAGE_KEYS]),
      ]),
    ) as BusinessFormErrors;
  }

  function clearFieldError(field: keyof BusinessFormErrors) {
    if (!formErrors[field]) return;
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleProfileUpload(file: File) {
    const result = await validateProfileImageFile(file);
    if (!result.ok) {
      showBusinessError(`businessErrors.${result.errorKey}`);
      return;
    }
    updateDraft({ profilePhoto: result.dataUrl });
    clearFieldError("profilePhoto");
  }

  function handleDeleteProfilePhoto() {
    updateDraft({ profilePhoto: null });
  }

  async function handleGalleryUpload(index: number, file: File) {
    const result = await validateGalleryImageFile(file);
    if (!result.ok) {
      showBusinessError(`businessErrors.${result.errorKey}`);
      return;
    }
    const gallery = [...useBusinessStore.getState().draft.gallery];
    gallery[index] = result.dataUrl;
    updateDraft({ gallery });
    clearFieldError("gallery");
  }

  function updateScheduleDay(index: number, patch: Partial<DaySchedule>) {
    const schedule = useBusinessStore.getState().draft.schedule.map((day, i) => {
      if (i !== index) return day;
      const next = { ...day, ...patch };
      if (patch.isOpen === true && !day.isOpen) {
        const openTime = day.openTime === "00:00" ? "09:00" : day.openTime;
        const closeTime = day.closeTime === "00:00" ? "20:00" : day.closeTime;
        return { ...next, isOpen: true, openTime, closeTime };
      }
      return next;
    });
    setDraftSchedule(schedule);
  }

  async function handleSave(event?: { preventDefault?: () => void }) {
    event?.preventDefault?.();
    setSubmitAttempted(true);

    const codes = validateBusinessForm(draft);
    const errors = mapValidationCodesToMessages(codes);
    setFormErrors(errors);

    if (Object.keys(codes).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await saveDraft();
      if (editingId) {
        showToast("Изменения сохранены", "Информация о бизнесе успешно обновлена.");
      } else {
        showToast(
          "Бизнес успешно создан",
          "Теперь вы можете добавлять услуги и принимать бронирования.",
        );
      }
      onSaved();
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof GeocodingError
          ? error.message
          : t("businessErrors.saveFailed");
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (confirm("Удалить все введённые данные?")) {
      resetDraft();
      onClose();
    }
  }

  function renderGallerySlot(index: number, className: string) {
    const image = draft.gallery[index];
    return (
      <div key={index} className={className} data-testid={`business-gallery-slot-${index}`}>
        <input
          ref={(el) => {
            galleryInputRefs.current[index] = el;
          }}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          className="hidden"
          data-testid={`business-gallery-input-${index}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleGalleryUpload(index, file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => galleryInputRefs.current[index]?.click()}
          aria-label={t("businessModal.uploadPhoto")}
          data-testid={`business-gallery-upload-${index}`}
          className="relative flex h-full min-h-[100px] w-full flex-col items-center justify-center gap-[8px] overflow-hidden rounded-[14px] border-2 border-[#0a6af7] bg-[var(--bg-surface)] transition hover:bg-[#f0f4ff]"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              data-testid={`business-gallery-preview-${index}`}
            />
          ) : (
            <>
              <PhotoIcon />
              <span className="relative z-[1] text-[13px] font-semibold text-[#0a6af7] underline">
                {t("businessModal.uploadPhoto")}
              </span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (!mounted) return null;

  return createPortal(
    <div className={s.backdrop} data-testid="business-config-modal" data-editing={editingId ? "true" : "false"}>
      <div className={s.panel}>
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-[18px] pb-[28px]">
          <div className="relative flex items-center justify-center py-[8px]">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] transition hover:opacity-80"
              aria-label={t("businessModal.back")}
              data-testid="business-modal-back"
            >
              <ChevronLeftIcon />
            </button>
            <h2 className="text-[18px] font-bold" data-testid="business-modal-title">
              {t("businessModal.title")}
            </h2>
          </div>

          <section
            className="flex flex-col items-center rounded-[18px] bg-[var(--bg-surface)] px-[16px] py-[26px] shadow-[0_1px_6px_rgba(15,23,42,0.04)]"
            data-testid="business-profile-photo-section"
          >
            <div className="relative">
              <div
                className="flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-full text-[var(--text-primary)]"
                data-testid="business-profile-photo-preview"
                data-has-photo={draft.profilePhoto ? "true" : "false"}
              >
                {draft.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.profilePhoto}
                    alt={t("businessModal.profileAlt")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PersonIcon />
                )}
              </div>
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                className="absolute -bottom-[2px] -right-[4px] flex h-[28px] w-[28px] items-center justify-center rounded-[9px] bg-[#0a6af7] transition hover:bg-[#0858ce]"
                aria-label={t("businessModal.uploadProfilePhotoAria")}
                data-testid="business-profile-photo-camera"
              >
                <CameraIcon />
              </button>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                data-testid="business-profile-photo-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleProfileUpload(file);
                  e.target.value = "";
                }}
              />
            </div>

            <h3 className="mt-[14px] text-[18px] font-bold">
              {t("businessModal.profilePhotoTitle")}
            </h3>
            <p className="mt-[4px] text-center text-[13px] text-[var(--text-muted)]">
              {t("businessModal.profilePhotoSubtitle")}
            </p>
            <p className="mt-[6px] text-center text-[12px] text-[var(--text-muted)]">
              {t("businessModal.photoRequirements")}
            </p>

            <div className="mt-[18px] grid w-full grid-cols-2 gap-[12px]">
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                className="rounded-[10px] border border-[#0a6af7] py-[12px] text-[14px] font-semibold text-[#0a6af7] transition hover:bg-[#f0f4ff]"
                data-testid="business-profile-photo-upload"
              >
                {t("businessModal.uploadPhoto")}
              </button>
              <button
                type="button"
                disabled={!draft.profilePhoto}
                onClick={handleDeleteProfilePhoto}
                className="rounded-[10px] border border-[#e02424] py-[12px] text-[14px] font-semibold text-[#e02424] transition hover:bg-[#fde8e8] disabled:cursor-not-allowed disabled:opacity-40"
                data-testid="business-profile-photo-delete"
              >
                {t("businessModal.deletePhoto")}
              </button>
            </div>
            {submitAttempted && formErrors.profilePhoto ? (
              <p
                role="alert"
                className="mt-[12px] text-center text-[12px] font-semibold text-[#e02424]"
                data-testid="business-field-error-profilePhoto"
              >
                {formErrors.profilePhoto}
              </p>
            ) : null}
          </section>

          <form
            className="flex flex-col gap-[18px]"
            data-testid={editingId ? "business-profile-form-workspace" : "business-form"}
            data-editing={editingId ? "true" : "false"}
            noValidate
            onSubmit={handleSave}
          >
            {submitAttempted && Object.values(formErrors).some(Boolean) ? (
              <div
                role="alert"
                className="rounded-[12px] border border-[#e02424]/30 bg-[#fff1f1] px-4 py-3 text-[14px] font-semibold text-[#e02424]"
                data-testid="business-form-errors"
              >
                {t("businessErrors.formValidationSummary")}
              </div>
            ) : null}

          <section className="flex flex-col gap-[14px]">
            <h3 className="text-[17px] font-bold">{t("businessModal.infoTitle")}</h3>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>{t("businessModal.nameLabel")}</span>
              <input
                className={fieldClass(!!formErrors.name)}
                value={draft.name}
                placeholder={t("businessModal.namePlaceholder")}
                data-testid="business-name-input"
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? "business-name-error" : undefined}
                onChange={(e) => {
                  updateDraft({ name: e.target.value });
                  clearFieldError("name");
                }}
              />
              {formErrors.name ? (
                <span
                  id="business-name-error"
                  role="alert"
                  className="text-[12px] font-semibold text-[#e02424]"
                  data-testid="business-field-error-name"
                >
                  {formErrors.name}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>{t("businessModal.categoryLabel")}</span>
              <span className="relative">
                <select
                  className={`${fieldClass(!!formErrors.category)} appearance-none pr-[42px] ${
                    draft.category ? "" : "text-[var(--text-secondary)]"
                  }`}
                  value={draft.category}
                  data-testid="business-category-select"
                  aria-invalid={!!formErrors.category}
                  aria-describedby={formErrors.category ? "business-category-error" : undefined}
                  onChange={(e) => {
                    updateDraft({ category: e.target.value });
                    clearFieldError("category");
                  }}
                >
                  <option value="">{t("businessModal.required")}</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <SelectChevron className="pointer-events-none absolute right-[18px] top-1/2 -translate-y-1/2" />
              </span>
              {formErrors.category ? (
                <span
                  id="business-category-error"
                  role="alert"
                  className="text-[12px] font-semibold text-[#e02424]"
                  data-testid="business-field-error-category"
                >
                  {formErrors.category}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>{t("businessModal.descriptionLabel")}</span>
              <span
                className={`rounded-[12px] border bg-[var(--bg-surface)] px-[16px] py-[12px] shadow-[0_1px_5px_rgba(15,23,42,0.05)] focus-within:ring-2 ${
                  formErrors.description
                    ? "border-[#e02424] focus-within:ring-[#e02424]/20"
                    : "border-black/5 focus-within:ring-[#0a6af7]/30"
                }`}
              >
                <textarea
                  className="min-h-[56px] w-full resize-y bg-transparent text-[15px] outline-none placeholder:text-[var(--text-muted)]"
                  value={draft.description}
                  placeholder={t("businessModal.descriptionPlaceholder")}
                  maxLength={BUSINESS_DESCRIPTION_MAX_LENGTH}
                  data-testid="business-description-input"
                  aria-invalid={!!formErrors.description}
                  aria-describedby={formErrors.description ? "business-description-error" : undefined}
                  onChange={(e) => {
                    updateDraft({
                      description: clampBusinessDescription(e.target.value),
                    });
                    clearFieldError("description");
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    updateDraft({
                      description: clampBusinessDescription(draft.description + pasted),
                    });
                    clearFieldError("description");
                  }}
                />
                <span
                  className="block text-right text-[12px] text-[var(--text-muted)]"
                  data-testid="business-description-counter"
                >
                  {t("businessModal.wordCount", {
                    count: draft.description.length,
                    max: BUSINESS_DESCRIPTION_MAX_LENGTH,
                  })}
                </span>
              </span>
              {formErrors.description ? (
                <span
                  id="business-description-error"
                  role="alert"
                  className="text-[12px] font-semibold text-[#e02424]"
                  data-testid="business-field-error-description"
                >
                  {formErrors.description}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>{t("businessModal.addressLabel")}</span>
              <AddressAutocomplete
                value={draft.address}
                coordsSelected={draft.lat != null && draft.lng != null}
                hasError={!!formErrors.address}
                errorMessage={formErrors.address}
                inputTestId="business-address-input"
                inputClassName={fieldClass(!!formErrors.address)}
                placeholder={t("businessModal.addressPlaceholder")}
                onChange={({ address, lat, lng }) => {
                  updateDraft({ address, lat, lng });
                  clearFieldError("address");
                }}
              />
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>{t("businessModal.phoneLabel")}</span>
              <input
                className={fieldClass(!!formErrors.phone)}
                value={draft.phone}
                placeholder="+998 99 000 00 00"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                data-testid="business-phone-input"
                aria-invalid={!!formErrors.phone}
                aria-describedby={formErrors.phone ? "business-phone-error" : undefined}
                onChange={(e) => {
                  updateDraft({ phone: formatUzbekPhoneInput(e.target.value) });
                  clearFieldError("phone");
                }}
              />
              {formErrors.phone ? (
                <span
                  id="business-phone-error"
                  role="alert"
                  className="text-[12px] font-semibold text-[#e02424]"
                  data-testid="business-field-error-phone"
                >
                  {formErrors.phone}
                </span>
              ) : null}
            </label>
          </section>

          <section
            className="flex flex-col gap-[10px]"
            data-testid="business-gallery-section"
          >
            <div>
              <h3 className={labelClass}>{t("businessModal.galleryTitle")}</h3>
              <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                {t("businessModal.gallerySubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3">
              {renderGallerySlot(0, "row-span-2 min-h-[190px]")}
              {renderGallerySlot(1, "min-h-[88px]")}
              {renderGallerySlot(2, "min-h-[88px]")}
              {Array.from({ length: GALLERY_SLOT_COUNT - 3 }, (_, offset) =>
                renderGallerySlot(offset + 3, "min-h-[88px]"),
              )}
            </div>
            {submitAttempted && formErrors.gallery ? (
              <p
                role="alert"
                className="text-[12px] font-semibold text-[#e02424]"
                data-testid="business-field-error-gallery"
              >
                {formErrors.gallery}
              </p>
            ) : null}
          </section>

          <section
            className="flex flex-col gap-[10px]"
            data-testid="business-schedule-section"
          >
            <div>
              <h3 className={labelClass}>{t("businessModal.scheduleTitle")}</h3>
              <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                {t("businessModal.scheduleSubtitle")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="flex flex-col gap-[6px] rounded-[18px] bg-[var(--bg-surface)] p-[12px] shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
                {draft.schedule.map((day, index) => {
                  const dayLabel = getDayLabel(day.key);
                  return (
                    <div
                      key={day.key}
                      className="flex items-center gap-[8px] rounded-[12px] px-[6px] py-[10px]"
                      data-testid={`business-schedule-day-${day.key}`}
                      data-open={day.isOpen ? "true" : "false"}
                    >
                      <ScheduleToggle
                        isOpen={day.isOpen}
                        dayLabel={dayLabel}
                        dayKey={day.key}
                        onToggle={() =>
                          updateScheduleDay(index, { isOpen: !day.isOpen })
                        }
                      />

                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                        {dayLabel}
                      </span>

                      {day.isOpen ? (
                        <span className="flex items-center gap-[6px]">
                          <TimeSelect
                            value={day.openTime}
                            ariaLabel={`${dayLabel}: ${t("businessModal.open")}`}
                            dataTestId={`business-schedule-open-${day.key}`}
                            onChange={(openTime) =>
                              updateScheduleDay(index, { openTime })
                            }
                          />
                          <span className="text-[13px] opacity-50">—</span>
                          <TimeSelect
                            value={day.closeTime}
                            ariaLabel={`${dayLabel}: ${t("businessModal.closeTime")}`}
                            dataTestId={`business-schedule-close-${day.key}`}
                            onChange={(closeTime) =>
                              updateScheduleDay(index, { closeTime })
                            }
                          />
                        </span>
                      ) : (
                        <span
                          className="rounded-[8px] bg-[#fde8e8] px-[14px] py-[8px] text-[13px] font-semibold text-[#e02424]"
                          data-testid={`business-schedule-closed-${day.key}`}
                        >
                          {t("businessModal.closed")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <aside
                className="rounded-[18px] bg-[var(--bg-surface)] p-[14px] shadow-[0_1px_6px_rgba(15,23,42,0.04)]"
                data-testid="business-weekly-schedule"
              >
                <h4 className="text-[14px] font-bold text-[var(--text-primary)]">
                  {t("businessModal.weeklySchedule")}
                </h4>
                <ul className="mt-3 flex flex-col gap-2">
                  {draft.schedule.map((day) => {
                    const dayLabel = getDayLabel(day.key);
                    return (
                      <li
                        key={day.key}
                        className="flex items-center justify-between gap-3 text-[13px]"
                        data-testid={`business-weekly-schedule-${day.key}`}
                      >
                        <span className="font-semibold text-[var(--text-secondary)]">
                          {dayLabel}
                        </span>
                        <span
                          className="font-semibold text-[var(--text-primary)]"
                          data-testid={`business-weekly-schedule-value-${day.key}`}
                        >
                          {day.isOpen
                            ? `${day.openTime} — ${day.closeTime}`
                            : t("businessModal.closed")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p
                  className="mt-4 border-t border-[var(--border-default)] pt-3 text-[13px] font-semibold text-[var(--text-secondary)]"
                  data-testid="business-weekly-hours"
                >
                  {t("businessModal.weeklyHours", { hours: weeklyHours })}
                </p>
              </aside>
            </div>
          </section>

          <section className="rounded-[18px] bg-[var(--bg-surface)] px-[18px] py-[16px] shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
            <p className={labelClass}>Отзывы клиентов</p>
            <div className="mt-[8px] flex items-center gap-[10px]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#FFC107" aria-hidden>
                <path d="M12 2l2.95 6.26 6.55.83-4.83 4.62 1.26 6.49L12 17.98 6.07 20.2l1.26-6.49L2.5 9.09l6.55-.83L12 2z" />
              </svg>
              <span className="text-[28px] font-bold leading-none">4,6</span>
            </div>
            <p className="mt-[10px] text-[13px] text-[var(--text-muted)]">
              324 отзывов
            </p>
          </section>

          <div className="mt-[4px] flex flex-col gap-[12px]">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce] disabled:opacity-60"
              data-testid="business-save-button"
            >
              {saving ? t("businessModal.saving") : t("businessModal.saveChanges")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full rounded-[14px] border border-[#e02424] py-[15px] text-[16px] font-semibold text-[#e02424] transition hover:bg-[#fde8e8]"
            >
              {t("businessModal.delete")}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
