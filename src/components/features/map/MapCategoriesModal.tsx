"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatPriceInputOnChange,
  handlePriceInputKeyDown,
  handlePriceInputPaste,
  hasInvalidPriceInput,
} from "@/lib/formatPrice";
import {
  getFilterModalErrorMessage,
  getFilterSubmitError,
  isFilterSubmitSuccess,
  type FilterModalError,
} from "@/lib/map/filterModal";
import { translateBusinessCategory } from "@/lib/i18n/labels";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { BUSINESS_CATEGORIES } from "@/store/business.store";
import {
  type MapLocationFilter,
  useMapFilterStore,
} from "@/store/mapFilter.store";
import s from "./mapCategoriesModal.module.css";

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
  const [submitError, setSubmitError] = useState<FilterModalError>(null);
  const [priceInputInvalid, setPriceInputInvalid] = useState(false);

  const draftLocation = useMapFilterStore((state) => state.draftLocation);
  const draftCategory = useMapFilterStore((state) => state.draftCategory);
  const draftMaxPrice = useMapFilterStore((state) => state.draftMaxPrice);
  const setDraftLocation = useMapFilterStore((state) => state.setDraftLocation);
  const setDraftCategory = useMapFilterStore((state) => state.setDraftCategory);
  const setDraftMaxPrice = useMapFilterStore((state) => state.setDraftMaxPrice);
  const submitFilters = useMapFilterStore((state) => state.submitFilters);
  const syncDraftFromApplied = useMapFilterStore((state) => state.syncDraftFromApplied);

  const locationOptions: { id: MapLocationFilter; label: string }[] = [
    { id: "nearby", label: t("map.proximityNearby") },
    { id: "3-7", label: t("map.range3to7") },
    { id: "10-15", label: t("map.range10to15") },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    syncDraftFromApplied();
    setSubmitError(null);
    setPriceInputInvalid(false);

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
    const result = submitFilters({ invalidPriceAttempt: priceInputInvalid });
    if (!isFilterSubmitSuccess(result)) {
      setSubmitError(getFilterSubmitError(result));
      return;
    }

    onApply();
    onClose();
  }

  const errorMessage = getFilterModalErrorMessage(submitError, t);

  return createPortal(
    <div
      className={s.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("map.categories")}
      data-testid="map-categories-modal"
    >
      <div className={s.modal} onClick={(event) => event.stopPropagation()}>
        <div className={s.handle} aria-hidden="true">
          <span className={s.handleBar} />
        </div>

        <div className={s.header}>
          <h2 className={s.title}>{t("map.categories")}</h2>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label={t("map.closeFilters")}>
            ×
          </button>
        </div>

        <div className={s.section} data-testid="map-proximity-block">
          <span className={s.sectionTitle}>{t("map.byProximity")}</span>
          <div className={s.locationList}>
            {locationOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                data-testid={`map-location-${option.id}`}
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
          <span className={s.sectionTitle}>{t("map.businessCategory")}</span>
          <div className={s.selectWrap}>
            <select
              className={`${s.select} ${submitError ? s.selectError : ""}`}
              value={draftCategory}
              data-testid="map-category-select"
              onChange={(event) => {
                setDraftCategory(event.target.value);
                setSubmitError(null);
                setPriceInputInvalid(false);
              }}
            >
              <option value="">{t("map.required")}</option>
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {translateBusinessCategory(t, category)}
                </option>
              ))}
            </select>
            <span className={s.selectChevron} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.5 8.5 12 16l7.5-7.5h-15z" />
              </svg>
            </span>
          </div>
          {errorMessage ? (
            <p className={s.errorText} role="alert" data-testid="map-filter-error">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className={s.section}>
          <span className={s.sectionTitle}>{t("map.approxPrice")}</span>
          <div className={s.priceRow}>
            <input
              className={`${s.priceInput} ${
                submitError === "invalid_price" ? s.priceInputError : ""
              }`}
              type="text"
              inputMode="numeric"
              data-testid="map-price-input"
              placeholder={t("map.pricePlaceholder")}
              value={draftMaxPrice}
              onKeyDown={(event) =>
                handlePriceInputKeyDown(event, () => {
                  setPriceInputInvalid(true);
                  setSubmitError("invalid_price");
                })
              }
              onPaste={(event) =>
                handlePriceInputPaste(
                  event,
                  (value) => {
                    setDraftMaxPrice(value);
                    setSubmitError(null);
                    setPriceInputInvalid(false);
                  },
                  () => {
                    setPriceInputInvalid(true);
                    setSubmitError("invalid_price");
                  },
                )
              }
              onChange={(event) => {
                const rawValue = event.target.value;
                if (hasInvalidPriceInput(rawValue)) {
                  setPriceInputInvalid(true);
                  setSubmitError("invalid_price");
                } else {
                  setPriceInputInvalid(false);
                  setSubmitError(null);
                }
                setDraftMaxPrice(formatPriceInputOnChange(rawValue));
              }}
            />
            <div className={s.selectWrap}>
              <select className={s.currencySelect} defaultValue="sum" aria-label={t("map.currencySum")}>
                <option value="sum">{t("map.currencySum")}</option>
              </select>
              <span className={s.selectChevron} aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.5 8.5 12 16l7.5-7.5h-15z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={s.applyBtn}
          data-testid="map-filter-apply"
          onClick={handleApply}
        >
          {t("map.apply")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
