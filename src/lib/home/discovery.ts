import {
  branchesApi,
  businessesApi,
  categoriesApi,
  servicesApi,
  workingHoursApi,
} from "@/lib/api";
import { assets } from "@/lib/assets";
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
import { ShopsPlace } from "@/data/shops";
import { canShowBusinessOnMap } from "@/lib/map/mapVisibility";
import type { SearchCatalogItem } from "@/lib/search/catalog";
import type { Category } from "@/types/category";
import type { PopularPlace } from "@/types/popular";
import type { ShopsType } from "@/types/shops.types";
import type { SavedBusiness } from "@/store/business.store";

const POPULAR_LIMIT = 3;

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
  try {
    const businesses = await fetchPublicBusinessesFromApi();
    const mappableBusinesses = businesses.filter(canShowBusinessOnMap);

    if (mappableBusinesses.length === 0) return [];

    const places = mappableBusinesses
      .slice(0, POPULAR_LIMIT)
      .map((business) => {
        return savedBusinessToPopularPlace(business, assets.popular.photo1);
      })
      .filter((place) => place.shopId != null);

    return places;
  } catch {
    return [];
  }
}

export async function fetchCategoriesWithCounts(): Promise<Category[]> {
  try {
    const apiCategories = await categoriesApi.list();
    if (apiCategories.length === 0) return staticCategories;

    return staticCategories.map((category) => {
      const target = getHomeCategoryMapTarget(category.id);
      const match = apiCategories.find(
        (item) =>
          target != null &&
          apiCategoryToUi(item.slug) === target.businessCategory,
      );
      return {
        ...category,
        count: match?.business_count ?? 0,
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
        business.description?.trim() ||
        business.address ||
        apiCategoryToUi(business.category),
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
