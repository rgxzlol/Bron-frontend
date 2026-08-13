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
  onChange,
  placeholder,
  inputClassName = "",
}: Props) {
  const { t, language } = useTranslation();
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

      void searchAddressSuggestions(value, language)
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
  }, [value, language]);

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

  return (
    <div ref={wrapperRef} className={s.wrapper}>
      <input
        className={inputClassName}
        value={value}
        placeholder={placeholder}
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

      {isLoading && <span className={s.hint}>{t("businessAddress.searching")}</span>}
      {!isLoading && value.trim() && !coordsSelected && (
        <span className={s.hint}>{t("businessAddress.pickFromList")}</span>
      )}
      {!isLoading && coordsSelected && (
        <span className={s.hintOk}>{t("businessAddress.selectedOk")}</span>
      )}

      {isOpen && suggestions.length > 0 && (
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
  );
}
