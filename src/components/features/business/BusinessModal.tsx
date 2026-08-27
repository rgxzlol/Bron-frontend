"use client";

import {
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
import AddressAutocomplete from "./AddressAutocomplete";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToastStore } from "@/store/toast.store";
import s from "./businessModal.module.css";

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

async function readImageFile(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    alert("Загрузите JPG или PNG");
    return null;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    alert("Размер файла не должен превышать 2MB");
    return null;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

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
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <span className="relative inline-flex">
      <select
        aria-label={ariaLabel}
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

const labelClass = "text-[13px] font-semibold";

export default function BusinessModal({ onClose, onSaved }: Props) {
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

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleProfileUpload(file: File) {
    const url = await readImageFile(file);
    if (url) updateDraft({ profilePhoto: url });
  }

  async function handleGalleryUpload(index: number, file: File) {
    const url = await readImageFile(file);
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
        return { ...next, openTime: "09:00", closeTime: "22:00" };
      }
      return next;
    });
    setDraftSchedule(schedule);
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      alert("Укажите название бизнеса");
      return;
    }
    if (!draft.category) {
      alert("Выберите категорию бизнеса");
      return;
    }
    if (!draft.phone.trim()) {
      alert("Укажите контактный номер");
      return;
    }
    if (!draft.address.trim()) {
      alert("Укажите адрес бизнеса");
      return;
    }
    if (draft.lat == null || draft.lng == null) {
      alert("Выберите адрес из списка подсказок");
      return;
    }
    if (!draft.description.trim()) {
      alert("Укажите описание бизнеса");
      return;
    }
    if (!draft.profilePhoto) {
      alert("Загрузите аватар бизнеса");
      return;
    }
    if (!draft.gallery.some(Boolean)) {
      alert("Загрузите хотя бы одно дополнительное фото");
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
          : "Не удалось сохранить бизнес";
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
          className="flex h-full w-full flex-col items-center justify-center gap-[8px] overflow-hidden rounded-[14px] border-2 border-[#0a6af7] bg-[var(--bg-surface)] transition hover:bg-[#f0f4ff]"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <PhotoIcon />
              <span className="text-[13px] font-semibold text-[#0a6af7] underline">
                Загрузить фото
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
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-[18px] pb-[28px]">
          <div className="relative flex items-center justify-center py-[8px]">
            <button
              type="button"
              onClick={onClose}
              className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-surface-muted)] transition hover:opacity-80"
              aria-label="Назад"
            >
              <ChevronLeftIcon />
            </button>
            <h2 className="text-[18px] font-bold">Профиль бизнеса</h2>
          </div>

          <section className="flex flex-col items-center rounded-[18px] bg-[var(--bg-surface)] px-[16px] py-[26px] shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
            <div className="relative">
              <div className="flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-full text-[var(--text-primary)]">
                {draft.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.profilePhoto}
                    alt="Фото профиля"
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
                aria-label="Загрузить фото профиля"
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

            <h3 className="mt-[14px] text-[18px] font-bold">Фото профиля</h3>
            <p className="mt-[4px] text-[13px] text-[var(--text-muted)]">
              Добавь фото для вашего бизнеса
            </p>

            <div className="mt-[18px] grid w-full grid-cols-2 gap-[12px]">
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                className="rounded-[10px] border border-[#0a6af7] py-[12px] text-[14px] font-semibold text-[#0a6af7] transition hover:bg-[#f0f4ff]"
              >
                Загрузить фото
              </button>
              <button
                type="button"
                disabled={!draft.profilePhoto}
                onClick={() => updateDraft({ profilePhoto: null })}
                className="rounded-[10px] border border-[#e02424] py-[12px] text-[14px] font-semibold text-[#e02424] transition hover:bg-[#fde8e8] disabled:opacity-40"
              >
                Удалить фото
              </button>
            </div>
          </section>

          <section className="flex flex-col gap-[14px]">
            <h3 className="text-[17px] font-bold">Информация о бизнесе</h3>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>Название бизнеса</span>
              <input
                className={inputClass}
                value={draft.name}
                placeholder="Введите название"
                onChange={(e) => updateDraft({ name: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>Категория бизнеса</span>
              <span className="relative">
                <select
                  className={`${inputClass} appearance-none pr-[42px] ${
                    draft.category ? "" : "text-[var(--text-secondary)]"
                  }`}
                  value={draft.category}
                  onChange={(e) => updateDraft({ category: e.target.value })}
                >
                  <option value="">Обязательно</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <SelectChevron className="pointer-events-none absolute right-[18px] top-1/2 -translate-y-1/2" />
              </span>
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>Короткое описание</span>
              <span className="rounded-[12px] border border-black/5 bg-[var(--bg-surface)] px-[16px] py-[12px] shadow-[0_1px_5px_rgba(15,23,42,0.05)] focus-within:ring-2 focus-within:ring-[#0a6af7]/30">
                <textarea
                  className="min-h-[56px] w-full resize-y bg-transparent text-[15px] outline-none placeholder:text-[var(--text-muted)]"
                  value={draft.description}
                  placeholder="Написать..."
                  onChange={(e) =>
                    updateDraft({
                      description: e.target.value.slice(0, MAX_DESCRIPTION_LENGTH),
                    })
                  }
                />
                <span className="block text-right text-[12px] text-[var(--text-muted)]">
                  {draft.description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </span>
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>Адрес</span>
              <AddressAutocomplete
                value={draft.address}
                coordsSelected={draft.lat != null && draft.lng != null}
                inputClassName={inputClass}
                placeholder="Мирзо Улугбекский район"
                onChange={({ address, lat, lng }) =>
                  updateDraft({ address, lat, lng })
                }
              />
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className={labelClass}>Контактный номер</span>
              <input
                className={inputClass}
                value={draft.phone}
                placeholder="+998 99 000 00 00"
                onChange={(e) => updateDraft({ phone: e.target.value })}
              />
            </label>
          </section>

          <section className="flex flex-col gap-[10px]">
            <h3 className={labelClass}>Галерея бизнеса</h3>
            <div className="grid grid-cols-2 grid-rows-2 gap-[12px]">
              {renderGallerySlot(0, "row-span-2 min-h-[190px]")}
              {renderGallerySlot(1, "min-h-[88px]")}
              {renderGallerySlot(2, "min-h-[88px]")}
            </div>
          </section>

          <section className="flex flex-col gap-[10px]">
            <h3 className={labelClass}>График работы</h3>
            <div className="flex flex-col gap-[6px] rounded-[18px] bg-[var(--bg-surface)] p-[12px] shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
              {draft.schedule.map((day, index) => (
                <div
                  key={day.key}
                  className="flex items-center gap-[8px] rounded-[12px] px-[6px] py-[10px]"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                    {day.label}
                  </span>

                  {day.isOpen ? (
                    <span className="flex items-center gap-[6px]">
                      <TimeSelect
                        value={day.openTime}
                        ariaLabel={`${day.label}: открытие`}
                        onChange={(openTime) =>
                          updateScheduleDay(index, { openTime })
                        }
                      />
                      <span className="text-[13px] opacity-50">—</span>
                      <TimeSelect
                        value={day.closeTime}
                        ariaLabel={`${day.label}: закрытие`}
                        onChange={(closeTime) =>
                          updateScheduleDay(index, { closeTime })
                        }
                      />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateScheduleDay(index, { isOpen: true })}
                      className="rounded-[8px] bg-[#fde8e8] px-[14px] py-[8px] text-[13px] font-semibold text-[#e02424] transition hover:opacity-80"
                    >
                      Закрыто
                    </button>
                  )}

                  <button
                    type="button"
                    className="ml-[4px] p-[4px] text-[var(--text-secondary)] transition hover:text-[#e02424]"
                    aria-label={`Сбросить ${day.label}`}
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
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-[14px] bg-[#0a6af7] py-4 text-[16px] font-semibold text-white transition hover:bg-[#0858ce] disabled:opacity-60"
            >
              {saving ? "Сохранение..." : "Сохранить изменения"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full rounded-[14px] border border-[#e02424] py-[15px] text-[16px] font-semibold text-[#e02424] transition hover:bg-[#fde8e8]"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
