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
import { translateBusinessCategory } from "@/lib/i18n/labels";
import AddressAutocomplete from "./AddressAutocomplete";
import DeleteBusinessModal from "./DeleteBusinessModal";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToastStore } from "@/store/toast.store";
import s from "./businessModal.module.css";
import desktop from "./businessDesktop.module.css";

const GALLERY_SLOT_COUNT = 6;
const MOBILE_GALLERY_SLOT_COUNT = 3;
const DAY_I18N_KEYS: Record<DayKey, string> = {
  mon: "businessModal.dayMon",
  tue: "businessModal.dayTue",
  wed: "businessModal.dayWed",
  thu: "businessModal.dayThu",
  fri: "businessModal.dayFri",
  sat: "businessModal.daySat",
  sun: "businessModal.daySun",
};

const DAY_SHORT_I18N_KEYS: Record<DayKey, string> = {
  mon: "businessModal.dayMonShort",
  tue: "businessModal.dayTueShort",
  wed: "businessModal.dayWedShort",
  thu: "businessModal.dayThuShort",
  fri: "businessModal.dayFriShort",
  sat: "businessModal.daySatShort",
  sun: "businessModal.daySunShort",
};

const REVIEW_DISTRIBUTION = [
  { stars: 5, percent: 72 },
  { stars: 4, percent: 18 },
  { stars: 3, percent: 6 },
  { stars: 2, percent: 3 },
  { stars: 1, percent: 1 },
];

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

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="#0a6af7" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="#0a6af7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFC107" aria-hidden>
      <path d="M12 2l2.95 6.26 6.55.83-4.83 4.62 1.26 6.49L12 17.98 6.07 20.2l1.26-6.49L2.5 9.09l6.55-.83L12 2z" />
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
  variant = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  dataTestId?: string;
  variant?: "default" | "desktop";
}) {
  const selectClass =
    variant === "desktop"
      ? desktop.desktopTimeSelect
      : "appearance-none rounded-[8px] bg-[var(--bg-surface-muted)] py-[7px] pl-[8px] pr-[24px] text-[12px] font-semibold outline-none sm:py-[8px] sm:pl-[10px] sm:pr-[26px] sm:text-[13px]";

  return (
    <span className="relative inline-flex">
      <select
        aria-label={ariaLabel}
        data-testid={dataTestId}
        className={selectClass}
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
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-[left] duration-200 ease-in-out ${
          isOpen ? "left-[23px]" : "left-[3px]"
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
  const removeBusiness = useBusinessStore((s2) => s2.removeBusiness);
  const editingId = useBusinessStore((s2) => s2.editingId);
  const showToast = useToastStore((s2) => s2.showToast);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formErrors, setFormErrors] = useState<BusinessFormErrors>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const weeklyHours = useMemo(
    () => Math.round(calcWeeklyHours(draft.schedule) * 10) / 10,
    [draft.schedule],
  );

  function getDayLabel(key: DayKey) {
    return t(DAY_I18N_KEYS[key]);
  }

  function getDayShortLabel(key: DayKey) {
    return t(DAY_SHORT_I18N_KEYS[key]);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || isDesktop) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted, isDesktop]);

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

  function resetScheduleDay(index: number) {
    updateScheduleDay(index, { isOpen: false, openTime: "00:00", closeTime: "00:00" });
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
        showToast(t("businessModal.updatedToast"), t("businessModal.updatedToastDesc"));
      } else {
        showToast(
          t("businessModal.createdToast"),
          t("businessModal.createdToastDesc"),
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
    if (editingId) {
      setDeleteModalOpen(true);
      return;
    }
    if (confirm(t("businessModal.deleteConfirm"))) {
      resetDraft();
      onClose();
    }
  }

  async function handleConfirmDelete() {
    if (!editingId || isDeleting) return;
    setIsDeleting(true);
    try {
      await removeBusiness(editingId);
      setDeleteModalOpen(false);
      resetDraft();
      showToast(t("business.deleteSuccessTitle"), t("business.deleteSuccessDesc"));
      onSaved();
    } catch {
      alert(t("business.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }

  function renderGallerySlot(index: number, className: string) {
    const image = draft.gallery[index];
    const slotButtonClass = isDesktop
      ? desktop.gallerySlot
      : "relative flex h-full min-h-[100px] w-full flex-col items-center justify-center gap-[8px] overflow-hidden rounded-[14px] border-2 border-[#0a6af7] bg-[var(--bg-surface)] transition hover:bg-[#f0f4ff]";

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
          className={slotButtonClass}
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
              <span
                className={`relative z-[1] text-[13px] font-semibold text-[#0a6af7] ${
                  isDesktop ? "" : "underline"
                }`}
              >
                {t("businessModal.uploadPhoto")}
              </span>
            </>
          )}
        </button>
      </div>
    );
  }

  const sectionCardClass = isDesktop
    ? desktop.card
    : "rounded-[18px] bg-[var(--bg-surface)] px-[16px] py-[20px] shadow-[0_1px_6px_rgba(15,23,42,0.04)] lg:rounded-[24px] lg:px-[28px] lg:py-[28px]";

  const content = (
    <div
      className={
        isDesktop
          ? desktop.pageInner
          : "mx-auto flex w-full max-w-[640px] flex-col gap-[18px] pb-[28px]"
      }
    >
      {!isDesktop ? (
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
      ) : null}

      <section
        className={`${sectionCardClass} relative ${isDesktop ? "" : "flex flex-col items-center py-[26px]"}`}
        data-testid="business-profile-photo-section"
      >
        {isDesktop ? (
          <div className={desktop.cardHeaderRow}>
            <div>
              <h3 className={desktop.cardTitle}>{t("businessModal.profilePhotoTitle")}</h3>
              <p className={desktop.cardSubtitle}>
                {t("businessModal.profilePhotoSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={desktop.backButton}
              data-testid="business-modal-back"
            >
              {t("businessModal.back")}
            </button>
          </div>
        ) : null}

        <div
          className={
            isDesktop
              ? desktop.profileRow
              : "flex flex-col items-center"
          }
        >
          <div className={isDesktop ? desktop.profileAvatarWrap : "relative shrink-0"}>
            <div
              className={
                isDesktop
                  ? desktop.profileAvatar
                  : "flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-full bg-[var(--bg-surface-muted)] text-[var(--text-primary)]"
              }
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
              className={
                isDesktop
                  ? desktop.profileCamera
                  : "absolute -bottom-[2px] -right-[4px] flex h-[32px] w-[32px] items-center justify-center rounded-[10px] bg-[#0a6af7] transition hover:bg-[#0858ce]"
              }
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

          <div className={isDesktop ? desktop.profileMeta : "flex w-full flex-col items-center"}>
            {!isDesktop ? (
              <>
                <h3 className="mt-[14px] text-[18px] font-bold">
                  {t("businessModal.profilePhotoTitle")}
                </h3>
                <p className="mt-[4px] text-center text-[13px] text-[var(--text-muted)]">
                  {t("businessModal.profilePhotoSubtitle")}
                </p>
              </>
            ) : null}
            <p
              className={
                isDesktop
                  ? desktop.profileRequirements
                  : "mt-[6px] text-center text-[12px] text-[var(--text-muted)]"
              }
            >
              {t("businessModal.photoRequirements")}
            </p>

            {isDesktop ? (
              <button
                type="button"
                disabled={!draft.profilePhoto}
                onClick={handleDeleteProfilePhoto}
                className={desktop.deletePhotoButton}
                data-testid="business-profile-photo-delete"
              >
                <TrashIcon />
                {t("businessModal.deletePhoto")}
              </button>
            ) : (
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
            )}
            {submitAttempted && formErrors.profilePhoto ? (
              <p
                role="alert"
                className={`mt-[12px] text-[12px] font-semibold text-[#e02424] ${
                  isDesktop ? "" : "text-center"
                }`}
                data-testid="business-field-error-profilePhoto"
              >
                {formErrors.profilePhoto}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <form
        className="flex flex-col gap-[18px] lg:gap-[24px]"
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

        <section className={`${sectionCardClass} flex flex-col gap-[14px] ${isDesktop ? "gap-[18px]" : "lg:gap-[18px]"}`}>
          <h3 className={isDesktop ? desktop.cardTitle : "text-[17px] font-bold lg:text-[22px]"}>
            {t("businessModal.infoTitle")}
          </h3>

          <label className="flex flex-col gap-[8px]">
            <span className={isDesktop ? desktop.desktopLabel : labelClass}>
              {t("businessModal.nameLabel")}
            </span>
            <input
              className={
                isDesktop
                  ? `${desktop.desktopInput}${formErrors.name ? ` ${desktop.desktopInputError}` : ""}`
                  : fieldClass(!!formErrors.name)
              }
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
            <span className={isDesktop ? desktop.desktopLabel : labelClass}>
              {t("businessModal.descriptionLabel")}
            </span>
            <span
              className={
                isDesktop
                  ? `${desktop.desktopTextareaWrap}${formErrors.description ? ` ${desktop.desktopInputError}` : ""}`
                  : `rounded-[12px] border bg-[var(--bg-surface)] px-[16px] py-[12px] shadow-[0_1px_5px_rgba(15,23,42,0.05)] focus-within:ring-2 ${
                      formErrors.description
                        ? "border-[#e02424] focus-within:ring-[#e02424]/20"
                        : "border-black/5 focus-within:ring-[#0a6af7]/30"
                    }`
              }
            >
              <textarea
                className={
                  isDesktop
                    ? desktop.desktopTextarea
                    : "min-h-[56px] w-full resize-y bg-transparent text-[15px] outline-none placeholder:text-[var(--text-muted)] lg:min-h-[88px]"
                }
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
                className={
                  isDesktop
                    ? desktop.desktopTextareaCounter
                    : "block text-right text-[12px] text-[var(--text-muted)]"
                }
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

          <div className="grid gap-[14px] lg:grid-cols-2 lg:gap-[18px]">
            <label className="flex flex-col gap-[8px]">
              <span className={isDesktop ? desktop.desktopLabel : labelClass}>
                {t("businessModal.categoryLabel")}
              </span>
              <span className="relative">
                <select
                  className={
                    isDesktop
                      ? `${desktop.desktopInput} appearance-none pr-[42px]${formErrors.category ? ` ${desktop.desktopInputError}` : ""} ${
                          draft.category ? "" : "text-[var(--text-secondary)]"
                        }`
                      : `${fieldClass(!!formErrors.category)} appearance-none pr-[42px] ${
                          draft.category ? "" : "text-[var(--text-secondary)]"
                        }`
                  }
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
                      {translateBusinessCategory(t, cat)}
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
              <span className={isDesktop ? desktop.desktopLabel : labelClass}>
                {t("businessModal.websiteLabel")}
              </span>
              <input
                className={isDesktop ? desktop.desktopInput : fieldClass(false)}
                value={draft.website}
                placeholder={t("businessModal.optional")}
                data-testid="business-website-input"
                onChange={(e) => updateDraft({ website: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className={isDesktop ? desktop.desktopLabel : labelClass}>
                {t("businessModal.phoneLabel")}
              </span>
              <input
                className={
                  isDesktop
                    ? `${desktop.desktopInput}${formErrors.phone ? ` ${desktop.desktopInputError}` : ""}`
                    : fieldClass(!!formErrors.phone)
                }
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

            <label className="flex flex-col gap-[8px]">
              <span className={isDesktop ? desktop.desktopLabel : labelClass}>
                {t("businessModal.addressLabel")}
              </span>
              <AddressAutocomplete
                value={draft.address}
                coordsSelected={draft.lat != null && draft.lng != null}
                hasError={!!formErrors.address}
                errorMessage={formErrors.address}
                inputTestId="business-address-input"
                inputClassName={
                  isDesktop
                    ? `${desktop.desktopInput}${formErrors.address ? ` ${desktop.desktopInputError}` : ""}`
                    : fieldClass(!!formErrors.address)
                }
                placeholder={t("businessModal.addressPlaceholder")}
                onChange={({ address, lat, lng }) => {
                  updateDraft({ address, lat, lng });
                  clearFieldError("address");
                }}
              />
            </label>
          </div>
        </section>

        <section
          className={`${sectionCardClass} flex flex-col gap-[10px] ${isDesktop ? "gap-[16px]" : "lg:gap-[16px]"}`}
          data-testid="business-gallery-section"
        >
          <div>
            <h3 className={isDesktop ? desktop.cardTitle : "text-[17px] font-bold lg:text-[22px]"}>
              {t("businessModal.galleryTitle")}
            </h3>
            <p className={isDesktop ? desktop.cardSubtitle : "mt-1 text-[13px] text-[var(--text-muted)] lg:text-[14px]"}>
              {t("businessModal.gallerySubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-[12px] lg:hidden">
            {renderGallerySlot(0, "col-span-2 min-h-[140px]")}
            {Array.from({ length: MOBILE_GALLERY_SLOT_COUNT - 1 }, (_, offset) =>
              renderGallerySlot(offset + 1, "min-h-[88px]"),
            )}
          </div>
          <div className={`hidden lg:grid ${desktop.galleryGrid}`}>
            {renderGallerySlot(0, desktop.galleryLargeLeft)}
            {renderGallerySlot(1, "")}
            {renderGallerySlot(2, "")}
            {renderGallerySlot(5, desktop.galleryLargeRight)}
            {renderGallerySlot(3, "")}
            {renderGallerySlot(4, "")}
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
          className={`${sectionCardClass} flex flex-col gap-[10px] ${isDesktop ? "gap-[16px]" : "lg:gap-[16px]"}`}
          data-testid="business-schedule-section"
        >
          <div>
            <h3 className={isDesktop ? desktop.cardTitle : "text-[17px] font-bold lg:text-[22px]"}>
              {t("businessModal.scheduleTitle")}
            </h3>
            <p className={isDesktop ? desktop.cardSubtitle : "mt-1 text-[13px] text-[var(--text-muted)] lg:text-[14px]"}>
              {t("businessModal.scheduleSubtitle")}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div
              className={
                isDesktop
                  ? desktop.scheduleDayList
                  : "flex min-w-0 flex-col gap-[4px] rounded-[18px] bg-[var(--bg-surface-muted)] p-[10px] sm:gap-[6px] sm:p-[12px] lg:bg-transparent lg:p-0"
              }
            >
              {draft.schedule.map((day, index) => {
                const dayLabel = getDayLabel(day.key);
                return (
                  <div
                    key={day.key}
                    className={
                      isDesktop
                        ? desktop.scheduleDayCard
                        : `grid items-center gap-x-3 gap-y-2 rounded-[12px] px-[4px] py-[8px] sm:px-[6px] sm:py-[10px] grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[48px_minmax(88px,1fr)_auto]`
                    }
                    data-testid={`business-schedule-day-${day.key}`}
                    data-open={day.isOpen ? "true" : "false"}
                  >
                    {isDesktop ? (
                      <span className={desktop.scheduleDay}>{dayLabel}</span>
                    ) : (
                      <ScheduleToggle
                        isOpen={day.isOpen}
                        dayLabel={dayLabel}
                        dayKey={day.key}
                        onToggle={() =>
                          updateScheduleDay(index, { isOpen: !day.isOpen })
                        }
                      />
                    )}

                    {!isDesktop ? (
                      <span className="min-w-0 text-[13px] font-semibold leading-tight">
                        {dayLabel}
                      </span>
                    ) : null}

                    {isDesktop ? (
                      <ScheduleToggle
                        isOpen={day.isOpen}
                        dayLabel={dayLabel}
                        dayKey={day.key}
                        onToggle={() =>
                          updateScheduleDay(index, { isOpen: !day.isOpen })
                        }
                      />
                    ) : null}

                    {isDesktop ? (
                      <span
                        className={
                          day.isOpen ? desktop.scheduleStatusOpen : desktop.scheduleStatusClosed
                        }
                      >
                        {day.isOpen ? t("businessModal.open") : t("businessModal.closed")}
                      </span>
                    ) : null}

                    {day.isOpen ? (
                      <span
                        className={`flex items-center gap-[4px] sm:gap-[6px] ${
                          isDesktop
                            ? "justify-start"
                            : "col-span-2 justify-end pl-[60px] sm:col-span-1 sm:col-start-3 sm:pl-0"
                        }`}
                      >
                        <TimeSelect
                          value={day.openTime}
                          ariaLabel={`${dayLabel}: ${t("businessModal.open")}`}
                          dataTestId={`business-schedule-open-${day.key}`}
                          variant={isDesktop ? "desktop" : "default"}
                          onChange={(openTime) =>
                            updateScheduleDay(index, { openTime })
                          }
                        />
                        <span className="text-[13px] opacity-50">—</span>
                        <TimeSelect
                          value={day.closeTime}
                          ariaLabel={`${dayLabel}: ${t("businessModal.closeTime")}`}
                          dataTestId={`business-schedule-close-${day.key}`}
                          variant={isDesktop ? "desktop" : "default"}
                          onChange={(closeTime) =>
                            updateScheduleDay(index, { closeTime })
                          }
                        />
                      </span>
                    ) : (
                      <span
                        className={
                          isDesktop
                            ? "flex items-center gap-[6px]"
                            : "col-span-2 justify-self-end pl-[60px] sm:col-span-1 sm:col-start-3 sm:pl-0"
                        }
                      >
                        {!isDesktop ? (
                          <span
                            className="inline-flex rounded-[8px] bg-[#fde8e8] px-[12px] py-[7px] text-[12px] font-semibold text-[#e02424] sm:px-[14px] sm:py-[8px] sm:text-[13px]"
                            data-testid={`business-schedule-closed-${day.key}`}
                          >
                            {t("businessModal.closed")}
                          </span>
                        ) : (
                          <>
                            <span className="text-[13px] font-semibold text-[var(--text-muted)]">
                              00:00 — 00:00
                            </span>
                          </>
                        )}
                      </span>
                    )}

                    {isDesktop ? (
                      <button
                        type="button"
                        onClick={() => resetScheduleDay(index)}
                        className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-muted)]"
                        aria-label={t("businessModal.resetDayAria", { day: dayLabel })}
                      >
                        <TrashIcon />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <aside
              className={
                isDesktop
                  ? desktop.weeklyAside
                  : "rounded-[18px] bg-[var(--bg-surface-muted)] p-[14px] lg:bg-[var(--bg-surface)] lg:shadow-[0_1px_6px_rgba(15,23,42,0.04)]"
              }
              data-testid="business-weekly-schedule"
            >
              <h4 className="text-[14px] font-bold text-[var(--text-primary)] lg:text-[16px]">
                {t("businessModal.weeklySchedule")}
              </h4>
              <ul className="mt-3 flex flex-col gap-2">
                {draft.schedule.map((day) => {
                  const dayLabel = isDesktop ? getDayShortLabel(day.key) : getDayLabel(day.key);
                  return (
                    <li
                      key={day.key}
                      className="flex items-center justify-between gap-3 text-[13px] lg:text-[14px]"
                      data-testid={`business-weekly-schedule-${day.key}`}
                    >
                      <span className="font-semibold text-[var(--text-secondary)]">
                        {dayLabel}
                      </span>
                      <span
                        className={`font-semibold ${
                          day.isOpen ? "text-[var(--text-primary)]" : "text-[#e02424]"
                        }`}
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
              <div className={isDesktop ? desktop.weeklyHoursBox : "mt-4 rounded-[14px] border border-[#0a6af7]/20 bg-[#f0f4ff] px-[14px] py-[12px] lg:mt-5"}>
                {isDesktop ? <ClockIcon /> : null}
                <p
                  className={isDesktop ? desktop.weeklyHoursText : "text-[13px] font-semibold text-[#0a6af7] lg:text-[14px]"}
                  data-testid="business-weekly-hours"
                >
                  {t("businessModal.weeklyHours", { hours: weeklyHours })}
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className={sectionCardClass}>
          <p className={isDesktop ? desktop.cardTitle : `${labelClass} lg:text-[22px] lg:font-bold`}>
            {t("businessModal.reviewsTitle")}
          </p>
          <div className="mt-[12px] flex flex-col gap-[18px] lg:mt-[18px] lg:flex-row lg:items-center lg:gap-[40px]">
            <div className="shrink-0">
              <div className="flex items-center gap-[10px]">
                <StarIcon size={isDesktop ? 36 : 32} />
                <span className="text-[28px] font-bold leading-none lg:text-[42px]">4,6</span>
              </div>
              <p className="mt-[10px] text-[13px] text-[var(--text-muted)] lg:text-[15px]">
                {t("businessModal.reviewsCount")}
              </p>
            </div>
            <div className="hidden min-w-0 flex-1 flex-col gap-[8px] lg:flex">
              {REVIEW_DISTRIBUTION.map((row) => (
                <div key={row.stars} className={desktop.reviewBarRow}>
                  <span className={desktop.reviewBarLabel}>
                    {row.stars}
                    <StarIcon size={12} />
                  </span>
                  <div className={desktop.reviewBarTrack}>
                    <div
                      className={desktop.reviewBarFill}
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={isDesktop ? desktop.footerActions : "mt-[4px] flex flex-col gap-[12px]"}>
          <button
            type="button"
            onClick={handleDelete}
            className={
              isDesktop
                ? desktop.deleteButton
                : "w-full rounded-[14px] border border-[#e02424] py-[15px] text-[16px] font-semibold text-[#e02424] transition hover:bg-[#fde8e8]"
            }
          >
            {t("businessModal.delete")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className={
              isDesktop
                ? desktop.saveButton
                : "w-full rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce] disabled:opacity-60"
            }
            data-testid="business-save-button"
          >
            {saving ? t("businessModal.saving") : t("businessModal.saveChanges")}
          </button>
        </div>
      </form>
    </div>
  );

  if (!mounted) return null;

  if (isDesktop) {
    return (
      <div className={desktop.page} data-testid="business-config-page">
        {content}
        <DeleteBusinessModal
          businessName={draft.name || t("business.untitled")}
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    );
  }

  return createPortal(
    <>
      <div className={s.backdrop} data-testid="business-config-modal" data-editing={editingId ? "true" : "false"}>
        <div className={s.panel}>{content}</div>
      </div>
      <DeleteBusinessModal
        businessName={draft.name || t("business.untitled")}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>,
    document.body,
  );
}
