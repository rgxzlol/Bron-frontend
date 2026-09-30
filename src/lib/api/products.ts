import { apiRequest, apiUploadRequest } from "./client";
import type {
  Product,
  ProductCreate,
  ProductListItem,
  ProductUpdate,
} from "./types";
import { assertApiImage } from "./media";

export const productsApi = {
  list: () => apiRequest<ProductListItem[]>("/products"),

  get: (productId: number) =>
    apiRequest<Product>(`/products/${productId}`),

  listByBusiness: (businessId: number) =>
    apiRequest<ProductListItem[]>(`/products/business/${businessId}`),

  search: (query: string) =>
    apiRequest<ProductListItem[]>(
      `/products/search?q=${encodeURIComponent(query)}`,
    ),

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

  uploadImage: (productId: number, image: File | Blob, token?: string) => {
    assertApiImage(image);
    const formData = new FormData();
    formData.append("image", image);
    return apiUploadRequest<Product>(
      `/products/${productId}/image`,
      formData,
      { auth: true, token },
    );
  },

  deleteImage: (productId: number, token?: string) =>
    apiRequest<Product>(`/products/${productId}/image`, {
      method: "DELETE",
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
