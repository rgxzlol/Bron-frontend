import { apiRequest } from "./client";
import type {
  Product,
  ProductCreate,
  ProductListItem,
  ProductUpdate,
} from "./types";

export const productsApi = {
  list: () => apiRequest<ProductListItem[]>("/products/"),

  get: (productId: number) =>
    apiRequest<Product>(`/products/${productId}`),

  listByBusiness: (businessId: number) =>
    apiRequest<ProductListItem[]>(`/products/business/${businessId}`),

  create: (body: ProductCreate, token?: string) =>
    apiRequest<Product>("/products/create", {
      method: "POST",
      body,
      auth: true,
      token,
    }),

  update: (productId: number, body: ProductUpdate, token?: string) =>
    apiRequest<Product>(`/products/${productId}`, {
      method: "PUT",
      body,
      auth: true,
      token,
    }),

  remove: (productId: number, token?: string) =>
    apiRequest<unknown>(`/products/${productId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
