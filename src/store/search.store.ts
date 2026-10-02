import { create } from "zustand";
import {
  getSearchSuggestions,
  searchCatalog,
  type SearchCatalogItem,
} from "@/lib/search/catalog";
import {
  fetchCategoriesWithCounts,
  searchBusinessesFromApi,
} from "@/lib/home/discovery";
import type { Category } from "@/types/category";
import {
  isSearchQuerySubmittable,
  normalizeSearchQuery,
  sanitizeSearchQuery,
} from "@/lib/search/sanitize";

let categoryCountsRequest: Promise<Category[]> | null = null;

function loadCategoryCounts() {
  if (!categoryCountsRequest) {
    categoryCountsRequest = fetchCategoriesWithCounts();
  }

  return categoryCountsRequest;
}

function addCategoryCounts(
  items: SearchCatalogItem[],
  categories: Category[],
): SearchCatalogItem[] {
  if (categories.length === 0) {
    return items.map((item) =>
      item.categoryId === undefined ? item : { ...item, description: "" },
    );
  }

  const counts = new Map(
    categories.map((category) => [category.id, category.count]),
  );

  return items.flatMap((item) => {
    if (item.categoryId === undefined) return [item];
    const count = counts.get(item.categoryId);
    if (count === undefined || count <= 0) return [];

    return [{ ...item, description: `${count} услуг` }];
  });
}

type SearchState = {
  query: string;
  submittedQuery: string | null;
  results: SearchCatalogItem[];
  suggestions: SearchCatalogItem[];
  searchRequestId: number;
  suggestionRequestId: number;
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
  suggestionRequestId: 0,

  setQuery: (query) => {
    const sanitizedQuery = sanitizeSearchQuery(query);
    const suggestionRequestId = get().suggestionRequestId + 1;

    set({
      query: sanitizedQuery,
      suggestions: getSearchSuggestions(sanitizedQuery),
      suggestionRequestId,
    });

    void loadCategoryCounts().then((categories) => {
      if (get().suggestionRequestId !== suggestionRequestId) return;
      set({
        suggestions: addCategoryCounts(
          getSearchSuggestions(sanitizedQuery),
          categories,
        ),
      });
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
        suggestionRequestId: get().suggestionRequestId + 1,
      });
      return;
    }

    const searchRequestId = get().searchRequestId + 1;
    const categoryResults = searchCatalog(nextQuery);
    const suggestionRequestId = get().suggestionRequestId + 1;
    set({
      query: nextQuery,
      submittedQuery: nextQuery,
      results: categoryResults,
      suggestions: getSearchSuggestions(nextQuery),
      searchRequestId,
      suggestionRequestId,
    });

    void loadCategoryCounts().then((categories) => {
      if (get().suggestionRequestId !== suggestionRequestId) return;
      set({
        suggestions: addCategoryCounts(
          getSearchSuggestions(nextQuery),
          categories,
        ),
        results: addCategoryCounts(get().results, categories),
      });
    });

    void searchBusinessesFromApi(nextQuery).then(async (businessResults) => {
      const categories = await loadCategoryCounts();
      if (get().searchRequestId !== searchRequestId) return;
      const results = addCategoryCounts(
        [...categoryResults, ...businessResults],
        categories,
      );
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
      suggestionRequestId: get().suggestionRequestId + 1,
    });
  },
}));
