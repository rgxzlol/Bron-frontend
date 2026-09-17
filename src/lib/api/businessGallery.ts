import { apiUploadRequest, apiRequest } from "./client";

export const businessGalleryApi = {
  listByBusiness: (businessId: number) =>
    apiRequest<import("./types").BusinessGalleryImage[]>(
      `/business-gallery/business/${businessId}`,
    ),

  upload: (businessId: number, image: File | Blob, token?: string) => {
    const formData = new FormData();
    formData.append("image", image);
    return apiUploadRequest<import("./types").BusinessGalleryImage>(
      `/business-gallery/upload/${businessId}`,
      formData,
      { auth: true, token },
    );
  },

  remove: (imageId: number, token?: string) =>
    apiRequest<unknown>(`/business-gallery/${imageId}`, {
      method: "DELETE",
      auth: true,
      token,
    }),
};
