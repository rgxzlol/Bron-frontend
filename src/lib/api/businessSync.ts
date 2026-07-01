import {
  authApi,
  bookingsApi,
  branchesApi,
  businessesApi,
  productsApi,
  servicesApi,
  workingHoursApi,
} from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import {
  apiBookingToBusinessBookingRequest,
  apiBusinessToSavedBusiness,
  apiProductToBusinessService,
  apiServiceToBusinessService,
  draftToBusinessCreate,
  draftToBusinessUpdate,
  resolveApiBusinessCoords,
  scheduleToWorkingHoursPayload,
  workingHoursToSchedule,
} from "@/lib/api/mappers";
import { getAuthToken } from "@/lib/api/token";
import { geocodeAddress, hasValidCoords, resolveDraftCoords } from "@/lib/geocoding";
import type { BusinessDraft, BusinessService, SavedBusiness, BusinessBookingRequest } from "@/store/business.store";
import type { Branch, Business as ApiBusiness } from "@/lib/api/types";

async function resolveCoordsForBusiness(
  business: ApiBusiness,
  branch?: Pick<Branch, "address" | "latitude" | "longitude"> | null,
): Promise<{ lat: number; lng: number }> {
  const direct = resolveApiBusinessCoords(business, branch);
  if (hasValidCoords(direct)) return direct;

  const address = branch?.address?.trim() || business.address?.trim();
  if (!address) return direct;

  try {
    const geocoded = await geocodeAddress(address);
    return { lat: geocoded.lat, lng: geocoded.lng };
  } catch {
    return direct;
  }
}

async function loadBusinessBookings(businessId: number, services: BusinessService[]) {
  const token = getAuthToken();
  if (!token) return [];

  try {
    const bookings = await bookingsApi.listByBusiness(businessId, token);
    const serviceMap = new Map(services.map((service) => [service.id, service.name]));

    return bookings.map((booking) =>
      apiBookingToBusinessBookingRequest(
        booking,
        serviceMap.get(String(booking.service_id)) ?? "Услуга",
      ),
    );
  } catch {
    return [];
  }
}

async function loadBusinessStats(businessId: number) {
  const token = getAuthToken();
  if (!token) return undefined;

  try {
    return await businessesApi.stats(businessId, token);
  } catch {
    return undefined;
  }
}

async function loadBusinessDetails(businessId: number, withOwnerData = false) {
  const [business, services, products, branches, schedule] = await Promise.all([
    businessesApi.get(businessId),
    servicesApi.listByBusiness(businessId),
    productsApi.listByBusiness(businessId),
    branchesApi.listByBusiness(businessId),
    workingHoursApi.getByBusiness(businessId).catch(() => []),
  ]);

  const serviceItems = await Promise.all(
    services.map((item) => servicesApi.get(item.id)),
  );
  const productItems = await Promise.all(
    products.map((item) => productsApi.get(item.id)),
  );

  const mappedServices: BusinessService[] = [
    ...serviceItems.map(apiServiceToBusinessService),
    ...productItems.map(apiProductToBusinessService),
  ];

  const [ownerData, branchDetail] = await Promise.all([
    withOwnerData
      ? Promise.all([
          loadBusinessStats(businessId),
          loadBusinessBookings(businessId, mappedServices),
        ])
      : Promise.resolve<[undefined, BusinessBookingRequest[]]>([undefined, []]),
    branches[0]?.id
      ? branchesApi.get(branches[0].id).catch(() => null)
      : Promise.resolve(null),
  ]);

  const [stats, bookingRequests] = ownerData;

  const coords = await resolveCoordsForBusiness(business, branchDetail);

  return apiBusinessToSavedBusiness(business, {
    services: mappedServices,
    defaultBranchId: branches[0]?.id,
    schedule: workingHoursToSchedule(schedule),
    stats,
    bookingRequests,
    branch: branchDetail,
    coords,
  });
}

export async function fetchMyBusinessesFromApi(userId: number) {
  const list = await businessesApi.list();
  const owned = await Promise.all(
    list.map(async (item) => {
      const detail = await businessesApi.get(item.id);
      if (detail.owner_id !== userId) return null;
      return loadBusinessDetails(item.id, true);
    }),
  );

  return owned.filter((item): item is SavedBusiness => item != null);
}

export async function fetchPublicBusinessesFromApi() {
  try {
    const list = await businessesApi.list();
    return await Promise.all(list.map((item) => loadBusinessDetails(item.id)));
  } catch (error) {
    console.error("Не удалось загрузить бизнесы с API:", error);
    return [];
  }
}

async function syncWorkingHours(businessId: number, draft: BusinessDraft) {
  const token = getAuthToken();
  if (!token) return;

  const existing = await workingHoursApi.getByBusiness(businessId).catch(() => []);
  await Promise.all(
    existing.map((item) => workingHoursApi.remove(item.id, token).catch(() => undefined)),
  );

  const payload = scheduleToWorkingHoursPayload(businessId, draft.schedule);
  await Promise.all(payload.map((item) => workingHoursApi.create(item, token)));
}

