"use client";

import { useState } from "react";
import { reviewsApi } from "@/lib/api";
import { getAuthToken } from "@/lib/api/token";
import { useToastStore } from "@/store/toast.store";

type CustomerReviewModalProps = {
  customerId: number;
  bookingId: number;
  customerName: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export default function CustomerReviewModal({
  customerId,
  bookingId,
  customerName,
  onClose,
  onSubmitted,
}: CustomerReviewModalProps) {
  const showToast = useToastStore((state) => state.showToast);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (rating < 1) return;

    const token = getAuthToken();
    if (!token) {
      showToast("Оценка клиента", "Требуется авторизация");
      return;
    }

    setSaving(true);
    try {
      await reviewsApi.createForCustomer(customerId, {
        booking_id: bookingId,
        rating,
        comment: comment.trim() || null,
      }, token);
      onSubmitted();
      onClose();
    } catch (error) {
      showToast(
        "Оценка клиента",
        error instanceof Error ? error.message : "Не удалось сохранить оценку",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--backdrop)] p-[20px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Оценка клиента"
    >
      <div
        className="w-full max-w-[420px] rounded-[20px] bg-[var(--bg-surface)] p-[20px] shadow-[var(--shadow-modal)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-[12px]">
          <div>
            <h2 className="text-[19px] font-bold">Оценить клиента</h2>
            <p className="mt-[4px] text-[14px] text-[var(--text-secondary)]">
              {customerName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="theme-close-button" aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="mt-[20px] flex justify-center gap-[6px]" role="radiogroup" aria-label="Оценка от одного до пяти">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`text-[34px] leading-none ${value <= rating ? "text-[#f2b705]" : "text-[var(--text-muted)]"}`}
              onClick={() => setRating(value)}
              aria-label={`${value} из 5`}
              aria-pressed={value === rating}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value.slice(0, 500))}
          placeholder="Комментарий (необязательно)"
          className="mt-[20px] min-h-[110px] w-full resize-none rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-surface-soft)] p-[12px] text-[14px] outline-none"
        />

        <button
          type="button"
          disabled={saving || rating < 1}
          onClick={() => void handleSubmit()}
          className="mt-[16px] w-full rounded-[14px] bg-[#0a6af7] py-[13px] text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить оценку"}
        </button>
      </div>
    </div>
  );
}
