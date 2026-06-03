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
import Image from "next/image";
import { useMemo, useRef } from "react";

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
  const draft = useBusinessStore((s) => s.draft);
  const updateDraft = useBusinessStore((s) => s.updateDraft);
  const setDraftSchedule = useBusinessStore((s) => s.setDraftSchedule);
  const resetDraft = useBusinessStore((s) => s.resetDraft);
  const saveDraft = useBusinessStore((s) => s.saveDraft);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const wordCount = countWords(draft.description);
  const weeklyHours = useMemo(
    () => Math.round(calcWeeklyHours(draft.schedule)),
    [draft.schedule],
  );

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
        return { ...next, openTime: "09:00", closeTime: "20:00" };
      }
      return next;
    });
    setDraftSchedule(schedule);
  }

  function handleSave() {
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
    saveDraft();
    onSaved();
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
          className="flex h-full w-full flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[16px] bg-[#f4f4f8] transition hover:bg-[#ececf2]"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <PhotoIcon />
              <span className="text-[15px] font-semibold text-[#0a6af7]">
                Загрузить фото
              </span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center overflow-hidden bg-[#fafaff]/80 p-[20px]">
      <div className="mx-auto flex h-[90dvh] max-h-full w-full max-w-[1100px] flex-col gap-[20px] overflow-y-auto rounded-[24px] bg-[#fafaff] px-[16px] py-[20px]">
        <SectionCard
          title="Профиль фото"
          subtitle="Это фото будет презентовать ваш бизнес на платформе"
          action={
            <button
              type="button"
              onClick={onClose}
              className="rounded-[12px] border border-[#e0e0e8] px-[18px] py-[10px] text-[15px] font-semibold hover:bg-[#f4f4f8]"
            >
              Вернуться назад
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
                    alt="Профиль"
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

            <div className="flex flex-col gap-[14px]">
              <p className="text-[14px] opacity-60">
                Требования: размер 800x800px JPG, PNG, до 2MB
              </p>
              <button
                type="button"
                disabled={!draft.profilePhoto}
                onClick={() => updateDraft({ profilePhoto: null })}
                className="flex w-fit items-center gap-[8px] text-[15px] font-semibold text-[#e53935] disabled:opacity-40"
              >
                <TrashIcon />
                Удали фото
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Информация бизнеса">
          <div className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">Название бизнеса</span>
              <input
                className={inputClass}
                value={draft.name}
                placeholder="Beauty Studio"
                onChange={(e) => updateDraft({ name: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">Короткое описание</span>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                value={draft.description}
                placeholder="Написать..."
                onChange={(e) => {
                  const words = countWords(e.target.value);
                  if (words <= MAX_DESCRIPTION_WORDS) {
                    updateDraft({ description: e.target.value });
                  }
                }}
              />
              <span className="text-[14px] opacity-60">
                {wordCount}/{MAX_DESCRIPTION_WORDS} слов
              </span>
            </label>

            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
              <label className="flex flex-col gap-[8px]">
                <span className="text-[15px] font-semibold">Категория бизнеса</span>
                <select
                  className={inputClass}
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
              </label>

              <label className="flex flex-col gap-[8px]">
                <span className="text-[15px] font-semibold">Веб сайт</span>
                <input
                  className={inputClass}
                  value={draft.website}
                  placeholder="Необязательно"
                  onChange={(e) => updateDraft({ website: e.target.value })}
                />
              </label>

              <label className="flex flex-col gap-[8px]">
                <span className="text-[15px] font-semibold">Контактный номер</span>
                <input
                  className={inputClass}
                  value={draft.phone}
                  placeholder="Обязательно"
                  onChange={(e) => updateDraft({ phone: e.target.value })}
                />
              </label>

              <label className="flex flex-col gap-[8px]">
                <span className="text-[15px] font-semibold">Адрес бизнеса</span>
                <input
                  className={inputClass}
                  value={draft.address}
                  placeholder="Обязательно"
                  onChange={(e) => updateDraft({ address: e.target.value })}
                />
              </label>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Бизнес галерея"
          subtitle="Покажи свой уют и комфорт заведения"
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
          title="График работы"
          subtitle="Точное время и дни работы"
        >
          <div className="flex flex-col gap-[24px] lg:flex-row">
            <div className="flex flex-1 flex-col gap-[10px]">
              {draft.schedule.map((day, index) => (
                <div
                  key={day.key}
                  className="flex flex-wrap items-center gap-[12px] rounded-[16px] bg-[#f4f4f8] px-[16px] py-[12px]"
                >
                  <span className="min-w-[120px] text-[15px] font-semibold">
                    {day.label}
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
                    {day.isOpen ? "Открыто" : "Закрыто"}
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
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
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
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ml-auto rounded-[8px] p-[6px] opacity-50 hover:bg-white hover:opacity-100"
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

            <div className="w-full shrink-0 rounded-[20px] bg-[#f0f4fa] p-[22px] lg:w-[280px]">
              <h4 className="mb-[16px] text-[17px] font-semibold">Недельный график</h4>
              <ul className="flex flex-col gap-[8px]">
                {draft.schedule.map((day) => (
                  <li
                    key={day.key}
                    className="flex justify-between text-[15px] font-semibold"
                  >
                    <span>{day.shortLabel}</span>
                    {day.isOpen ? (
                      <span>
                        {day.openTime} – {day.closeTime}
                      </span>
                    ) : (
                      <span className="text-[#e53935]">Закрыто</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-[20px] flex items-center gap-[12px] rounded-[14px] border border-[#0a6af7]/30 bg-white/60 px-[14px] py-[12px]">
                <Image src={assets.popular.timeIcon} alt="" width={22} height={22} />
                <p className="text-[14px] font-semibold leading-snug text-[#0a6af7]">
                  Ваш бизнес работает {weeklyHours} часа в неделю
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Отзывы">
          <div className="flex flex-wrap items-center gap-[40px]">
            <div>
              <p className="text-[48px] font-bold leading-none">4,6</p>
              <p className="mt-[6px] text-[15px] opacity-60">(102 отзыва)</p>
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
            Удалить
          </button>
          <Button
            text="Сохранить изменение"
            onClick={handleSave}
            className="flex-1 !w-full text-center text-[18px] !px-[20px]"
          />
        </div>
      </div>
    </div>
  );
}
