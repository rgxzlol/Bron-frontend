import type { SavedBusiness } from "@/store/business.store";
import { resolveMediaUrl } from "@/lib/api/media";

const GALLERY_SIZE = 6;
export const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
export const MAX_PROFILE_IMAGE_DIMENSION = 800;

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif)$/i;

export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXTENSION_PATTERN.test(file.name);
}

export type ProfileImageValidationResult =
  | { ok: true; dataUrl: string }
  | { ok: false; errorKey: "imageType" | "imageSize" | "imageDimensions" | "imageReadFailed" };

export async function validateProfileImageFile(
  file: File,
): Promise<ProfileImageValidationResult> {
  if (!isImageFile(file)) {
    return { ok: false, errorKey: "imageType" };
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    return { ok: false, errorKey: "imageSize" };
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ width: image.width, height: image.height });
      image.onerror = () => reject(new Error("image-load-failed"));
      image.src = objectUrl;
    });

    if (
      dimensions.width > MAX_PROFILE_IMAGE_DIMENSION ||
      dimensions.height > MAX_PROFILE_IMAGE_DIMENSION
    ) {
      return { ok: false, errorKey: "imageDimensions" };
    }
  } catch {
    return { ok: false, errorKey: "imageReadFailed" };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const dataUrl = await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  if (!dataUrl) {
    return { ok: false, errorKey: "imageReadFailed" };
  }

  return { ok: true, dataUrl };
}

export async function validateGalleryImageFile(
  file: File,
): Promise<ProfileImageValidationResult> {
  if (!isImageFile(file)) {
    return { ok: false, errorKey: "imageType" };
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    return { ok: false, errorKey: "imageSize" };
  }

  const dataUrl = await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  if (!dataUrl) {
    return { ok: false, errorKey: "imageReadFailed" };
  }

  return { ok: true, dataUrl };
}

export function collectBusinessPhotoUrls(business: {
  profilePhoto?: string | null;
  gallery?: (string | null)[];
  services?: { photo?: string | null }[];
}): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const add = (url?: string | null) => {
    const resolved = resolveMediaUrl(url);
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    urls.push(resolved);
  };

  add(business.profilePhoto);
  business.gallery?.forEach(add);
  business.services?.forEach((service) => add(service.photo));

  return urls;
}

export function photosToGallerySlots(
  photos: string[],
  includeProfileInGallery = false,
): (string | null)[] {
  const slots = Array<string | null>(GALLERY_SIZE).fill(null);
  const galleryPhotos = includeProfileInGallery ? photos : photos.slice(1);

  galleryPhotos.slice(0, GALLERY_SIZE).forEach((photo, index) => {
    slots[index] = photo;
  });

  return slots;
}

export function mergeServiceLists(
  fromApi: SavedBusiness["services"],
  existing: SavedBusiness["services"],
): SavedBusiness["services"] {
  if (fromApi.length === 0) return existing;
  if (existing.length === 0) return fromApi;

  const apiIds = new Set(fromApi.map((item) => item.id));
  const localOnly = existing.filter((item) => !apiIds.has(item.id));
  return [...fromApi, ...localOnly];
}

export function mergeBusinessFromApi(
  fromApi: SavedBusiness,
  existing?: SavedBusiness,
): SavedBusiness {
  if (!existing) return fromApi;

  const coords = hasValidCoords(fromApi)
    ? { lat: fromApi.lat, lng: fromApi.lng }
    : hasValidCoords(existing)
      ? { lat: existing.lat, lng: existing.lng }
      : { lat: fromApi.lat, lng: fromApi.lng };

  const apiPhotos = collectBusinessPhotoUrls({
    ...fromApi,
    profilePhoto: resolveMediaUrl(fromApi.profilePhoto),
    services: fromApi.services,
  });
  const existingPhotos = collectBusinessPhotoUrls(existing);
  const remoteApiPhotos = apiPhotos.filter((photo) => photo.startsWith("http"));
  const photos =
    remoteApiPhotos.length > 0
      ? [
          ...remoteApiPhotos,
          ...existingPhotos.filter((photo) => photo.startsWith("data:")),
        ]
      : existingPhotos.length > 0
        ? existingPhotos
        : apiPhotos;

  return {
    ...fromApi,
    lat: coords.lat,
    lng: coords.lng,
    profilePhoto: photos[0] ?? resolveMediaUrl(fromApi.profilePhoto) ?? existing.profilePhoto,
    gallery: photosToGallerySlots(photos),
    website: existing.website || fromApi.website,
    description: fromApi.description || existing.description,
    services: mergeServiceLists(fromApi.services, existing.services),
    bookingRequests:
      fromApi.bookingRequests.length > 0
        ? fromApi.bookingRequests
        : existing.bookingRequests,
  };
}

function hasValidCoords(item: { lat: unknown; lng: unknown }) {
  const lat = typeof item.lat === "number" ? item.lat : Number(item.lat);
  const lng = typeof item.lng === "number" ? item.lng : Number(item.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}
