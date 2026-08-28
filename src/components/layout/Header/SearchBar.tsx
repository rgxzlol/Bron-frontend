"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { useSearchStore } from "@/store/search.store";
import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/search/sanitize";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { CategoryModal } from "./CategoryModal";

export default function SearchBar() {
  const { t } = useTranslation();
  const query = useSearchStore((state) => state.query);
  const suggestions = useSearchStore((state) => state.suggestions);
  const setQuery = useSearchStore((state) => state.setQuery);
  const submitSearch = useSearchStore((state) => state.submitSearch);
  const clearSearch = useSearchStore((state) => state.clearSearch);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSubmit() {
    submitSearch();
    setShowSuggestions(false);
  }

  function handleSuggestionSelect(title: string) {
    setQuery(title);
    submitSearch(title);
    setShowSuggestions(false);
  }

  return (
    <div ref={rootRef} className="relative flex w-full items-center rounded-[38px] bg-[#f4f4f8] px-5 py-[6px] lg:max-w-[720px]">
      <label className="relative flex min-w-0 flex-1 items-center pb-1">
        <button
          type="button"
          onClick={handleSubmit}
          className="mr-4 shrink-0"
          aria-label="Поиск"
        >
          <Image src={assets.header.search} alt="" width={22} height={22} />
        </button>
        <input
          className="mr-1 h-[25px] w-full min-w-0 p-2 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          placeholder={t("common.searchPlaceholder")}
          type="search"
          name="search"
          value={query}
          maxLength={SEARCH_QUERY_MAX_LENGTH}
          onChange={(event) => {
            setQuery(event.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-controls="search-suggestions"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              clearSearch();
              setShowSuggestions(false);
            }}
            className="absolute right-5 text-gray-400 transition-colors hover:text-black"
            aria-label="Очистить поиск"
          >
            <Image src={assets.header.close} alt="" />
          </button>
        )}
      </label>

      <button
        onClick={() => setIsFiltersOpen(true)}
        type="button"
        data-testid="search-filter-open"
        className="rounded-full bg-white p-[9px]"
        aria-label={t("map.categories")}
      >
        <Image src={assets.header.filter} alt="" width={18} height={18} />
      </button>

      {showSuggestions && suggestions.length > 0 ? (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[18px] border border-[var(--border-default)] bg-white shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]"
        >
          {suggestions.map((item) => (
            <li key={item.id} role="option">
              <button
                type="button"
                onClick={() => handleSuggestionSelect(item.title)}
                className="flex w-full flex-col gap-1 px-5 py-4 text-left transition-colors hover:bg-[#f4f4f8]"
              >
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {item.title}
                </span>
                <span className="line-clamp-1 text-[13px] font-semibold text-[var(--text-secondary)]">
                  {item.description}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {isFiltersOpen ? <CategoryModal handleClose={() => setIsFiltersOpen(false)} /> : null}
    </div>
  );
}
