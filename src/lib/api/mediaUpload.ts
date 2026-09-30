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

function getImageExtension(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/png") return "png";
  return null;
}

export async function syncBusinessMediaFromDraft(
  businessId: number,
  draft: BusinessDraft,
) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Войдите в аккаунт, чтобы изменить фотографии бизнеса.");
  }

  const [business, gallery] = await Promise.all([
    businessesApi.get(businessId),
    businessGalleryApi.listByBusiness(businessId),
  ]);

  const orderedGallery = [...gallery].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
  const galleryByUrl = new Map(
    orderedGallery.map((image) => [
      resolveMediaUrl(image.image) ?? image.image,
      image,
    ]),
  );
  const galleryByOrder = new Map(
    orderedGallery.map((image) => [image.sort_order, image]),
  );
  const retainedIds = new Set<number>();
  const pendingOrderUpdates: { id: number; sortOrder: number }[] = [];
  const replacements: Promise<unknown>[] = [];
  if (draft.profilePhoto?.startsWith("data:")) {
    const mimeType = draft.profilePhoto.match(/^data:([^;]+);base64,/)?.[1];
    const extension = mimeType ? getImageExtension(mimeType) : null;
    const file = extension
      ? dataUrlToFile(draft.profilePhoto, `logo.${extension}`)
      : null;
    if (!file) throw new Error("Формат фотографии профиля не поддерживается.");
    replacements.push(businessesApi.uploadLogo(businessId, file, token));
  }

  const galleryOperations = draft.gallery.map(async (photo, index) => {
    if (!photo) return;

    if (photo.startsWith("data:")) {
      const mimeType = photo.match(/^data:([^;]+);base64,/)?.[1];
      const extension = mimeType ? getImageExtension(mimeType) : null;
      const file = extension
        ? dataUrlToFile(photo, `gallery-${index + 1}.${extension}`)
        : null;
      if (!file) throw new Error("Формат фотографии галереи не поддерживается.");

      const previous = galleryByOrder.get(index);
      if (previous) {
        const replaced = await businessGalleryApi.update(
          previous.id,
          { image: file, sortOrder: index },
          token,
        );
        retainedIds.add(replaced.id);
      } else {
        const uploaded = await businessGalleryApi.upload(businessId, file, token);
        retainedIds.add(uploaded.id);
        if (uploaded.sort_order !== index) {
          pendingOrderUpdates.push({ id: uploaded.id, sortOrder: index });
        }
      }
      return;
    }

    const existing = galleryByUrl.get(resolveMediaUrl(photo) ?? photo);
    if (!existing) {
      throw new Error("Не удалось сопоставить фотографию галереи с сервером.");
    }
    retainedIds.add(existing.id);
    if (existing.sort_order !== index) {
      pendingOrderUpdates.push({ id: existing.id, sortOrder: index });
    }
  });

  await Promise.all([...replacements, ...galleryOperations]);

  await Promise.all(
    pendingOrderUpdates.map(({ id, sortOrder }) =>
      businessGalleryApi.update(id, { sortOrder }, token),
    ),
  );

  if (!draft.profilePhoto && business.logo) {
    await businessesApi.deleteLogo(businessId, token);
  }

  await Promise.all(
    orderedGallery
      .filter(
        (image) => image.sort_order < 6 && !retainedIds.has(image.id),
      )
      .map((image) => businessGalleryApi.remove(image.id, token)),
  );
}

export async function fetchBusinessGalleryUrls(businessId: number) {
  const items = await businessGalleryApi.listByBusiness(businessId);
  return [...items]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item) => item.image)
    .filter((image): image is string => Boolean(image?.trim()));
}
