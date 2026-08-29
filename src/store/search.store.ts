import { create } from "zustand";
import {
  getSearchSuggestions,
  searchCatalog,
  type SearchCatalogItem,
} from "@/lib/search/catalog";
import { searchBusinessesFromApi } from "@/lib/home/discovery";
import {
  isSearchQuerySubmittable,
  normalizeSearchQuery,
  sanitizeSearchQuery,
} from "@/lib/search/sanitize";

type SearchState = {
  query: string;
  submittedQuery: string | null;
  results: SearchCatalogItem[];
  suggestions: SearchCatalogItem[];
  setQuery: (query: string) => void;
  submitSearch: (query?: string) => void;
  clearSearch: () => void;
};

function mergeSearchResults(
  localResults: SearchCatalogItem[],
  apiResults: SearchCatalogItem[],
) {
  const seenShopIds = new Set(localResults.map((item) => item.shopId));
  const uniqueApiResults = apiResults.filter(
    (item) => !seenShopIds.has(item.shopId),
  );

  return [...uniqueApiResults, ...localResults];
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  submittedQuery: null,
  results: [],
  suggestions: [],

  setQuery: (query) => {
    const sanitizedQuery = sanitizeSearchQuery(query);

    set({
      query: sanitizedQuery,
      suggestions: getSearchSuggestions(sanitizedQuery),
    });
  },

  submitSearch: (query) => {
    const sanitizedQuery = sanitizeSearchQuery(query ?? get().query);
    const nextQuery = normalizeSearchQuery(sanitizedQuery);

    if (!isSearchQuerySubmittable(sanitizedQuery)) {
      set({
        query: sanitizedQuery,
        submittedQuery: sanitizedQuery.trim() ? sanitizedQuery : null,
        results: [],
        suggestions: [],
      });
      return;
    }

    const localResults = searchCatalog(nextQuery);

    set({
      query: nextQuery,
      submittedQuery: nextQuery,
      results: localResults,
      suggestions: getSearchSuggestions(nextQuery),
    });

    void searchBusinessesFromApi(nextQuery).then((apiResults) => {
      if (get().submittedQuery !== nextQuery || apiResults.length === 0) {
        return;
      }

      set({
        results: mergeSearchResults(localResults, apiResults),
      });
    });
  },

  clearSearch: () => {
    set({
      query: "",
      submittedQuery: null,
      results: [],
      suggestions: [],
    });
  },
}));
