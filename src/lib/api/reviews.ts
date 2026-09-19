import { apiRequest } from "./client";
import type {
  CustomerRating,
  CustomerReviewCreate,
  Review,
  ReviewCreate,
  ReviewUpdate,
} from "./types";

export const reviewsApi = {
  create: (body: ReviewCreate, token?: string) =>
    apiRequest<Review>("/reviews", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  listByBusiness: (businessId: number) =>
    apiRequest<Review[]>(`/reviews/business/${businessId}`),

  createForCustomer: (
    customerId: number,
    body: CustomerReviewCreate,
    token?: string,
  ) =>
    apiRequest<Review>(`/reviews/customer/${customerId}`, {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  listByCustomer: (customerId: number, token?: string) =>
    apiRequest<Review[]>(`/reviews/customer/${customerId}`, {
      auth: true,
      token,
    }),

  getCustomerRating: (customerId: number, token?: string) =>
    apiRequest<CustomerRating>(`/reviews/customer/${customerId}/rating`, {
      auth: true,
      token,
    }),

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

  updateCustomerReview: (reviewId: number, body: ReviewUpdate, token?: string) =>
    apiRequest<Review>(`/reviews/${reviewId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  removeCustomerReview: (reviewId: number, token?: string) =>
    apiRequest<unknown>(`/reviews/${reviewId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
