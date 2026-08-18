import type { SavedBusiness } from "@/store/business.store";
import { resolveMediaUrl } from "@/lib/api/media";

const GALLERY_SIZE = 6;

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
    services: fromApi.services.length > 0 ? fromApi.services : existing.services,
  };
}

function hasValidCoords(item: { lat: unknown; lng: unknown }) {
  const lat = typeof item.lat === "number" ? item.lat : Number(item.lat);
  const lng = typeof item.lng === "number" ? item.lng : Number(item.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}
