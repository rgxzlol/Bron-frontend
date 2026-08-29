import { apiRequest } from "./client";
import type { Favorite, FavoriteCreate } from "./types";

export const favoritesApi = {
  list: (token?: string) =>
    apiRequest<Favorite[]>("/favorites/", { auth: true, token }),

  add: (body: FavoriteCreate, token?: string) =>
    apiRequest<Favorite>("/favorites/", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  remove: (favoriteId: number, token?: string) =>
    apiRequest<unknown>(`/favorites/${favoriteId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
