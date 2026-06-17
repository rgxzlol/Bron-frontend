"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { readImageFile } from "@/lib/readImageFile";
import { useProfileStore } from "@/store/profile.store";
import {
  REVIEW_TAGS,
  useReviewStore,
} from "@/store/review.store";
import s from "./reviewModal.module.css";

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shopId?: string;
  shopName?: string;
};

export default function ReviewModal({
  isOpen,
  onClose,
  shopId,
  shopName,
}: ReviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullName = useProfileStore((state) => state.fullName);
  const draft = useReviewStore((state) => state.draft);
  const setRating = useReviewStore((state) => state.setRating);
  const setText = useReviewStore((state) => state.setText);
  const setAuthorName = useReviewStore((state) => state.setAuthorName);
  const toggleTag = useReviewStore((state) => state.toggleTag);
  const addPhoto = useReviewStore((state) => state.addPhoto);
  const removePhoto = useReviewStore((state) => state.removePhoto);
  const submitReview = useReviewStore((state) => state.submitReview);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (!draft.authorName.trim()) {
      setAuthorName(fullName);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, fullName, draft.authorName, setAuthorName]);

  if (!isOpen || !mounted) return null;

  const canSubmit =
    draft.rating > 0 && draft.text.trim().length > 0 && draft.authorName.trim().length > 0;

  async function handlePhotoUpload(file: File) {
    const url = await readImageFile(file);
    if (url) addPhoto(url);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    submitReview({ shopId, shopName });
    onClose();
  }

  return createPortal(
    <div
      className={s.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Оставить отзыв"
    >
      <div className={s.modal} onClick={(event) => event.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>Оставить отзыв</h2>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Закрыть">
            <Image src={assets.map.quitIcon} alt="" width={22} height={22} />
          </button>
        </div>

        <div className={s.grid}>
          <div className={s.column}>
            <div>
              <span className={s.label}>Ваша оценка</span>
              <div className={s.stars} role="radiogroup" aria-label="Оценка">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${s.starBtn} ${star <= draft.rating ? s.starActive : ""}`}
                    onClick={() => setRating(star)}
                    aria-label={`${star} из 5`}
                    aria-pressed={star <= draft.rating}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className={s.hint}>Нажми на звезду чтобы оставить отзыв</p>
            </div>

            <div>
              <span className={s.label}>Ваш отзыв</span>
              <div className={s.textareaWrap}>
                <textarea
                  className={s.textarea}
                  value={draft.text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Поделись своим опытом..."
                  maxLength={500}
                />
                <span className={s.counter}>{draft.text.length}/500</span>
              </div>
            </div>

            <div>
              <span className={s.label}>Ваше имя</span>
              <input
                className={s.input}
                type="text"
                value={draft.authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder="Введите свое имя"
              />
            </div>
          </div>

          <div className={s.column}>
            <div>
              <span className={s.label}>Добавить фото</span>
              <button
                type="button"
                className={s.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className={s.uploadIcon} aria-hidden>
                  🖼
                </span>
                Загрузить фото
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={s.hiddenInput}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) await handlePhotoUpload(file);
                  event.target.value = "";
                }}
              />
              {draft.photos.length > 0 && (
                <div className={s.photoList}>
                  {draft.photos.map((photo, index) => (
                    <div key={`${photo.slice(0, 32)}-${index}`} className={s.photoThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt="" />
                      <button
                        type="button"
                        className={s.removePhoto}
                        onClick={() => removePhoto(index)}
                        aria-label="Удалить фото"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <span className={s.label}>Чем вам понравилось?</span>
              <div className={s.tags}>
                {REVIEW_TAGS.map((tag) => {
                  const isActive = draft.tags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`${s.tag} ${isActive ? s.tagActive : ""}`}
                      onClick={() => toggleTag(tag.id)}
                      aria-pressed={isActive}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={s.submitBtn}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Опубликовать отзыв
        </button>
      </div>
    </div>,
    document.body,
  );
}
