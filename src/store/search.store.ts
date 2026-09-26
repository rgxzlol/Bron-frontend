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
  searchRequestId: number;
  setQuery: (query: string) => void;
  submitSearch: (query?: string) => void;
  clearSearch: () => void;
};

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  submittedQuery: null,
  results: [],
  suggestions: [],
  searchRequestId: 0,

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
        searchRequestId: get().searchRequestId + 1,
      });
      return;
    }

    const searchRequestId = get().searchRequestId + 1;
    const categoryResults = searchCatalog(nextQuery);
    set({
      query: nextQuery,
      submittedQuery: nextQuery,
      results: categoryResults,
      suggestions: getSearchSuggestions(nextQuery),
      searchRequestId,
    });

    void searchBusinessesFromApi(nextQuery).then((businessResults) => {
      if (get().searchRequestId !== searchRequestId) return;
      const results = [...categoryResults, ...businessResults];
      set({ results });
    });
  },

  clearSearch: () => {
    set({
      query: "",
      submittedQuery: null,
      results: [],
      suggestions: [],
      searchRequestId: get().searchRequestId + 1,
    });
  },
}));
