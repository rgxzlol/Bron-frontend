import { businessesApi } from "./businesses";
import { categoriesApi } from "./categories";
import { getCurrentUserId } from "./businessSync";
import { ApiError } from "./client";
import type { Business, BusinessApplication, BusinessApplicationCreate } from "./types";

function mapBusinessToApplication(business: Business): BusinessApplication {
  return {
    id: business.id,
    user_id: business.owner_id,
    company_name: business.name,
    tin: business.tin,
    sphere:
      typeof business.category === "string"
        ? business.category
        : business.category.slug,
    location: business.address,
    phone: business.phone,
    description: business.description,
    latitude: business.latitude,
    longitude: business.longitude,
    website: business.website,
    social_links: business.social_links,
    comments: business.comments,
    email: business.email,
    owner_name: business.owner_name,
    category_id:
      typeof business.category === "string"
        ? null
        : business.category.id,
    status: business.status ?? "pending",
    created_at: business.created_at,
  };
}

async function fetchOwnedBusinesses() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const list = await businessesApi.list();
  const owned = await Promise.all(
    list.map(async (item) => {
      try {
        const detail = await businessesApi.get(item.id);
        return detail.owner_id === userId ? detail : null;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
          return null;
        }
        throw error;
      }
    }),
  );

  return owned.filter((item): item is Business => item != null);
}

export const businessApplicationsApi = {
  getMy: async () => {
    const owned = await fetchOwnedBusinesses();
    if (owned.length === 0) return null;

    const latest = owned.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

    return mapBusinessToApplication(latest);
  },

  create: async (body: BusinessApplicationCreate, token?: string) => {
    const categories = await categoriesApi.list();
    const category = categories.find((item) => item.id === body.category_id);

    if (!category) {
      throw new ApiError(404, "Выбранная категория больше недоступна.");
    }

    const userId = await getCurrentUserId();
    if (userId == null) {
      throw new ApiError(401, "Не удалось определить пользователя. Войдите снова.");
    }

    const result = await businessesApi.create(body, token);

    return {
      id: result.business_id,
      user_id: userId,
      company_name: body.name,
      tin: body.tin,
      sphere: category.slug,
      location: body.address,
      phone: body.phone,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
      website: body.website,
      social_links: body.social_links,
      comments: body.comments,
      email: body.email,
      owner_name: body.owner_name,
      category_id: category.id,
      status: "pending",
      created_at: new Date().toISOString(),
    } satisfies BusinessApplication;
  },
};
