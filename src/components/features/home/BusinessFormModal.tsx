"use client";

import { useState, useRef } from "react";
import Button from "@/components/shared/Button";
import { useBusinessFormStore } from "@/store/businessForm.store";

const inputClass =
  "w-full rounded-[18px] border border-[#e5e7eb] bg-white pt-[20px] pr-[21px] pb-[21px] pl-[18px] text-[16px] leading-[19px] focus:border-[#0a6af7] focus:outline-none";

const labelClass = "mb-[12px] block text-[16px] leading-[19px] font-semibold";

export default function BusinessFormModal() {
  const formData = useBusinessFormStore((state) => state.formData);
  const setFormField = useBusinessFormStore((state) => state.setFormField);
  const submitApplication = useBusinessFormStore((state) => state.submitApplication);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commentMaxWords = 180;
  const commentWords = formData.comment.trim()
    ? formData.comment.trim().split(/\s+/).length
    : 0;

  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setFormField("comment", e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "60px";
      el.style.height = `${el.scrollHeight}px`;
    }
  }

  async function handleSubmit() {
    if (
      !formData.companyName.trim() ||
      !formData.activity.trim() ||
      !formData.location.trim() ||
      !formData.phone.trim()
    ) {
      alert("Заполните обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: заменить на реальный запрос к API
      await new Promise((resolve) => setTimeout(resolve, 600));
      submitApplication();
      if (textareaRef.current) {
        textareaRef.current.style.height = "60px";
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-[20px] text-[48px] font-semibold">
        Форма для заполнения
      </h1>

      <div className="rounded-[24px] bg-white p-[24px_28px]">
        <h2 className="mb-[32px] text-[24px] font-semibold">
          Информация бизнеса
        </h2>

        <div className="flex flex-col gap-[16px]">
          <div className="mb-[7px]">
            <label className={labelClass}>
              Название компании <span className="text-red-500">*</span>
            </label>
            <input
              className={inputClass}
              placeholder="Beauty Studio"
              value={formData.companyName}
              onChange={(e) => setFormField("companyName", e.target.value)}
            />
          </div>

          <div className="mb-[18px]">
            <label className={labelClass}>
              Сфера деятельности <span className="text-red-500">*</span>
            </label>
            <input
              className={inputClass}
              placeholder="Написать..."
              value={formData.activity}
              onChange={(e) => setFormField("activity", e.target.value)}
            />
          </div>

          <div className="mb-[7px]">
            <label className={labelClass}>
              ИНН{" "}
              <span className="font-normal text-[var(--text-muted)]">
                (Ускорит процесс проверки)
              </span>
            </label>
            <input
              className={inputClass}
              placeholder="Написать..."
              value={formData.inn}
              onChange={(e) => setFormField("inn", e.target.value)}
            />
          </div>

          <div className="flex gap-[16px] mb-[18px]">
            <div className="flex-1">
              <label className={labelClass}>
                Расположение <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                placeholder="Обязательно"
                value={formData.location}
                onChange={(e) => setFormField("location", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className={labelClass}>
                Контактный номер <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                placeholder="Обязательно"
                value={formData.phone}
                onChange={(e) => setFormField("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="mb-[18px]">
            <label className={labelClass}>Соц сети</label>
            <input
              className={inputClass}
              placeholder="Необязательно"
              value={formData.social}
              onChange={(e) => setFormField("social", e.target.value)}
            />
          </div>

          <div className="mb-[18px]">
            <label className={labelClass}>Веб сайт</label>
            <input
              className={inputClass}
              placeholder="Необязательно"
              value={formData.website}
              onChange={(e) => setFormField("website", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Комментарии</label>
            <textarea
              ref={textareaRef}
              className="w-full min-h-[60px] rounded-[18px] border border-[#e5e7eb] bg-white px-[18px] py-[20px] text-[16px] leading-[19px] resize-none overflow-hidden focus:border-[#0a6af7] focus:outline-none"
              placeholder="Написать..."
              value={formData.comment}
              onChange={handleCommentChange}
            />
            <span className="mt-[4px] block text-[16px] leading-[19px] font-semibold opacity-60">
              {commentWords}/{commentMaxWords} слов
            </span>
          </div>
        </div>

        <div className="mt-[24px] flex justify-end">
          <Button
            text={isSubmitting ? "Отправка..." : "Отправить заявку"}
            onClick={handleSubmit}
            disabled={isSubmitting}
            paddingTop="pt-[16px]"
            paddingBottom="pb-[16px]"
            paddingLeft="pl-[76px]"
            paddingRight="pr-[76px]"
            className="text-[24px] !font-normal"
          />
        </div>
      </div>
    </div>
  );
}
