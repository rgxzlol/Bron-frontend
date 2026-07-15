"use client";

import Button from "@/components/shared/Button";
import { assets } from "@/lib/assets";
import {
  calcWeeklyHours,
  resetDaySchedule,
  TIME_OPTIONS,
  type DaySchedule,
} from "@/lib/business/schedule";
import {
  BUSINESS_CATEGORIES,
  useBusinessStore,
} from "@/store/business.store";
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

function PhotoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0a6af7" strokeWidth="2" />
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
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#ececf2] bg-white p-[28px]">
      <div className="mb-[24px] flex items-start justify-between gap-[16px]">
        <div>
          <h3 className="text-[22px] font-semibold">{title}</h3>
          {subtitle && (
            <p className="mt-[6px] text-[15px] opacity-60">{subtitle}</p>
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
                {t("businessModal.nameLabel")}
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
                {t("businessModal.descriptionLabel")}
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
                  {t("businessModal.categoryLabel")}
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
                  {t("businessModal.phoneLabel")}
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
                  {t("businessModal.addressHint")}
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

        <SectionCard
          title={t("businessModal.scheduleTitle")}
          subtitle={t("businessModal.scheduleSubtitle")}
        >
          <div className="flex flex-col gap-[24px] lg:flex-row">
            <div className="flex flex-1 flex-col gap-[10px]">
              {draft.schedule.map((day, index) => (
                <div
                  key={day.key}
                  className="flex flex-wrap items-center gap-[12px] rounded-[16px] bg-[#f4f4f8] px-[16px] py-[12px]"
                >
                  <span className="min-w-[120px] text-[15px] font-semibold">
                    {dayLabel(day.key)}
                  </span>
                  <Toggle
                    checked={day.isOpen}
                    onChange={(isOpen) => updateScheduleDay(index, { isOpen })}
                  />
                  <span
                    className={`text-[14px] font-semibold ${
                      day.isOpen ? "text-[#5a6a5a]" : "text-[#e53935]"
                    }`}
                  >
                    {day.isOpen
                      ? t("businessModal.open")
                      : t("businessModal.closed")}
                  </span>
                  <select
                    className={`rounded-[10px] bg-white px-[10px] py-[6px] text-[14px] ${
                      !day.isOpen ? "opacity-40" : ""
                    }`}
                    value={day.openTime}
                    disabled={!day.isOpen}
                    onChange={(e) =>
                      updateScheduleDay(index, { openTime: e.target.value })
                    }
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <span className="opacity-50">—</span>
                  <select
                    className={`rounded-[10px] bg-white px-[10px] py-[6px] text-[14px] ${
                      !day.isOpen ? "opacity-40" : ""
                    }`}
                    value={day.closeTime}
                    disabled={!day.isOpen}
                    onChange={(e) =>
                      updateScheduleDay(index, { closeTime: e.target.value })
                    }
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ml-auto rounded-[8px] p-[6px] opacity-50 hover:bg-white hover:opacity-100"
                    aria-label={t("businessModal.resetDayAria", {
                      day: dayLabel(day.key),
                    })}
                    onClick={() => {
                      const schedule = draft.schedule.map((d, i) =>
                        i === index ? resetDaySchedule(d) : d,
                      );
                      setDraftSchedule(schedule);
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>

            <div className="w-full shrink-0 rounded-[20px] bg-[#f0f4fa] p-[22px] lg:w-[280px]">
              <h4 className="mb-[16px] text-[17px] font-semibold">
                {t("businessModal.weeklySchedule")}
              </h4>
              <ul className="flex flex-col gap-[8px]">
                {draft.schedule.map((day) => (
                  <li
                    key={day.key}
                    className="flex justify-between text-[15px] font-semibold"
                  >
                    <span>{dayShortLabel(day.key)}</span>
                    {day.isOpen ? (
                      <span>
                        {day.openTime} – {day.closeTime}
                      </span>
                    ) : (
                      <span className="text-[#e53935]">
                        {t("businessModal.closed")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-[20px] flex items-center gap-[12px] rounded-[14px] border border-[#0a6af7]/30 bg-white/60 px-[14px] py-[12px]">
                <Image src={assets.popular.timeIcon} alt="" width={22} height={22} />
                <p className="text-[14px] font-semibold leading-snug text-[#0a6af7]">
                  {t("businessModal.weeklyHours", { hours: weeklyHours })}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("businessModal.reviewsTitle")}>
          <div className="flex flex-wrap items-center gap-[40px]">
            <div>
              <p className="text-[48px] font-bold leading-none">4,6</p>
              <p className="mt-[6px] text-[15px] opacity-60">
                {t("businessModal.reviewsCount")}
              </p>
            </div>
            <div className="flex flex-col gap-[8px]">
              {REVIEW_DISTRIBUTION.map(({ stars, percent }) => (
                <div key={stars} className="flex items-center gap-[10px]">
                  <span className="w-[12px] text-[15px] font-semibold">{stars}</span>
                  <Image src={assets.popular.starRating} alt="" width={16} height={16} />
                  <div className="h-[8px] w-[200px] overflow-hidden rounded-full bg-[#ececf2]">
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

        <div className="flex gap-[16px] pb-[40px]">
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 rounded-[14px] border border-[#e0e0e8] bg-white py-[16px] text-[18px] font-semibold hover:bg-[#f4f4f8]"
          >
            {t("businessModal.delete")}
          </button>
          <Button
            text={
              saving
                ? t("businessModal.saving")
                : t("businessModal.saveChanges")
            }
            onClick={handleSave}
            className="flex-1 !w-full text-center text-[18px] !px-[20px]"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
