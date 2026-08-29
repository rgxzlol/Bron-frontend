import { businessesApi } from "./businesses";
import { getCurrentUserId } from "./businessSync";
import type { Business, BusinessApplication, BusinessApplicationCreate } from "./types";

function mapBusinessToApplication(business: Business): BusinessApplication {
  return {
    id: business.id,
    user_id: business.owner_id,
    company_name: business.name,
    sphere: business.category,
    location: business.address,
    phone: business.phone,
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
      } catch {
        return null;
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
    const business = await businessesApi.create(
      {
        name: body.company_name,
        category: body.sphere,
        address: body.location,
        phone: body.phone,
      },
      token,
    );

    if (!business) {
      const owned = await fetchOwnedBusinesses();
      const latest = owned.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

      if (!latest) return null;
      return mapBusinessToApplication(latest);
    }

    return mapBusinessToApplication(business);
  },
};
