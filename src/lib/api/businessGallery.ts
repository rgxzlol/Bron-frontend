import { apiUploadRequest, apiRequest } from "./client";
import { assertApiImage } from "./media";
import type { BusinessGalleryImage } from "./types";

export const businessGalleryApi = {
  listByBusiness: (businessId: number) =>
    apiRequest<import("./types").BusinessGalleryImage[]>(
      `/business-gallery/business/${businessId}`,
    ),

  upload: (businessId: number, image: File | Blob, token?: string) => {
    assertApiImage(image);
    const formData = new FormData();
    formData.append("image", image);
    return apiUploadRequest<BusinessGalleryImage>(
      `/business-gallery/upload/${businessId}`,
      formData,
      { auth: true, token },
    );
  },

  update: (
    imageId: number,
    fields: { image?: File | Blob; sortOrder?: number },
    token?: string,
  ) => {
    if (!fields.image && fields.sortOrder == null) {
      throw new Error("Для обновления фото укажите изображение или порядок.");
    }
    if (fields.image) assertApiImage(fields.image);
    const formData = new FormData();
    if (fields.image) formData.append("image", fields.image);
    if (fields.sortOrder != null) {
      formData.append("sort_order", String(fields.sortOrder));
    }
    return apiUploadRequest<BusinessGalleryImage>(
      `/business-gallery/${imageId}`,
      formData,
      { method: "PUT", auth: true, token },
    );
  },

  remove: (imageId: number, token?: string) =>
    apiRequest<unknown>(`/business-gallery/${imageId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
