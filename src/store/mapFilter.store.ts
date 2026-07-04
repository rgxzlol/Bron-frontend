import { create } from "zustand";
import { persist } from "zustand/middleware";
import { parsePrice } from "@/lib/formatPrice";

export type MapLocationFilter = "nearby" | "3-7" | "10-15";

type MapFilterState = {
  draftLocation: MapLocationFilter | null;
  draftCategory: string;
  draftMaxPrice: string;
  appliedLocation: MapLocationFilter | null;
  appliedCategory: string;
  appliedMaxPrice: number | null;
  setDraftLocation: (location: MapLocationFilter | null) => void;
  setDraftCategory: (category: string) => void;
  setDraftMaxPrice: (price: string) => void;
  applyFilters: () => boolean;
  syncDraftFromApplied: () => void;
};

export const useMapFilterStore = create<MapFilterState>()(
  persist(
    (set, get) => ({
      draftLocation: null,
      draftCategory: "",
      draftMaxPrice: "",
      appliedLocation: null,
      appliedCategory: "",
      appliedMaxPrice: null,

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
              ? String(state.appliedMaxPrice)
              : "",
        });
      },

      applyFilters: () => {
        const { draftCategory, draftLocation, draftMaxPrice } = get();
        if (!draftCategory.trim()) return false;

        const parsedPrice = parsePrice(draftMaxPrice);

        set({
          appliedLocation: draftLocation,
          appliedCategory: draftCategory,
          appliedMaxPrice: parsedPrice > 0 ? parsedPrice : null,
        });

        return true;
      },
    }),
    {
      name: "map-filter-storage",
      version: 1,
    },
  ),
);
