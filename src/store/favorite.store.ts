import { create } from "zustand";
import { favoritesApi } from "@/lib/api";
import type { Favorite } from "@/lib/api/types";
import { getAuthToken } from "@/lib/api/token";

type FavoriteState = {
  favorites: Favorite[];
  isLoading: boolean;
  error: string | null;
  fetchFavorites: () => Promise<void>;
  addFavorite: (businessId: number) => Promise<void>;
  removeFavorite: (favoriteId: number) => Promise<void>;
  toggleFavorite: (businessId: number) => Promise<void>;
  isFavorite: (businessId: number) => boolean;
  getFavoriteId: (businessId: number) => number | null;
};

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  isLoading: false,
  error: null,

  fetchFavorites: async () => {
    if (!getAuthToken()) {
      set({ favorites: [], isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const favorites = await favoritesApi.list();
      set({ favorites, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Не удалось загрузить избранное",
      });
    }
  },

  addFavorite: async (businessId) => {
    const favorite = await favoritesApi.add({ business_id: businessId });
    set((state) => ({
      favorites: [
        favorite,
        ...state.favorites.filter((item) => item.business_id !== businessId),
      ],
    }));
  },

  removeFavorite: async (favoriteId) => {
    await favoritesApi.remove(favoriteId);
    set((state) => ({
      favorites: state.favorites.filter((item) => item.id !== favoriteId),
    }));
  },

  toggleFavorite: async (businessId) => {
    const existing = get().favorites.find((item) => item.business_id === businessId);
    if (existing) {
      await get().removeFavorite(existing.id);
      return;
    }

    await get().addFavorite(businessId);
  },

  isFavorite: (businessId) =>
    get().favorites.some((item) => item.business_id === businessId),

  getFavoriteId: (businessId) =>
    get().favorites.find((item) => item.business_id === businessId)?.id ?? null,
}));
