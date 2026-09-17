"use client";

import { useEffect, useRef, useState } from "react";
import {
  searchAddressSuggestions,
  type AddressSuggestion,
} from "@/lib/geocoding";
import { useTranslation } from "@/lib/i18n/useTranslation";
import s from "./addressAutocomplete.module.css";

type Props = {
  value: string;
  coordsSelected?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  inputTestId?: string;
  disabled?: boolean;
  onChange: (payload: {
    address: string;
    lat: number | null;
    lng: number | null;
  }) => void;
  placeholder?: string;
  inputClassName?: string;
};

const DEBOUNCE_MS = 400;

export default function AddressAutocomplete({
  value,
  coordsSelected = false,
  hasError = false,
  errorMessage,
  inputTestId,
  disabled = false,
  onChange,
  placeholder,
  inputClassName = "",
}: Props) {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);

      void searchAddressSuggestions(value)
        .then((items) => {
          setSuggestions(items);
          setIsOpen(items.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setIsOpen(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(suggestion: AddressSuggestion) {
    onChange({
      address: suggestion.placeName,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
    setSuggestions([]);
    setIsOpen(false);
  }

  const showSuggestions = isOpen && suggestions.length > 0;

  return (
    <div
      ref={wrapperRef}
      className={`${s.wrapper} ${showSuggestions ? s.wrapperOpen : ""}`}
    >
      <div className={s.inputArea}>
        <input
          className={`${inputClassName} ${hasError ? "border-[#e02424] ring-2 ring-[#e02424]/20" : ""}`}
          value={value}
          placeholder={placeholder}
          data-testid={inputTestId}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={errorMessage ? "business-address-error" : undefined}
          onChange={(event) =>
            onChange({
              address: event.target.value,
              lat: null,
              lng: null,
            })
          }
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          autoComplete="off"
        />

        {showSuggestions && (
          <ul className={s.list} role="listbox">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  className={s.item}
                  onClick={() => handleSelect(suggestion)}
                >
                  <span className={s.itemTitle}>{suggestion.placeName}</span>
                  {suggestion.subtitle && (
                    <span className={s.itemSubtitle}>{suggestion.subtitle}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {errorMessage ? (
        <span
          id="business-address-error"
          role="alert"
          className="px-4 text-[12px] font-semibold leading-snug text-[#e02424] break-words"
          data-testid="business-field-error-address"
        >
          {errorMessage}
        </span>
      ) : null}

      {isLoading && <span className={s.hint}>{t("businessAddress.searching")}</span>}
      {!isLoading && value.trim() && !coordsSelected && (
        <span className={s.hint}>{t("businessAddress.pickFromList")}</span>
      )}
      {!isLoading && coordsSelected && (
        <span className={s.hintOk}>{t("businessAddress.accepted")}</span>
      )}
    </div>
  );
}
