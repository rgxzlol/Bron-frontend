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
        className="relative flex w-full max-w-[659px] animate-in fade-in zoom-in-95 flex-col rounded-[23px] bg-white p-6 shadow-2xl duration-200"
        aria-modal="true"
        role="dialog"
        aria-label={t("map.categories")}
        data-testid="map-categories-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-6 flex w-full items-center justify-center">
          <h2 className="text-[24px] font-medium text-black">{t("map.categories")}</h2>
          <button
            onClick={handleClose}
            className="group absolute right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#FAFAFF] text-black transition-all duration-200 hover:bg-[#EAEAEF]"
            aria-label={t("map.closeFilters")}
            type="button"
          >
            <span className="flex h-4 w-4 items-center justify-center">
              <Image
                src={assets.header.close}
                alt=""
                className="opacity-60 transition-opacity group-hover:opacity-100"
              />
            </span>
          </button>
        </div>

        <form className="flex flex-col gap-[16px]" onSubmit={handleSubmit}>
          <div className="flex flex-col" data-testid="map-proximity-block">
            <h3 className="mb-[9px] text-[16px] font-medium text-black">
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
              className="mb-[9px] text-[16px] font-medium text-black"
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
                className={`h-[72px] w-full appearance-none rounded-[17px] border-2 bg-[#FAFAFF] px-[18px] text-[18px] font-semibold text-black outline-none transition-all duration-300 ${
                  submitError
                    ? "border-[#e02424]"
                    : "border-transparent focus:border-[#0A6AF7] focus:bg-white"
                }`}
              >
                <option value="">{t("map.required")}</option>
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-[18px] top-1/2 -translate-y-1/2">
                <Image src={assets.booking.arrowDown} alt="" width={20} height={20} />
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="price-input"
              className="mb-[9px] text-[16px] font-medium text-black"
            >
              {t("map.approxPrice")}
            </label>

            <div className="flex w-full items-center gap-[12px]">
              <div
                className={`flex h-[72px] flex-1 items-center rounded-[17px] border-2 bg-[#FAFAFF] px-[18px] py-[24px] transition-all duration-200 focus-within:border-[#0A6AF7] focus-within:bg-white ${
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
                  className="w-full bg-transparent text-[18px] font-semibold text-black outline-none placeholder:font-normal placeholder:text-gray-400"
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
            className="mt-4 w-full cursor-pointer rounded-[23px] bg-[#0A6AF7] py-[20px] text-[20px] font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#0859d4] hover:shadow-lg active:scale-[0.98]"
          >
            {t("map.apply")}
          </button>
        </form>
      </section>
    </div>
  );
};
