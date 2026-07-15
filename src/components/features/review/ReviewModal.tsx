"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { readImageFile } from "@/lib/readImageFile";
import { REVIEW_TAG_KEYS, translateLabel } from "@/lib/i18n/labels";
import { useTranslation } from "@/lib/i18n/useTranslation";
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
  const { t } = useTranslation();

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
      aria-label={t("review.title")}
    >
      <div className={s.modal} onClick={(event) => event.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>{t("review.title")}</h2>
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <Image src={assets.map.quitIcon} alt="" width={22} height={22} />
          </button>
        </div>

        <div className={s.grid}>
          <div className={s.column}>
            <div>
              <span className={s.label}>{t("review.yourRating")}</span>
              <div className={s.stars} role="radiogroup" aria-label={t("review.ratingAria")}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${s.starBtn} ${star <= draft.rating ? s.starActive : ""}`}
                    onClick={() => setRating(star)}
                    aria-label={t("review.starOfFive", { star })}
                    aria-pressed={star <= draft.rating}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className={s.hint}>{t("review.starHint")}</p>
            </div>

            <div>
              <span className={s.label}>{t("review.yourReview")}</span>
              <div className={s.textareaWrap}>
                <textarea
                  className={s.textarea}
                  value={draft.text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={t("review.reviewPlaceholder")}
                  maxLength={500}
                />
                <span className={s.counter}>{draft.text.length}/500</span>
              </div>
            </div>

            <div>
              <span className={s.label}>{t("review.yourName")}</span>
              <input
                className={s.input}
                type="text"
                value={draft.authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                placeholder={t("review.namePlaceholder")}
              />
            </div>
          </div>

          <div className={s.column}>
            <div>
              <span className={s.label}>{t("review.addPhoto")}</span>
              <button
                type="button"
                className={s.uploadArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className={s.uploadIcon} aria-hidden>
                  🖼
                </span>
                {t("review.uploadPhoto")}
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
                        aria-label={t("review.removePhoto")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <span className={s.label}>{t("review.likedWhat")}</span>
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
                      {translateLabel(t, tag.label, REVIEW_TAG_KEYS)}
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
          {t("review.publish")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
