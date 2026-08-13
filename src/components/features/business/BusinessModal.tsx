"use client";

import Button from "@/components/shared/Button";
import { assets } from "@/lib/assets";
import {
  calcWeeklyHours,
  resetDaySchedule,
  TIME_OPTIONS,
  type DaySchedule,
} from "@/lib/business/schedule";
import { BUSINESS_CATEGORIES, useBusinessStore } from "@/store/business.store";
import { ApiError } from "@/lib/api/client";
import { GeocodingError } from "@/lib/geocoding";
import {
  BUSINESS_CATEGORY_KEYS,
  SCHEDULE_DAY_KEYS,
  translateErrorMessage,
  translateLabel,
} from "@/lib/i18n/labels";
import { useTranslation } from "@/lib/i18n/useTranslation";
import AddressAutocomplete from "./AddressAutocomplete";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import s from "./businessModal.module.css";

const MAX_DESCRIPTION_WORDS = 180;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const REVIEW_DISTRIBUTION = [
  { stars: 5, percent: 80 },
  { stars: 4, percent: 25 },
  { stars: 3, percent: 0 },
  { stars: 2, percent: 0 },
  { stars: 1, percent: 0 },
];

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

async function readImageFile(
  file: File,
  onError: (message: string) => void,
): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    onError("businessErrors.imageType");
    return null;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    onError("businessErrors.imageSize");
    return null;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 4h6l2 3h4a2 2 0 012 2v9a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2h4l2-3z"
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* ручка */}
      <rect
        x="7.68"
        y="2.83"
        width="8.36"
        height="1.98"
        rx="0.99"
        fill="#766261"
      />

      {/* крышка */}
      <rect
        x="4.2"
        y="5.1"
        width="15.6"
        height="2.64"
        rx="1.32"
        fill="#766261"
      />

      {/* корпус */}
      <path
        d="
          M5.62 8.9
          H18.38
          C18.71 8.9 18.97 9.18 18.94 9.51
          L17.99 19.44
          C17.87 20.75 16.77 21.73 15.46 21.73
          H8.54
          C7.23 21.73 6.13 20.75 6.01 19.44
          L5.06 9.51
          C5.03 9.18 5.29 8.9 5.62 8.9
          Z
        "
        fill="#766261"
      />

      {/* сглаживание нижних углов корпуса */}
      <path
        d="M6.5 18.5c0 1.1.9 2 2 2h7c1.1 0 2-.9 2-2"
        stroke="none"
        fill="none"
      />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="#0a6af7"
        strokeWidth="2"
      />
      <circle cx="9" cy="10" r="2" fill="#0a6af7" />
      <path d="M21 15l-5-5-4 4-2-2-5 5" stroke="#0a6af7" strokeWidth="2" />
    </svg>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[28px] w-[52px] shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#0a6af7]" : "bg-[#d0d0d8]"
      }`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all ${
          checked ? "left-[27px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  padding = "p-[28px]",
  headerMargin = "mb-[28px]",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  padding?: string;
  headerMargin?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-[24px] border border-[#ececf2] bg-white ${padding} ${className ?? ""}`}
    >
      <div
        className={`flex items-start justify-between gap-[16px] ${headerMargin}`}
      >
        <div>
          <h3 className="text-[24px] font-semibold">{title}</h3>
          {subtitle && (
            <p className="mt-[6px] w-[194px] h-[38px] text-[16px] font-semibold opacity-60">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const inputClass =
  "w-full rounded-[14px] bg-[#f4f4f8] px-[18px] py-[14px] text-[16px] outline-none focus:ring-2 focus:ring-[#0a6af7]/30";

export default function BusinessModal({ onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const draft = useBusinessStore((s) => s.draft);
  const updateDraft = useBusinessStore((s) => s.updateDraft);
  const setDraftSchedule = useBusinessStore((s) => s.setDraftSchedule);
  const resetDraft = useBusinessStore((s) => s.resetDraft);
  const saveDraft = useBusinessStore((s) => s.saveDraft);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const wordCount = countWords(draft.description);
  const weeklyHours = useMemo(
    () => Math.round(calcWeeklyHours(draft.schedule)),
    [draft.schedule],
  );

  function alertError(key: string) {
    alert(t(key));
  }

  async function handleProfileUpload(file: File) {
    const url = await readImageFile(file, alertError);
    if (url) updateDraft({ profilePhoto: url });
  }

  async function handleGalleryUpload(index: number, file: File) {
    const url = await readImageFile(file, alertError);
    if (!url) return;
    const gallery = [...draft.gallery];
    gallery[index] = url;
    updateDraft({ gallery });
  }

  function updateScheduleDay(index: number, patch: Partial<DaySchedule>) {
    const schedule = draft.schedule.map((day, i) => {
      if (i !== index) return day;
      const next = { ...day, ...patch };
      if (patch.isOpen === false) {
        return { ...next, openTime: "00:00", closeTime: "00:00" };
      }
      if (patch.isOpen === true && !day.isOpen) {
        return { ...next, openTime: "09:00", closeTime: "20:00" };
      }
      return next;
    });
    setDraftSchedule(schedule);
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      alertError("businessErrors.nameRequired");
      return;
    }
    if (!draft.category) {
      alertError("businessErrors.categoryRequired");
      return;
    }
    if (!draft.phone.trim()) {
      alertError("businessErrors.phoneRequired");
      return;
    }
    if (!draft.address.trim()) {
      alertError("businessErrors.addressRequired");
      return;
    }
    if (draft.lat == null || draft.lng == null) {
      alertError("businessErrors.addressSelectFromSuggestions");
      return;
    }
    if (!draft.description.trim()) {
      alertError("businessErrors.descriptionRequired");
      return;
    }
    if (!draft.profilePhoto) {
      alertError("businessErrors.profilePhotoRequired");
      return;
    }
    if (!draft.gallery.some(Boolean)) {
      alertError("businessErrors.galleryRequired");
      return;
    }

    setSaving(true);
    try {
      await saveDraft();
      onSaved();
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof GeocodingError
          ? translateErrorMessage(t, error.message)
          : t("businessErrors.saveFailed");
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (confirm(t("businessModal.deleteConfirm"))) {
      resetDraft();
      onClose();
    }
  }

  function dayLabel(key: string) {
    const keys = SCHEDULE_DAY_KEYS[key];
    return keys ? t(keys.label) : key;
  }

  function dayShortLabel(key: string) {
    const keys = SCHEDULE_DAY_KEYS[key];
    return keys ? t(keys.short) : key;
  }

  function renderGallerySlot(index: number, className: string) {
    const image = draft.gallery[index];
    return (
      <div key={index} className={className}>
        <input
          ref={(el) => {
            galleryInputRefs.current[index] = el;
          }}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleGalleryUpload(index, file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => galleryInputRefs.current[index]?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[16px] bg-[#f4f4f8] transition hover:bg-[#ececf2]"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <PhotoIcon />
              <span className="text-[15px] font-semibold text-[#0a6af7]">
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
    <div className={s.backdrop}>
      <div className={s.panel}>
        <SectionCard
          title={t("businessModal.profilePhotoTitle")}
          subtitle={t("businessModal.profilePhotoSubtitle")}
          action={
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] border border-[#e0e0e8] px-[18px] py-[10px] text-[15px] font-semibold hover:bg-[#f4f4f8]"
            >
              {t("businessModal.back")}
            </button>
          }
        >
          <div className="flex flex-wrap items-center gap-[32px]">
            <div className="relative">
              <div className="flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-full bg-[#f4f4f8]">
                {draft.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.profilePhoto}
                    alt={t("businessModal.profileAlt")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={assets.header.profileIcon}
                    alt=""
                    width={64}
                    height={64}
                    className="opacity-40"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                className="absolute bottom-[4px] right-[4px] flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#0a6af7]"
                aria-label={t("businessModal.uploadProfilePhotoAria")}
              >
                <CameraIcon />
              </button>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleProfileUpload(file);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="flex flex-col gap-[14px]">
              <p className="text-[14px] opacity-60">
                {t("businessModal.photoRequirements")}
              </p>
              <button
                type="button"
                disabled={!draft.profilePhoto}
                onClick={() => updateDraft({ profilePhoto: null })}
                className="flex w-fit items-center gap-[8px] text-[15px] font-semibold text-[#e53935] disabled:opacity-40"
              >
                <TrashIcon />
                {t("businessModal.deletePhoto")}
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("businessModal.infoTitle")}>
          <div className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">
                Название бизнеса
              </span>
              <input
                className={inputClass}
                value={draft.name}
                placeholder="Beauty Studio"
                onChange={(e) => updateDraft({ name: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">
                Короткое описание
              </span>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={draft.description}
                placeholder={t("businessModal.descriptionPlaceholder")}
                onChange={(e) => {
                  const words = countWords(e.target.value);
                  if (words <= MAX_DESCRIPTION_WORDS) {
                    updateDraft({ description: e.target.value });
                  }
                }}
              />
              <span className="text-[14px] opacity-60">
                {t("businessModal.wordCount", {
                  count: wordCount,
                  max: MAX_DESCRIPTION_WORDS,
                })}
              </span>
            </label>

            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
              <label className="flex flex-col gap-[8px]">
                <span className="text-[15px] font-semibold">
                  Категория бизнеса
                </span>
                <select
                  className={inputClass}
                  value={draft.category}
                  onChange={(e) => updateDraft({ category: e.target.value })}
                >
                  <option value="">{t("businessModal.required")}</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {translateLabel(t, cat, BUSINESS_CATEGORY_KEYS)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-[8px]">
                <span className="text-[15px] font-semibold">
                  {t("businessModal.websiteLabel")}
                </span>
                <input
                  className={inputClass}
                  value={draft.website}
                  placeholder={t("businessModal.optional")}
                  onChange={(e) => updateDraft({ website: e.target.value })}
                />
              </label>

              <label className="flex flex-col gap-[8px]">
                <span className="text-[15px] font-semibold">
                  Контактный номер
                </span>
                <input
                  className={inputClass}
                  value={draft.phone}
                  placeholder={t("businessModal.required")}
                  onChange={(e) => updateDraft({ phone: e.target.value })}
                />
              </label>

              <label className="flex flex-col gap-[8px]">
                <span className="text-[15px] font-semibold">
                  {t("businessModal.addressLabel")}
                </span>
                <AddressAutocomplete
                  value={draft.address}
                  coordsSelected={draft.lat != null && draft.lng != null}
                  inputClassName={inputClass}
                  placeholder={t("businessModal.addressPlaceholder")}
                  onChange={({ address, lat, lng }) =>
                    updateDraft({ address, lat, lng })
                  }
                />
                <span className="text-[13px] opacity-60">
                  Выберите адрес из подсказок — бизнес появится на карте в этой
                  точке
                </span>
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={t("businessModal.galleryTitle")}
          subtitle={t("businessModal.gallerySubtitle")}
        >
          <div className="grid min-h-[280px] grid-cols-3 gap-[12px]">
            {renderGallerySlot(0, "row-span-2")}
            <div className="row-span-2 grid grid-cols-2 grid-rows-2 gap-[12px]">
              {renderGallerySlot(1, "min-h-0")}
              {renderGallerySlot(2, "min-h-0")}
              {renderGallerySlot(3, "min-h-0")}
              {renderGallerySlot(4, "min-h-0")}
            </div>
            {renderGallerySlot(5, "row-span-2")}
          </div>
        </SectionCard>

        <SectionCard title="График работы" subtitle="Точное время и дни работы">
          <div className="flex flex-col gap-[24px] lg:flex-row">
            <div className="flex flex-1 flex-col gap-[20px] mb-[2px]">
              {draft.schedule.map((day, index) => (
                <div
                  key={day.key}
                  className="flex flex-wrap items-center gap-[16px] rounded-[16px] bg-[#f4f4f8] p-[24px_17px_24px_26px]"
                >
                  <span className="flex h-[24px] w-[141px] shrink-0 items-center text-[20px] font-semibold">
                    {day.label}
                  </span>
                  <Toggle
                    checked={day.isOpen}
                    onChange={(isOpen) => updateScheduleDay(index, { isOpen })}
                  />
                  <span
                    className={`text-[16px] ml-[13px] mr-[3px] font-semibold ${
                      day.isOpen ? "text-[#5a6a5a]" : "text-[#FF6666]"
                    }`}
                  >
                    {day.isOpen
                      ? t("businessModal.open")
                      : t("businessModal.closed")}
                  </span>
                  <div className="relative w-[96px] h-[44px]">
                    <select
                      className={`h-full w-full appearance-none rounded-[10px] bg-white text-[16px] text-center pl-[16px] pr-[28px] border border-transparent outline-none focus:border-gray-300 ${
                        !day.isOpen ? "opacity-40" : ""
                      }`}
                      value={day.openTime}
                      disabled={!day.isOpen}
                      onChange={(e) =>
                        updateScheduleDay(index, { openTime: e.target.value })
                      }
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2.5 4.5L6 8L9.5 4.5"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="opacity-100">—</span>
                  <div className="relative w-[96px] h-[44px]">
                    <select
                      className={`h-full w-full appearance-none rounded-[10px] bg-white text-[16px] text-center pl-[16px] pr-[28px] border border-transparent outline-none focus:border-gray-300 ${
                        !day.isOpen ? "opacity-40" : ""
                      }`}
                      value={day.closeTime}
                      disabled={!day.isOpen}
                      onChange={(e) =>
                        updateScheduleDay(index, { closeTime: e.target.value })
                      }
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-[8px] top-1/2 -translate-y-1/2 w-[12px] h-[12px]"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2.5 4.5L6 8L9.5 4.5"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <button
                    type="button"
                    className="ml-auto rounded-[8px] py-[10px] px-[12px] bg-white opacity-100 w-[48px] h-[44px]"
                    aria-label={`Сбросить ${day.label}`}
                    onClick={() => {
                      const schedule = draft.schedule.map((d, i) =>
                        i === index ? resetDaySchedule(d) : d,
                      );
                      setDraftSchedule(schedule);
                    }}
                  >
                    <TrashIcon className="w-[24px] h-[24px]" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mr-[10px]">
              <div className="w-full shrink-0 rounded-[20px] bg-[#f0f4fa] p-[17px_38px_22px_26px] lg:w-[322px]">
                <h4 className="mb-[20px] text-[17px] font-semibold text-center font-urbanist">
                  Недельный график
                </h4>
                <div className="h-px w-[calc(100%+66px)] bg-white -ml-[26px] mb-[28px]" />
                <ul className="flex flex-col gap-[26px]">
                  {draft.schedule.map((day) => (
                    <li
                      key={day.key}
                      className="flex  justify-between text-[16px] font-semibold"
                    >
                      <span className="text-[20px]">{day.shortLabel}</span>
                      {day.isOpen ? (
                        <span className="w-[112px] mt-[5px] text-[16px] semibold text-[#000000]">
                          {day.openTime} – {day.closeTime}
                        </span>
                      ) : (
                        <span className="text-[#e53935] mr-[44px]">
                          Закрыто
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-[9px] flex items-center gap-[22px] rounded-[14px] border border-[#0a6af7]/30 bg-white/60 p-[26px_36px_26px_28px]">
                <Image
                  src={assets.popular.timeIcon}
                  alt=""
                  width={48}
                  height={48}
                />
                <p className="text-[16px] w-[186px] h-[38px] mb-[10px] font-semibold leading-snug text-[#0a6af7]">
                  Ваш бизнес работает {weeklyHours} часа в неделю
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Отзывы"
          padding="p-[14px_66px_28px_18px]"
          headerMargin="mb-[15px]"
        >
          <div className="flex flex-col items-start gap-[10px]">
            <div>
              <p className="text-[32px] font-bold leading-none">4,6</p>
              <p className="mt-[6px] text-[16px] opacity-60">(102 отзыва)</p>
            </div>
            <div className="flex w-full flex-col gap-[8px]">
              {REVIEW_DISTRIBUTION.map(({ stars, percent }) => (
                <div
                  key={stars}
                  className="flex w-full items-center gap-[10px]"
                >
                  <span className="w-[12px] text-[15px] font-semibold">
                    {stars}
                  </span>
                  <Image
                    src={assets.popular.starRating}
                    alt=""
                    width={21}
                    height={21}
                  />
                  <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#ececf2]">
                    <div
                      className="h-full rounded-full bg-[#f5b800]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="flex gap-[34px] pb-[40px] mt-[28px]">
  <button
    type="button"
    onClick={handleDelete}
    className="flex-1 h-[56px] rounded-[14px] border border-[#e0e0e8] bg-white text-[20px] font-semibold hover:bg-[#f4f4f8]"
  >
    Удалить
  </button>
  <Button
    text={saving ? "Сохранение..." : "Сохранить изменение"}
    onClick={handleSave}
    paddingTop="pt-0"
    paddingBottom="pb-0"
    paddingLeft="pl-0"
    paddingRight="pr-0"
    className="flex-1 h-[56px] flex items-center justify-center text-center text-[20px]"
  />
</div>
      </div>
    </div>,
    document.body,
  );
}
