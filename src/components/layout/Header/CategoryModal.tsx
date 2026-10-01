"use client";

import { FC, useEffect, useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
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
import { LocationSelector } from "./LocationSelector";
import { CurrencyDropdown } from "./CurrencyDropdown";

interface CategoryModalProps {
  handleClose(): void;
}

export const CategoryModal: FC<CategoryModalProps> = ({ handleClose }) => {
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<FilterModalError>(null);
  const [priceInputInvalid, setPriceInputInvalid] = useState(false);
  const [currency, setCurrency] = useState("sum");

  const draftLocation = useMapFilterStore((state) => state.draftLocation);
  const draftCategory = useMapFilterStore((state) => state.draftCategory);
  const draftMaxPrice = useMapFilterStore((state) => state.draftMaxPrice);
  const setDraftLocation = useMapFilterStore((state) => state.setDraftLocation);
  const setDraftCategory = useMapFilterStore((state) => state.setDraftCategory);
  const setDraftMaxPrice = useMapFilterStore((state) => state.setDraftMaxPrice);
  const submitFilters = useMapFilterStore((state) => state.submitFilters);
  const syncDraftFromApplied = useMapFilterStore((state) => state.syncDraftFromApplied);

  useEffect(() => {
    syncDraftFromApplied();
    setSubmitError(null);
    setPriceInputInvalid(false);
  }, [syncDraftFromApplied]);

  function handleLocationChange(value: string) {
    const nextValue = value as MapLocationFilter;
    setDraftLocation(draftLocation === nextValue ? null : nextValue);
    setSubmitError(null);
    setPriceInputInvalid(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = submitFilters({ invalidPriceAttempt: priceInputInvalid });
    if (!isFilterSubmitSuccess(result)) {
      setSubmitError(getFilterSubmitError(result));
      return;
    }

    handleClose();
  }

  const errorMessage = getFilterModalErrorMessage(submitError, t);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[4px] animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <section
      className="category-search-modal relative flex w-full max-w-[568px] animate-in fade-in zoom-in-95 flex-col rounded-[22px] bg-white p-5 shadow-2xl duration-200"
        aria-modal="true"
        role="dialog"
        aria-label={t("map.categories")}
        data-testid="map-categories-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-4 flex w-full items-center justify-center">
          <h2 className="text-[21px] font-medium text-black">{t("map.categories")}</h2>
          <button
            onClick={handleClose}
            className="category-search-modal-close group absolute right-0"
            aria-label={t("map.closeFilters")}
            type="button"
          >
            <Image
              src={assets.header.close}
              alt=""
              width={28}
              height={28}
              className="opacity-100 transition-opacity"
              data-category-close-icon
            />
          </button>
        </div>

        <form className="flex flex-col gap-[12px]" onSubmit={handleSubmit}>
          <div className="flex flex-col" data-testid="map-proximity-block">
            <h3 className="mb-[7px] text-[14px] font-medium text-black">
              {t("map.byProximity")}
            </h3>
            <LocationSelector
              value={draftLocation ?? ""}
              onChange={handleLocationChange}
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="header-business-category"
              className="mb-[7px] text-[14px] font-medium text-black"
            >
              {t("map.businessCategory")}
            </label>
            <div className="relative">
              <select
                id="header-business-category"
                data-testid="map-category-select"
                value={draftCategory}
                onChange={(event) => {
                  setDraftCategory(event.target.value);
                  setSubmitError(null);
                  setPriceInputInvalid(false);
                }}
                className={`h-[60px] w-full appearance-none rounded-[15px] border-2 bg-[#FAFAFF] px-[16px] text-[16px] font-semibold text-black outline-none transition-all duration-300 ${
                  submitError
                    ? "border-[#e02424]"
                    : "border-transparent focus:border-[#0A6AF7] focus:bg-white"
                }`}
              >
                <option value="">                {t("map.filterAll")}</option>
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {translateBusinessCategory(t, category)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2">
              <Image src={assets.booking.arrowDown} alt="" width={18} height={18} />
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="price-input"
              className="mb-[7px] text-[14px] font-medium text-black"
            >
              {t("map.approxPrice")}
            </label>

            <div className="flex w-full items-center gap-[12px]">
              <div
                className={`flex h-[60px] flex-1 items-center rounded-[15px] border-2 bg-[#FAFAFF] px-[16px] py-[18px] transition-all duration-200 focus-within:border-[#0A6AF7] focus-within:bg-white ${
                  submitError === "invalid_price"
                    ? "border-[#e02424]"
                    : "border-transparent"
                }`}
              >
                <input
                  id="price-input"
                  data-testid="map-price-input"
                  type="text"
                  inputMode="numeric"
                  placeholder={t("map.pricePlaceholder")}
                  className="w-full bg-transparent text-[16px] font-semibold text-black outline-none placeholder:font-normal placeholder:text-gray-400"
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
              </div>

              <CurrencyDropdown value={currency} onChange={setCurrency} />
            </div>
          </div>

          {errorMessage ? (
            <p
              className="text-[14px] font-semibold text-[#e02424]"
              role="alert"
              data-testid="map-filter-error"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            data-testid="map-filter-apply"
            className="mt-3 w-full cursor-pointer rounded-[20px] bg-[#0A6AF7] py-[16px] text-[18px] font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#0859d4] hover:shadow-lg active:scale-[0.98]"
          >
            {t("map.apply")}
          </button>
        </form>
      </section>
    </div>
  );
};
