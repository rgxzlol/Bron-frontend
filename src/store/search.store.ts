import { create } from "zustand";
import {
  getSearchSuggestions,
  searchCatalog,
  type SearchCatalogItem,
} from "@/lib/search/catalog";
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

    const results = searchCatalog(nextQuery);

    set({
      query: nextQuery,
      submittedQuery: nextQuery,
      results,
      suggestions: getSearchSuggestions(nextQuery),
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
