import { create } from "zustand";
import { persist } from "zustand/middleware";
import { formatPriceInput, hasInvalidPriceInput, parsePrice } from "@/lib/formatPrice";

export type MapLocationFilter = "nearby" | "3-7" | "10-15";

export type MapFilterSubmitResult = "applied" | "cleared" | "invalid_price";

type MapFilterState = {
  draftLocation: MapLocationFilter | null;
  draftCategory: string;
  draftMaxPrice: string;
  appliedLocation: MapLocationFilter | null;
  appliedCategory: string;
  appliedMaxPrice: number | null;
  filtersAppliedCount: number;
  setDraftLocation: (location: MapLocationFilter | null) => void;
  setDraftCategory: (category: string) => void;
  setDraftMaxPrice: (price: string) => void;
  applyFilters: () => boolean;
  submitFilters: (options?: { invalidPriceAttempt?: boolean }) => MapFilterSubmitResult;
  applyCategoryFromNavigation: (category: string) => void;
  syncDraftFromApplied: () => void;
};

function hasDraftFilterInput(
  draftCategory: string,
  draftLocation: MapLocationFilter | null,
  draftMaxPrice: string,
) {
  return Boolean(
    draftCategory.trim() || draftLocation || parsePrice(draftMaxPrice) > 0,
  );
}

export const useMapFilterStore = create<MapFilterState>()(
  persist(
    (set, get) => ({
      draftLocation: null,
      draftCategory: "",
      draftMaxPrice: "",
      appliedLocation: null,
      appliedCategory: "",
      appliedMaxPrice: null,
      filtersAppliedCount: 0,

      setDraftLocation: (location) => set({ draftLocation: location }),

      setDraftCategory: (category) => set({ draftCategory: category }),

      setDraftMaxPrice: (price) => set({ draftMaxPrice: price }),

      syncDraftFromApplied: () => {
        const state = get();
        set({
          draftLocation: state.appliedLocation,
          draftCategory: state.appliedCategory,
          draftMaxPrice:
            state.appliedMaxPrice != null
              ? formatPriceInput(state.appliedMaxPrice)
              : "",
        });
      },

      applyFilters: () => {
        const result = get().submitFilters();
        return result === "applied";
      },

      submitFilters: (options) => {
        const { draftCategory, draftLocation, draftMaxPrice } = get();

        if (
          options?.invalidPriceAttempt ||
          hasInvalidPriceInput(draftMaxPrice)
        ) {
          return "invalid_price";
        }

        if (!hasDraftFilterInput(draftCategory, draftLocation, draftMaxPrice)) {
          set((state) => ({
            draftLocation: null,
            draftCategory: "",
            draftMaxPrice: "",
            appliedLocation: null,
            appliedCategory: "",
            appliedMaxPrice: null,
            filtersAppliedCount: state.filtersAppliedCount + 1,
          }));
          return "cleared";
        }

        const parsedPrice = parsePrice(draftMaxPrice);

        set((state) => ({
          appliedLocation: draftLocation,
          appliedCategory: draftCategory.trim(),
          appliedMaxPrice: parsedPrice > 0 ? parsedPrice : null,
          filtersAppliedCount: state.filtersAppliedCount + 1,
        }));

        return "applied";
      },

      applyCategoryFromNavigation: (category) => {
        set((state) => ({
          appliedCategory: category,
          draftCategory: category,
          filtersAppliedCount: state.filtersAppliedCount + 1,
        }));
      },
    }),
    {
      name: "map-filter-storage",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<MapFilterState>;
        if (state.filtersAppliedCount == null) {
          state.filtersAppliedCount = 0;
        }
        return state as MapFilterState;
      },
    },
  ),
);
