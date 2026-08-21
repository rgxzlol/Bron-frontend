"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { assets } from "@/lib/assets";
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
                <Image src={assets.map.geoMark} alt="" width={18} height={18} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={s.section}>
          <span className={s.sectionTitle}>Категория бизнеса</span>
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
          {categoryError && (
            <p className={s.errorText}>Выберите категорию бизнеса</p>
          )}
        </div>

        <div className={s.section}>
          <span className={s.sectionTitle}>Введите приблизительную ценну</span>
          <div className={s.priceRow}>
            <input
              className={s.priceInput}
              type="text"
              inputMode="numeric"
              placeholder="Введите ценну"
              value={draftMaxPrice}
              onChange={(event) =>
                setDraftMaxPrice(formatPriceInputOnChange(event.target.value))
              }
            />
            <select className={s.currencySelect} defaultValue="sum" aria-label="Валюта">
              <option value="sum">Сум</option>
            </select>
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
