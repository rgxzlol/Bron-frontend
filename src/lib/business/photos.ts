import type { SavedBusiness } from "@/store/business.store";

const GALLERY_SIZE = 6;

export function collectBusinessPhotoUrls(business: {
  profilePhoto?: string | null;
  gallery?: (string | null)[];
  services?: { photo?: string | null }[];
}): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const add = (url?: string | null) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
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

  const existingPhotos = collectBusinessPhotoUrls(existing);
  const apiPhotos = collectBusinessPhotoUrls(fromApi);
  const photos =
    existingPhotos.length >= apiPhotos.length ? existingPhotos : apiPhotos;

  return {
    ...fromApi,
    lat: coords.lat,
    lng: coords.lng,
    profilePhoto: photos[0] ?? fromApi.profilePhoto ?? existing.profilePhoto,
    gallery: photosToGallerySlots(photos),
    website: existing.website || fromApi.website,
    description: fromApi.description || existing.description,
  };
}

function hasValidCoords(item: { lat: unknown; lng: unknown }) {
  const lat = typeof item.lat === "number" ? item.lat : Number(item.lat);
  const lng = typeof item.lng === "number" ? item.lng : Number(item.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}
