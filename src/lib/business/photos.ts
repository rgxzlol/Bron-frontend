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
  return normalizeBusinessImageFile(file);
}

export async function validateGalleryImageFile(
  file: File,
): Promise<ProfileImageValidationResult> {
  return normalizeBusinessImageFile(file);
}

async function readFileAsDataUrl(file: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function normalizeBusinessImageFile(
  file: File,
): Promise<ProfileImageValidationResult> {
  if (!isImageFile(file)) {
    return { ok: false, errorKey: "imageType" };
  }

  const objectUrl = URL.createObjectURL(file);
  let image: HTMLImageElement;

  try {
    image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const loadedImage = new window.Image();
      loadedImage.onload = () => resolve(loadedImage);
      loadedImage.onerror = () => reject(new Error("image-load-failed"));
      loadedImage.src = objectUrl;
    });
  } catch {
    URL.revokeObjectURL(objectUrl);
    return { ok: false, errorKey: "imageReadFailed" };
  }

  URL.revokeObjectURL(objectUrl);

  const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (
    image.naturalWidth <= MAX_PROFILE_IMAGE_DIMENSION &&
    image.naturalHeight <= MAX_PROFILE_IMAGE_DIMENSION &&
    file.size <= MAX_PROFILE_IMAGE_SIZE &&
    supportedTypes.has(file.type.toLowerCase())
  ) {
    const dataUrl = await readFileAsDataUrl(file);
    return dataUrl
      ? { ok: true, dataUrl }
      : { ok: false, errorKey: "imageReadFailed" };
  }

  const scale = Math.min(
    1,
    MAX_PROFILE_IMAGE_DIMENSION / image.naturalWidth,
    MAX_PROFILE_IMAGE_DIMENSION / image.naturalHeight,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return { ok: false, errorKey: "imageReadFailed" };
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const preferredType = supportedTypes.has(file.type.toLowerCase())
    ? file.type.toLowerCase()
    : "image/jpeg";
  let blob = await canvasToBlob(canvas, preferredType);

  if (!blob || blob.size > MAX_PROFILE_IMAGE_SIZE) {
    for (const quality of [0.82, 0.65, 0.5, 0.35]) {
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
      if (blob && blob.size <= MAX_PROFILE_IMAGE_SIZE) break;
    }
  }

  if (!blob || blob.size > MAX_PROFILE_IMAGE_SIZE) {
    return { ok: false, errorKey: "imageSize" };
  }

  const dataUrl = await readFileAsDataUrl(blob);
  return dataUrl
    ? { ok: true, dataUrl }
    : { ok: false, errorKey: "imageReadFailed" };
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

  const galleryPhotos = [
    ...fromApi.gallery.filter((photo): photo is string =>
      Boolean(photo?.startsWith("http")),
    ),
    ...existing.gallery.filter((photo): photo is string =>
      Boolean(photo?.startsWith("data:")),
    ),
  ];

  return {
    ...fromApi,
    lat: coords.lat,
    lng: coords.lng,
    profilePhoto:
      resolveMediaUrl(fromApi.profilePhoto) ??
      (existing.profilePhoto?.startsWith("data:") ? existing.profilePhoto : null),
    gallery: photosToGallerySlots(galleryPhotos, true),
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
