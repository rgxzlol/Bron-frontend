"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatPriceInputOnChange } from "@/lib/formatPrice";
import { BUSINESS_CATEGORIES } from "@/store/business.store";
import {
  type MapLocationFilter,
  useMapFilterStore,
} from "@/store/mapFilter.store";
import s from "./mapCategoriesModal.module.css";

const LOCATION_OPTIONS: { id: MapLocationFilter; label: string }[] = [
  { id: "nearby", label: "По близости" },
  { id: "3-7", label: "3-7км от меня" },
  { id: "10-15", label: "10-15км от меня" },
];

type MapCategoriesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
};

export default function MapCategoriesModal({
  isOpen,
  onClose,
  onApply,
}: MapCategoriesModalProps) {
  const [mounted, setMounted] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

  const draftLocation = useMapFilterStore((state) => state.draftLocation);
  const draftCategory = useMapFilterStore((state) => state.draftCategory);
  const draftMaxPrice = useMapFilterStore((state) => state.draftMaxPrice);
  const setDraftLocation = useMapFilterStore((state) => state.setDraftLocation);
  const setDraftCategory = useMapFilterStore((state) => state.setDraftCategory);
  const setDraftMaxPrice = useMapFilterStore((state) => state.setDraftMaxPrice);
  const applyFilters = useMapFilterStore((state) => state.applyFilters);
  const syncDraftFromApplied = useMapFilterStore((state) => state.syncDraftFromApplied);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    syncDraftFromApplied();
    setCategoryError(false);

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
  }, [isOpen, onClose, syncDraftFromApplied]);

  if (!isOpen || !mounted) return null;

  function handleApply() {
    if (!draftCategory.trim()) {
      setCategoryError(true);
      return;
    }

    const applied = applyFilters();
    if (!applied) return;

    onApply();
    onClose();
  }

  return createPortal(
    <div
      className={s.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Категории"
    >
      <div className={s.modal} onClick={(event) => event.stopPropagation()}>
        <div className={s.handle} aria-hidden="true">
          <span className={s.handleBar} />
        </div>

        <div className={s.header}>
          <h2 className={s.title}>Категории</h2>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={s.section}>
          <span className={s.sectionTitle}>Месторасположение</span>
          <div className={s.locationList}>
            {LOCATION_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${s.locationBtn} ${
                  draftLocation === option.id ? s.locationActive : ""
                }`}
                onClick={() =>
                  setDraftLocation(draftLocation === option.id ? null : option.id)
                }
              >
                <span className={s.locationIcon} aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 21s-6.5-5.1-6.5-10a6.5 6.5 0 0 1 13 0c0 4.9-6.5 10-6.5 10z" />
                    <circle cx="12" cy="11" r="2.3" />
                  </svg>
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={s.section}>
          <span className={s.sectionTitle}>Категория бизнеса</span>
          <div className={s.selectWrap}>
            <select
              className={`${s.select} ${categoryError ? s.selectError : ""}`}
              value={draftCategory}
              onChange={(event) => {
                setDraftCategory(event.target.value);
                setCategoryError(false);
              }}
            >
              <option value="">Обязательно</option>
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <span className={s.selectChevron} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.5 8.5 12 16l7.5-7.5h-15z" />
              </svg>
            </span>
          </div>
          {categoryError && (
            <p className={s.errorText}>Выберите категорию бизнеса</p>
          )}
        </div>

        <div className={s.section}>
          <span className={s.sectionTitle}>Введите приблизительную цену</span>
          <div className={s.priceRow}>
            <input
              className={s.priceInput}
              type="text"
              inputMode="numeric"
              placeholder="Введите цену"
              value={draftMaxPrice}
              onChange={(event) =>
                setDraftMaxPrice(formatPriceInputOnChange(event.target.value))
              }
            />
            <div className={s.selectWrap}>
              <select className={s.currencySelect} defaultValue="sum" aria-label="Валюта">
                <option value="sum">Сум</option>
              </select>
              <span className={s.selectChevron} aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 8.5 12 16l7.5-7.5h-15z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <button type="button" className={s.applyBtn} onClick={handleApply}>
          Применить
        </button>
      </div>
    </div>,
    document.body,
  );
}
