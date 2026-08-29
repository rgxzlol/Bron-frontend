import { apiRequest } from "./client";
import type { Review, ReviewCreate, ReviewUpdate } from "./types";

export const reviewsApi = {
  create: (body: ReviewCreate, token?: string) =>
    apiRequest<Review>("/reviews/", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  listByBusiness: (businessId: number) =>
    apiRequest<Review[]>(`/reviews/business/${businessId}`),

  update: (reviewId: number, body: ReviewUpdate, token?: string) =>
    apiRequest<Review>(`/reviews/${reviewId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  remove: (reviewId: number, token?: string) =>
    apiRequest<unknown>(`/reviews/${reviewId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