async function ensureDefaultBranch(
  businessId: number,
  draft: BusinessDraft,
  coords: { lat: number; lng: number },
) {
  const token = getAuthToken();
  if (!token) return undefined;

  const branches = await branchesApi.listByBusiness(businessId);
  if (branches.length > 0) {
    await branchesApi.update(
      branches[0].id,
      {
        address: draft.address,
        phone: draft.phone,
        latitude: coords.lat,
        longitude: coords.lng,
      },
      token,
    );
    return branches[0].id;
  }

  const branch = await branchesApi.create(
    {
      business_id: businessId,
      name: draft.name || "Главный филиал",
      address: draft.address,
      phone: draft.phone,
      latitude: coords.lat,
      longitude: coords.lng,
    },
    token,
  );

  return branch.id;
}

async function resolveCreatedBusinessId(
  draft: BusinessDraft,
  userId: number,
): Promise<number> {
  const list = await businessesApi.list();
  const owned = await Promise.all(
    list.map(async (item) => {
      const detail = await businessesApi.get(item.id);
      return detail.owner_id === userId ? detail : null;
    }),
  );

  const mine = owned.filter((item): item is NonNullable<typeof item> => item != null);
  const byName = mine.find((item) => item.name === draft.name.trim());
  if (byName) return byName.id;

  if (mine.length === 0) {
    throw new Error("Бизнес создан, но не найден в списке");
  }

  return mine.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0].id;
}

export async function saveBusinessDraftToApi(
  draft: BusinessDraft,
  editingId: string | null,
) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Войдите в аккаунт, чтобы сохранить бизнес");
  }

  if (editingId && /^\d+$/.test(editingId)) {
    const businessId = Number(editingId);
    const coords = await resolveDraftCoords(draft);
    await businessesApi.update(
      businessId,
      draftToBusinessUpdate(draft, coords),
      token,
    );
    await syncWorkingHours(businessId, draft);
    await ensureDefaultBranch(businessId, draft, coords);
    return loadBusinessDetails(businessId);
  }

  const coords = await resolveDraftCoords(draft);
  const created = await businessesApi.create(
    draftToBusinessCreate(draft, coords),
    token,
  );

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Не удалось определить пользователя");
  }

  const businessId = created?.id ?? (await resolveCreatedBusinessId(draft, userId));

  await syncWorkingHours(businessId, draft);
  await ensureDefaultBranch(businessId, draft, coords);
  await businessesApi.update(
    businessId,
    draftToBusinessUpdate(draft, coords),
    token,
  );
  return loadBusinessDetails(businessId);
}

export async function removeBusinessFromApi(businessId: string) {
  const token = getAuthToken();
  if (!token || !/^\d+$/.test(businessId)) return;

  try {
    await businessesApi.remove(Number(businessId), token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return;
    }

    console.error("Ошибка удаления бизнеса:", error);
    throw error;
  }
}

export async function createServiceOnApi(
  businessId: string,
  service: Omit<BusinessService, "id" | "active" | "type">,
) {
  const token = getAuthToken();
  if (!token || !/^\d+$/.test(businessId)) return null;

  const created = await servicesApi.create(
    {
      business_id: Number(businessId),
      title: service.name,
      description: service.description,
      category: service.category,
      duration: 60,
      price: service.price,
    },
    token,
  );

  return apiServiceToBusinessService(created);
}

export async function createProductOnApi(
  businessId: string,
  product: Omit<BusinessService, "id" | "active" | "type">,
) {
  const token = getAuthToken();
  if (!token || !/^\d+$/.test(businessId)) return null;

  const created = await productsApi.create(
    {
      business_id: Number(businessId),
      name: product.name,
      description: product.description || null,
      price: product.price,
    },
    token,
  );

  return apiProductToBusinessService(created);
}

export async function updateServiceOnApi(
  serviceId: string,
  partial: Partial<BusinessService>,
) {
  const token = getAuthToken();
  if (!token || !/^\d+$/.test(serviceId)) return null;

  if (partial.type === "product") {
    const updated = await productsApi.update(
      Number(serviceId),
      {
        name: partial.name,
        description: partial.description,
        price: partial.price,
        is_active: partial.active,
      },
      token,
    );
    return apiProductToBusinessService(updated);
  }

  const updated = await servicesApi.update(
    Number(serviceId),
    {
      title: partial.name,
      description: partial.description,
      category: partial.category,
      price: partial.price,
      is_active: partial.active,
    },
    token,
  );

  return apiServiceToBusinessService(updated);
}

export async function removeServiceFromApi(serviceId: string, type: "service" | "product") {
  const token = getAuthToken();
  if (!token || !/^\d+$/.test(serviceId)) return;

  if (type === "product") {
    await productsApi.remove(Number(serviceId), token);
    return;
  }

  await servicesApi.remove(Number(serviceId), token);
}

export async function updateBusinessBookingStatusOnApi(
  bookingId: string,
  status: "accepted" | "cancelled",
) {
  const token = getAuthToken();
  if (!token || !/^\d+$/.test(bookingId)) return null;

  if (status === "accepted") {
    return bookingsApi.approve(Number(bookingId), token);
  }

  return bookingsApi.reject(Number(bookingId), token);
}

export async function getCurrentUserId() {
  const token = getAuthToken();
  if (!token) return null;
  const me = await authApi.me(token);
  return me.id;
}
