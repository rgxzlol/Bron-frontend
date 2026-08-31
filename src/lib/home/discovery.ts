import { assets } from "@/lib/assets";
import { branchesApi, businessesApi, servicesApi, workingHoursApi } from "@/lib/api";
import { fetchPublicBusinessesFromApi } from "@/lib/api/businessSync";
import {
  apiBusinessToShop,
  apiCategoryToUi,
  apiServiceListItemToBusinessService,
} from "@/lib/api/mappers";
import { fetchBusinessGalleryUrls } from "@/lib/api/mediaUpload";
import { resolveMediaUrl } from "@/lib/api/media";
import { workingHoursToRangeString } from "@/lib/booking/timeSlots";
import { getHomeCategoryMapTarget } from "@/lib/category/homeCategoryMap";
import { categories as staticCategories } from "@/data/categories";
import { popularPlaces as fallbackPopularPlaces } from "@/data/popular";
import { ShopsPlace } from "@/data/shops";
import { canShowBusinessOnMap, canShowShopOnMap } from "@/lib/map/mapVisibility";
import type { SearchCatalogItem } from "@/lib/search/catalog";
import type { Category } from "@/types/category";
import type { PopularPlace } from "@/types/popular";
import type { ShopsType } from "@/types/shops.types";
import type { SavedBusiness } from "@/store/business.store";

const POPULAR_LIMIT = 3;

function fallbackPlacesWithMapMarkers(): PopularPlace[] {
  const mappableShopIds = new Set(
    ShopsPlace.filter(canShowShopOnMap).map((shop) => shop.id),
  );

  return fallbackPopularPlaces.filter(
    (place) => place.shopId != null && mappableShopIds.has(place.shopId),
  );
}

function savedBusinessToPopularPlace(
  business: SavedBusiness,
  fallbackImage: PopularPlace["img"],
): PopularPlace {
  const remoteImage =
    resolveMediaUrl(business.profilePhoto) ??
    business.gallery.map((url) => resolveMediaUrl(url)).find(Boolean) ??
    null;

  const businessId = Number.parseInt(business.id, 10);

  return {
    id: Number.isFinite(businessId) ? businessId : 0,
    shopId: Number.isFinite(businessId) ? businessId : undefined,
    title: business.name,
    rating: 0,
    reviews: 0,
    time: 60,
    desc: business.description?.trim() || business.address || business.category,
    img: remoteImage ?? fallbackImage,
  };
}

export async function fetchPopularPlaces(): Promise<PopularPlace[]> {
  const fallback = fallbackPlacesWithMapMarkers();

  try {
    const businesses = await fetchPublicBusinessesFromApi();
    const mappableBusinesses = businesses.filter(canShowBusinessOnMap);

    if (mappableBusinesses.length === 0) {
      return fallback;
    }

    const places = mappableBusinesses
      .slice(0, POPULAR_LIMIT)
      .map((business) => {
        const fallbackImage =
          fallback.find((place) => place.id === Number(business.id))?.img ??
          fallback[0]?.img ??
          assets.popular.photo1;

        return savedBusinessToPopularPlace(business, fallbackImage);
      })
      .filter((place) => place.shopId != null);

    return places.length > 0 ? places : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchCategoriesWithCounts(): Promise<Category[]> {
  try {
    const businesses = await businessesApi.list();
    if (businesses.length === 0) return staticCategories;

    const counts = new Map(staticCategories.map((category) => [category.id, 0]));

    for (const business of businesses) {
      const uiCategory = apiCategoryToUi(business.category);

      for (const category of staticCategories) {
        const target = getHomeCategoryMapTarget(category.id);
        if (target?.businessCategory === uiCategory) {
          counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
        }
      }
    }

    return staticCategories.map((category) => {
      const count = counts.get(category.id) ?? 0;
      return {
        ...category,
        count: count > 0 ? count : category.count,
      };
    });
  } catch {
    return staticCategories;
  }
}

export async function searchBusinessesFromApi(
  query: string,
): Promise<SearchCatalogItem[]> {
  try {
    const results = await businessesApi.search(query);
    return results.map((business) => ({
      id: `api-business-${business.id}`,
      title: business.name,
      description:
        business.description?.trim() || business.address || business.category,
      shopId: business.id,
      keywords: [],
    }));
  } catch {
    return [];
  }
}

export async function resolveShopById(shopId: number): Promise<ShopsType | null> {
  const mockShop = ShopsPlace.find((shop) => shop.id === shopId);
  if (mockShop) return mockShop;

  try {
    const [business, services, branches] = await Promise.all([
      businessesApi.get(shopId),
      servicesApi.listByBusiness(shopId).catch(() => []),
      branchesApi.listByBusiness(shopId).catch(() => []),
    ]);

    const branchId = branches[0]?.id;
    const branch = branchId
      ? await branchesApi.get(branchId).catch(() => null)
      : null;

    const mappedServices = services.map(apiServiceListItemToBusinessService);
    const shop = apiBusinessToShop(business, mappedServices, branchId, branch);
    const [workingHours, galleryUrls] = await Promise.all([
      workingHoursApi.getByBusiness(shopId).catch(() => []),
      fetchBusinessGalleryUrls(shopId).catch(() => []),
    ]);
    const todayHours = workingHoursToRangeString(workingHours, new Date());
    const remoteGallery = galleryUrls
      .map((url) => resolveMediaUrl(url))
      .filter((url): url is string => Boolean(url));

    return {
      ...shop,
      hours: todayHours ?? shop.hours,
      gallery: remoteGallery.length > 0 ? remoteGallery : shop.gallery,
      img: remoteGallery[0] ?? shop.img,
    };
  } catch {
    return null;
  }
}
