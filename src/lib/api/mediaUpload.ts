import {
  businessGalleryApi,
  businessesApi,
} from "@/lib/api";
import { getAuthToken } from "@/lib/api/token";
import { resolveMediaUrl } from "@/lib/api/media";
import type { BusinessDraft } from "@/store/business.store";

export function dataUrlToFile(dataUrl: string, filename: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: mimeType });
}

export async function syncBusinessMediaFromDraft(
  businessId: number,
  draft: BusinessDraft,
) {
  const token = getAuthToken();
  if (!token) return;

  const [business, gallery] = await Promise.all([
    businessesApi.get(businessId),
    businessGalleryApi.listByBusiness(businessId),
  ]);

  if (!draft.profilePhoto && business.logo) {
    await businessesApi.deleteLogo(businessId, token);
  }

  const retainedGallery = new Set(
    draft.gallery
      .filter((photo): photo is string => Boolean(photo && !photo.startsWith("data:")))
      .map((photo) => resolveMediaUrl(photo))
      .filter((photo): photo is string => photo != null),
  );
  await Promise.all(
    gallery
      .filter((image) => !retainedGallery.has(resolveMediaUrl(image.image) ?? image.image))
      .map((image) => businessGalleryApi.remove(image.id, token)),
  );

  if (draft.profilePhoto?.startsWith("data:")) {
    const file = dataUrlToFile(draft.profilePhoto, "logo.png");
    if (!file) throw new Error("Не удалось обработать логотип бизнеса.");
    await businessesApi.uploadLogo(businessId, file, token);
  }

  const uploads = draft.gallery
    .map((photo, index) => {
      if (!photo?.startsWith("data:")) return null;
      const file = dataUrlToFile(photo, `gallery-${index + 1}.png`);
      return file ? businessGalleryApi.upload(businessId, file, token) : null;
    })
    .filter((promise): promise is ReturnType<typeof businessGalleryApi.upload> => promise != null);

  await Promise.all(uploads);
}

export async function fetchBusinessGalleryUrls(businessId: number) {
  const items = await businessGalleryApi.listByBusiness(businessId).catch(() => []);
  return items
    .map((item) => item.image)
    .filter((image): image is string => Boolean(image?.trim()));
}
