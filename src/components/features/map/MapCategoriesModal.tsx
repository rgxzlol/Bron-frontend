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
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  BUSINESS_CATEGORY_KEYS,
  translateLabel,
} from "@/lib/i18n/labels";
import s from "./mapCategoriesModal.module.css";

const LOCATION_OPTIONS: { id: MapLocationFilter; labelKey: string }[] = [
  { id: "nearby", labelKey: "header.nearby" },
  { id: "3-7", labelKey: "map.range3to7" },
  { id: "10-15", labelKey: "map.range10to15" },
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
  const { t } = useTranslation();
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
      aria-label={t("map.categories")}
    >
      <div className={s.modal} onClick={(event) => event.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>{t("map.categories")}</h2>
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className={s.section}>
          <span className={s.sectionTitle}>{t("map.location")}</span>
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
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className={s.section}>
          <span className={s.sectionTitle}>{t("map.businessCategory")}</span>
          <select
            className={`${s.select} ${categoryError ? s.selectError : ""}`}
            value={draftCategory}
            onChange={(event) => {
              setDraftCategory(event.target.value);
              setCategoryError(false);
            }}
          >
            <option value="">{t("map.required")}</option>
            {BUSINESS_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {translateLabel(t, category, BUSINESS_CATEGORY_KEYS)}
              </option>
            ))}
          </select>
          {categoryError && (
            <p className={s.errorText}>{t("map.categoryRequiredError")}</p>
          )}
        </div>

        <div className={s.section}>
          <span className={s.sectionTitle}>{t("map.approxPrice")}</span>
          <div className={s.priceRow}>
            <input
              className={s.priceInput}
              type="text"
              inputMode="numeric"
              placeholder={t("map.pricePlaceholder")}
              value={draftMaxPrice}
              onChange={(event) =>
                setDraftMaxPrice(formatPriceInputOnChange(event.target.value))
              }
            />
            <select
              className={s.currencySelect}
              defaultValue="sum"
              aria-label={t("header.currency")}
            >
              <option value="sum">{t("map.currencySum")}</option>
            </select>
          </div>
        </div>

        <button type="button" className={s.applyBtn} onClick={handleApply}>
          {t("map.apply")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
