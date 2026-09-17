"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { readImageFile } from "@/lib/readImageFile";
import { useProfileStore } from "@/store/profile.store";
import {
  REVIEW_MAX_LENGTH,
  REVIEW_TAGS,
  useReviewStore,
} from "@/store/review.store";
import s from "./reviewModal.module.css";

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  shopId?: string;
  shopName?: string;
  bookingId?: number;
  onSubmitted?: () => void;
};

export default function ReviewModal({
  isOpen,
  onClose,
  shopId,
  shopName,
  bookingId,
  onSubmitted,
}: ReviewModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    rating?: string;
    text?: string;
    authorName?: string;
  }>({});
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
    if (!isOpen) {
      setLimitReached(false);
      setFieldErrors({});
      return;
    }

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

  useEffect(() => {
    if (draft.text.length < REVIEW_MAX_LENGTH) {
      setLimitReached(false);
    }
  }, [draft.text.length]);

  if (!isOpen || !mounted) return null;

  const isAtLimit = draft.text.length >= REVIEW_MAX_LENGTH;

  async function handlePhotoUpload(file: File) {
    const url = await readImageFile(file);
    if (url) addPhoto(url);
  }

  function handleTextChange(value: string) {
    const next = value.slice(0, REVIEW_MAX_LENGTH);
    if (value.length > REVIEW_MAX_LENGTH) {
      setLimitReached(true);
    }
    setText(next);
  }

  function handleTextPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;

    const textarea = event.currentTarget;
    const start = textarea.selectionStart ?? draft.text.length;
    const end = textarea.selectionEnd ?? draft.text.length;
    const nextValue = `${draft.text.slice(0, start)}${pasted}${draft.text.slice(end)}`;

    if (nextValue.length > REVIEW_MAX_LENGTH) {
      event.preventDefault();
      setLimitReached(true);
      handleTextChange(nextValue);
    }
  }

  function handleSubmit() {
    const errors: { rating?: string; text?: string; authorName?: string } = {};

    if (draft.rating <= 0) {
      errors.rating = t("review.errorRating");
    }
    if (!draft.text.trim()) {
      errors.text = t("review.errorText");
    }
    if (!draft.authorName.trim()) {
      errors.authorName = t("review.errorName");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const submitted = submitReview({ shopId, shopName, bookingId });
    if (!submitted) return;

    setFieldErrors({});
    onSubmitted?.();
    onClose();
  }

  return createPortal(
    <div
      className={s.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("review.title")}
      data-testid="review-modal"
    >
      <div className={s.modal} onClick={(event) => event.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>{t("review.title")}</h2>
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label={t("common.close")}
            data-testid="review-modal-close"
          >
            <Image src={assets.map.quitIcon} alt="" width={22} height={22} />
          </button>
        </div>

        <div className={s.grid}>
          {Object.keys(fieldErrors).length > 0 && (
            <p
              className={s.validationSummary}
              role="alert"
              data-testid="review-validation-summary"
            >
              {t("review.validationSummary")}
            </p>
          )}
          <div className={s.column}>
            <div>
              <span className={s.label}>{t("review.yourRating")}</span>
              <div
                className={`${s.stars} ${fieldErrors.rating ? s.starsError : ""}`}
                role="radiogroup"
                aria-label={t("review.ratingAria")}
                data-testid="review-rating-group"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${s.starBtn} ${star <= draft.rating ? s.starActive : ""}`}
                    onClick={() => {
                      setRating(star);
                      if (fieldErrors.rating) {
                        setFieldErrors((prev) => ({ ...prev, rating: undefined }));
                      }
                    }}
                    aria-label={t("review.starOfFive", { star })}
                    aria-pressed={star <= draft.rating}
                    data-testid={`review-rating-star-${star}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {fieldErrors.rating && (
                <p className={s.errorMessage} data-testid="review-error-rating">
                  {fieldErrors.rating}
                </p>
              )}
              <p className={s.hint}>{t("review.starHint")}</p>
            </div>

            <div>
              <span className={s.label}>{t("review.yourReview")}</span>
              <div className={s.textareaWrap}>
                <textarea
                  className={`${s.textarea} ${fieldErrors.text ? s.fieldError : ""}`}
                  value={draft.text}
                  onChange={(event) => {
                    handleTextChange(event.target.value);
                    if (fieldErrors.text) {
                      setFieldErrors((prev) => ({ ...prev, text: undefined }));
                    }
                  }}
                  onPaste={handleTextPaste}
                  placeholder={t("review.reviewPlaceholder")}
                  maxLength={REVIEW_MAX_LENGTH}
                  data-testid="review-text"
                  aria-describedby="review-text-counter review-text-limit-warning"
                />
                <span
                  id="review-text-counter"
                  className={`${s.counter} ${isAtLimit || limitReached ? s.counterLimit : ""}`}
                  data-testid="review-text-counter"
                >
                  {draft.text.length}/{REVIEW_MAX_LENGTH}
                </span>
                {(isAtLimit || limitReached) && (
                  <p
                    id="review-text-limit-warning"
                    className={s.limitWarning}
                    data-testid="review-text-limit-warning"
                    role="alert"
                  >
                    {t("review.charLimitReached")}
                  </p>
                )}
              </div>
              {fieldErrors.text && (
                <p className={s.errorMessage} data-testid="review-error-text">
                  {fieldErrors.text}
                </p>
              )}
            </div>

            <div>
              <span className={s.label}>{t("review.yourName")}</span>
              <input
                className={`${s.input} ${fieldErrors.authorName ? s.fieldError : ""}`}
                type="text"
                value={draft.authorName}
                onChange={(event) => {
                  setAuthorName(event.target.value);
                  if (fieldErrors.authorName) {
                    setFieldErrors((prev) => ({ ...prev, authorName: undefined }));
                  }
                }}
                placeholder={t("review.namePlaceholder")}
                data-testid="review-author-name"
              />
              {fieldErrors.authorName && (
                <p className={s.errorMessage} data-testid="review-error-name">
                  {fieldErrors.authorName}
                </p>
              )}
            </div>
          </div>

          <div className={s.column}>
            <div>
              <span className={s.label}>{t("review.addPhoto")}</span>
              <button
                type="button"
                className={s.uploadArea}
                onClick={() => fileInputRef.current?.click()}
                data-testid="review-photo-upload"
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
                      data-testid={`review-tag-${tag.id}`}
                    >
                      {t(tag.labelKey)}
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
          data-testid="review-submit"
        >
          {t("review.publish")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
