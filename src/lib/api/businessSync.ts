import {
  authApi,
  bookingsApi,
  branchesApi,
  businessesApi,
  categoriesApi,
  productsApi,
  reviewsApi,
  servicesApi,
  usersApi,
  workingHoursApi,
} from "@/lib/api";
import {
  dataUrlToFile,
  fetchBusinessGalleryUrls,
  syncBusinessMediaFromDraft,
} from "@/lib/api/mediaUpload";
import { resolveMediaUrl } from "@/lib/api/media";
import { ApiError } from "@/lib/api/client";
import {
  apiBookingToBusinessBookingRequest,
  apiCustomerRatingToStats,
  getCustomerDisplayName,
  apiBusinessToSavedBusiness,
  apiProductListItemToBusinessService,
  apiProductToBusinessService,
  apiServiceListItemToBusinessService,
  apiServiceToBusinessService,
  draftToBusinessCreate,
  draftToBusinessUpdate,
  findApiCategoryForUi,
  resolveApiBusinessCoords,
  scheduleToWorkingHoursPayload,
  workingHoursToSchedule,
} from "@/lib/api/mappers";
import { normalizePhoneForApi } from "@/lib/auth/validation";
import { getAuthToken } from "@/lib/api/token";
import { geocodeAddress, hasValidCoords, resolveDraftCoords } from "@/lib/geocoding";
import type { BusinessDraft, BusinessService, BusinessBookingRequest } from "@/store/business.store";
import type {
  BookingAttendanceStatus,
  Branch,
  Business as ApiBusiness,
} from "@/lib/api/types";

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
  const serviceMap = new Map(services.map((service) => [service.id, service.name]));

  if (!token) return [];

  const bookings = await bookingsApi.listByBusiness(businessId, token);
  const customerRatings = new Map<
    number,
    ReturnType<typeof reviewsApi.getCustomerRating>
  >();
  const bookingsWithCustomers = await Promise.all(
    bookings.map(async (booking) => {
      const embeddedUser = booking.user;
      const embeddedUsername =
        embeddedUser?.username || booking.username || "";
      const embeddedFullName =
        embeddedUser?.full_name?.trim() ||
        [embeddedUser?.first_name, embeddedUser?.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        booking.customer_name?.trim() ||
        booking.full_name?.trim() ||
        [booking.first_name, booking.last_name].filter(Boolean).join(" ").trim();
      let customer: {
        name: string;
        avatar?: string | null;
        phone?: string | null;
        bookingRating?: number | null;
        evaluatedBookingsCount?: number;
        onTimeCount?: number;
        lateCount?: number;
        noShowCount?: number;
        ratingStatsAvailable?: boolean;
      } = {
        name: getCustomerDisplayName(
          { username: embeddedUsername, full_name: embeddedFullName },
          booking.user_id,
        ),
        avatar: embeddedUser?.avatar,
        phone: embeddedUser?.phone ?? booking.phone,
      };

      let ratingRequest = customerRatings.get(booking.user_id);
      if (!ratingRequest) {
        ratingRequest = reviewsApi.getCustomerRating(booking.user_id, token);
        customerRatings.set(booking.user_id, ratingRequest);
      }

      try {
        const rating = await ratingRequest;
        const bookingRating = apiCustomerRatingToStats(rating);
        customer = {
          ...customer,
          name: getCustomerDisplayName(rating, booking.user_id, customer.name),
          bookingRating: bookingRating.rating,
          evaluatedBookingsCount: bookingRating.evaluatedBookingsCount,
          onTimeCount: bookingRating.onTimeCount,
          lateCount: bookingRating.lateCount,
          noShowCount: bookingRating.noShowCount,
          ratingStatsAvailable: bookingRating.available,
        };
      } catch (error) {
        console.warn(
          `Не удалось загрузить имя и рейтинг клиента ${booking.user_id}:`,
          error,
        );
      }

      return apiBookingToBusinessBookingRequest(
        booking,
        serviceMap.get(String(booking.service_id)) ?? "Услуга",
        customer,
      );
    }),
  );

  return bookingsWithCustomers;
}

export async function fetchBusinessBookingsFromApi(
  businessId: number,
  services: BusinessService[],
) {
  return loadBusinessBookings(businessId, services);
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

async function mapServicesFromApiList(
  services: Awaited<ReturnType<typeof servicesApi.listByBusiness>>,
) {
  const results = await Promise.allSettled(
    services.map(async (item) => {
      if (item.description) {
        return apiServiceListItemToBusinessService(item);
      }

      try {
        const detail = await servicesApi.get(item.id);
        return apiServiceToBusinessService(detail);
      } catch {
        return apiServiceListItemToBusinessService(item);
      }
    }),
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}

async function mapProductsFromApiList(
  products: Awaited<ReturnType<typeof productsApi.listByBusiness>>,
) {
  const results = await Promise.allSettled(
    products.map(async (item) => {
      if (item.description) {
        return apiProductListItemToBusinessService(item);
      }

      try {
        const detail = await productsApi.get(item.id);
        return apiProductToBusinessService(detail);
      } catch {
        return apiProductListItemToBusinessService(item);
      }
    }),
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}

async function loadBusinessDetails(
  businessId: number,
  withOwnerData = false,
  knownBusiness?: ApiBusiness,
) {
  const [business, services, products, branches, schedule, galleryUrls] =
    await Promise.all([
    knownBusiness ? Promise.resolve(knownBusiness) : businessesApi.get(businessId),
    servicesApi.listByBusiness(businessId),
    productsApi.listByBusiness(businessId),
    branchesApi.listByBusiness(businessId),
    workingHoursApi.getByBusiness(businessId),
    fetchBusinessGalleryUrls(businessId),
  ]);

  const [mappedServices, mappedProducts] = await Promise.all([
    mapServicesFromApiList(services),
    mapProductsFromApiList(products),
  ]);

  const mappedItems: BusinessService[] = [...mappedServices, ...mappedProducts];

  const [ownerData, branchDetail] = await Promise.all([
    withOwnerData
      ? Promise.all([
          loadBusinessStats(businessId),
          loadBusinessBookings(businessId, mappedItems).catch((error) => {
            console.error(
              `Не удалось загрузить бронирования бизнеса ${businessId}:`,
              error,
            );
            return [];
          }),
        ])
      : Promise.resolve<[undefined, BusinessBookingRequest[]]>([undefined, []]),
    branches[0]?.id
      ? branchesApi.get(branches[0].id).catch(() => null)
      : Promise.resolve(null),
  ]);

  const [stats, bookingRequests] = ownerData;

  const coords = await resolveCoordsForBusiness(business, branchDetail);

  return apiBusinessToSavedBusiness(business, {
    services: mappedItems,
    defaultBranchId: branches[0]?.id,
    schedule: workingHoursToSchedule(schedule),
    stats,
    bookingRequests,
    branch: branchDetail,
    coords,
    galleryUrls: galleryUrls.map((url) => resolveMediaUrl(url) ?? url),
  });
}

export async function fetchMyBusinessesFromApi() {
  const businesses = await businessesApi.my();
  return Promise.all(
    businesses.map((business) =>
      loadBusinessDetails(business.id, true, business),
    ),
  );
}

export async function fetchPublicBusinessesFromApi() {
  try {
    const list = await businessesApi.list();
    const results = await Promise.allSettled(
      list.map((item) => loadBusinessDetails(item.id)),
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Не удалось загрузить бизнес ${list[index].id} с API:`,
          result.reason,
        );
      }
    });

    return results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
    );
  } catch (error) {
    console.error("Не удалось загрузить бизнесы с API:", error);
    return [];
  }
}

async function syncWorkingHours(businessId: number, draft: BusinessDraft) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Войдите в аккаунт, чтобы сохранить график работы.");
  }

  const existing = await workingHoursApi.getByBusiness(businessId);
  const payload = scheduleToWorkingHoursPayload(businessId, draft.schedule);
  const updates = payload.flatMap((item) => {
    const matchingDays = existing.filter(
      (current) => current.day_of_week === item.day_of_week,
    );

    if (matchingDays.length === 0) {
      return [workingHoursApi.create(item, token)];
    }

    return matchingDays.map((current) =>
      workingHoursApi.update(
        current.id,
        {
          open_time: item.open_time,
          close_time: item.close_time,
          is_closed: item.is_closed,
        },
        token,
      ),
    );
  });
  const results = await Promise.allSettled(updates);
  const failures = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
  if (failures.length > 0) {
    throw new AggregateError(
      failures,
      `Не удалось сохранить все дни графика работы: ${failures
        .map((failure) =>
          failure instanceof Error ? failure.message : String(failure),
        )
        .join("; ")}`,
    );
  }

  const saved = await workingHoursApi.getByBusiness(businessId);
  const missingDay = payload.find((item) => {
    const savedDays = saved.filter(
      (current) => current.day_of_week === item.day_of_week,
    );
    return (
      savedDays.length === 0 ||
      savedDays.some(
        (savedDay) =>
          savedDay.business_id !== businessId ||
          savedDay.open_time.slice(0, 5) !== item.open_time ||
          savedDay.close_time.slice(0, 5) !== item.close_time ||
          savedDay.is_closed !== item.is_closed,
      )
    );
  });
  if (missingDay) {
    throw new Error(
      `API не подтвердил сохранение графика для дня ${missingDay.day_of_week}.`,
    );
  }
}

async function ensureDefaultBranch(
  businessId: number,
  draft: BusinessDraft,
  coords: { lat: number; lng: number },
) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Войдите в аккаунт, чтобы сохранить филиал.");
  }

  const branches = await branchesApi.listByBusiness(businessId);
  let branchId: number;
  if (branches.length > 0) {
    const updated = await branchesApi.update(
      branches[0].id,
      {
        address: draft.address,
        phone: normalizePhoneForApi(draft.phone),
        latitude: coords.lat,
        longitude: coords.lng,
      },
      token,
    );
    branchId = updated.id;
  } else {
    const created = await branchesApi.create(
      {
        business_id: businessId,
        name: draft.name || "Главный филиал",
        address: draft.address,
        phone: normalizePhoneForApi(draft.phone),
        latitude: coords.lat,
        longitude: coords.lng,
      },
      token,
    );
    branchId = created.id;
  }

  const [savedBranches, savedBranch] = await Promise.all([
    branchesApi.listByBusiness(businessId),
    branchesApi.get(branchId),
  ]);
  if (
    savedBranch.business_id !== businessId ||
    !savedBranches.some((branch) => branch.id === branchId)
  ) {
    throw new Error("API не подтвердил сохранение филиала бизнеса.");
  }

  return branchId;
}

async function resolveCreatedBusinessId(draft: BusinessDraft): Promise<number> {
  const mine = await businessesApi.my();
  const byName = mine.find((item) => item.name === draft.name.trim());
  if (byName) return byName.id;

  if (mine.length === 0) {
    throw new Error("Бизнес создан, но не найден в списке");
  }

  return mine.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0].id;
}

function isMissingBusinessError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 404 || error.status === 403) return true;

  return /business not found/i.test(error.message);
}

async function getOwnedApiBusinessId(businessId: string): Promise<number | null> {
  if (!/^\d+$/.test(businessId)) return null;

  try {
    const mine = await businessesApi.my();
    return mine.some((business) => business.id === Number(businessId))
      ? Number(businessId)
      : null;
  } catch (error) {
    if (!isMissingBusinessError(error)) {
      throw error;
    }
  }

  return null;
}

async function persistBusinessToApi(draft: BusinessDraft, businessId: number) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Войдите в аккаунт, чтобы сохранить бизнес");
  }

  const coords = await resolveDraftCoords(draft);
  const categories = await categoriesApi.list();
  const category = findApiCategoryForUi(categories, draft.category);
  if (!category) {
    throw new Error(`Категория бизнеса «${draft.category}» больше недоступна.`);
  }

  await businessesApi.update(
    businessId,
    draftToBusinessUpdate(draft, coords, category.id),
    token,
  );

  await syncWorkingHours(businessId, draft);
  await ensureDefaultBranch(businessId, draft, coords);

  await syncBusinessMediaFromDraft(businessId, draft);

  return loadBusinessDetails(businessId);
}

async function createBusinessFromDraft(draft: BusinessDraft) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Войдите в аккаунт, чтобы сохранить бизнес");
  }

  const coords = await resolveDraftCoords(draft);
  const [categories, profile] = await Promise.all([
    categoriesApi.list(),
    usersApi.getProfile(token),
  ]);
  const category = findApiCategoryForUi(categories, draft.category);
  if (!category) {
    throw new Error(`Категория бизнеса «${draft.category}» больше недоступна.`);
  }

  const ownerName =
    profile.full_name?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.username;
  if (!profile.email.trim() || !ownerName.trim()) {
    throw new Error("Заполните email и имя в профиле перед созданием бизнеса.");
  }

  const created = await businessesApi.create(
    draftToBusinessCreate(draft, coords, category.id, {
      email: profile.email,
      name: ownerName,
    }),
    token,
  );

  const businessId =
    created.business_id ?? (await resolveCreatedBusinessId(draft));
  return persistBusinessToApi(draft, businessId);
}

export async function saveBusinessDraftToApi(
  draft: BusinessDraft,
  editingId: string | null,
) {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Войдите в аккаунт, чтобы сохранить бизнес");
  }

  if (editingId) {
    const ownedId = await getOwnedApiBusinessId(editingId);
    if (ownedId != null) {
      try {
        return await persistBusinessToApi(draft, ownedId);
      } catch (error) {
        if (!isMissingBusinessError(error)) {
          throw error;
        }
      }
    }
  }

  return createBusinessFromDraft(draft);
}

export async function ensureWritableBusinessId(
  businessId: string,
  draft: BusinessDraft,
) {
  try {
    const ownedId = await getOwnedApiBusinessId(businessId);
    if (ownedId != null) {
      return { id: String(ownedId), created: false as const };
    }
  } catch (error) {
    // If ownership probe fails (proxy/HTML), still try to reuse a numeric id
    // that already looks like an API business instead of recreating it.
    if (/^\d+$/.test(businessId)) {
      console.warn("Business ownership check failed, retrying with id:", error);
      return { id: businessId, created: false as const };
    }
    throw error;
  }

  const created = await createBusinessFromDraft(draft);
  return { id: created.id, created: true as const, business: created };
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

async function rollbackCreatedItemAfterImageFailure(
  removeCreatedItem: () => Promise<unknown>,
  uploadError: unknown,
  itemLabel: string,
): Promise<never> {
  try {
    await removeCreatedItem();
  } catch (cleanupError) {
    console.error(`Не удалось удалить созданный ${itemLabel} после ошибки фото:`, {
      uploadError,
      cleanupError,
    });
    throw new AggregateError(
      [uploadError, cleanupError],
      `Фото ${itemLabel} не загрузилось, и созданный ${itemLabel} не удалось удалить.`,
    );
  }

  throw uploadError;
}

export async function createServiceOnApi(
  businessId: string,
  service: Omit<BusinessService, "id" | "active" | "type">,
) {
  const token = getAuthToken();
  if (!/^\d+$/.test(businessId)) return null;
  if (!token) throw new Error("Войдите в аккаунт, чтобы добавить услугу.");

  try {
    const created = await servicesApi.create(
      {
        business_id: Number(businessId),
        title: service.name,
        description: service.description,
        category: service.category,
        duration: service.duration ?? 60,
        price: service.price,
        capacity: service.guestCapacity ?? 1,
        availability: service.availability ?? [],
      },
      token,
    );

    if (service.photo?.startsWith("data:")) {
      try {
        const mimeType = service.photo.match(/^data:([^;]+);base64,/)?.[1];
        const extension =
          mimeType === "image/jpeg" ? "jpg" :
            mimeType === "image/webp" ? "webp" :
              mimeType === "image/png" ? "png" : null;
        const image = extension
          ? dataUrlToFile(service.photo, `service.${extension}`)
          : null;
        if (!image) throw new Error("Не удалось обработать фото услуги.");
        return apiServiceToBusinessService(
          await servicesApi.uploadImage(created.id, image, token),
        );
      } catch (error) {
        return rollbackCreatedItemAfterImageFailure(
          () => servicesApi.remove(created.id, token),
          error,
          "услугу",
        );
      }
    }

    return apiServiceToBusinessService(created);
  } catch (error) {
    console.error("API service create failed:", error);
    throw error;
  }
}

export async function createProductOnApi(
  businessId: string,
  product: Omit<BusinessService, "id" | "active" | "type">,
) {
  const token = getAuthToken();
  if (!/^\d+$/.test(businessId)) return null;
  if (!token) throw new Error("Войдите в аккаунт, чтобы добавить товар.");

  const created = await productsApi.create(
    {
      business_id: Number(businessId),
      name: product.name,
      description: product.description || null,
      price: product.price,
    },
    token,
  );

  if (product.photo?.startsWith("data:")) {
    try {
      const mimeType = product.photo.match(/^data:([^;]+);base64,/)?.[1];
      const extension =
        mimeType === "image/jpeg" ? "jpg" :
          mimeType === "image/webp" ? "webp" :
            mimeType === "image/png" ? "png" : null;
      const image = extension
        ? dataUrlToFile(product.photo, `product.${extension}`)
        : null;
      if (!image) throw new Error("Не удалось обработать фото товара.");
      return apiProductToBusinessService(
        await productsApi.uploadImage(created.id, image, token),
      );
    } catch (error) {
      return rollbackCreatedItemAfterImageFailure(
        () => productsApi.remove(created.id, token),
        error,
        "товар",
      );
    }
  }

  return apiProductToBusinessService(created);
}

export async function updateServiceOnApi(
  serviceId: string,
  partial: Partial<BusinessService>,
) {
  const token = getAuthToken();
  if (!/^\d+$/.test(serviceId)) return null;
  if (!token) throw new Error("Войдите в аккаунт, чтобы изменить услугу или товар.");

  try {
    if (partial.type === "product") {
      let updated = await productsApi.update(
        Number(serviceId),
        {
          name: partial.name,
          description: partial.description,
          price: partial.price,
          is_active: partial.active,
        },
        token,
      );
      if (partial.photo?.startsWith("data:")) {
        const mimeType = partial.photo.match(/^data:([^;]+);base64,/)?.[1];
        const extension =
          mimeType === "image/jpeg" ? "jpg" :
            mimeType === "image/webp" ? "webp" :
              mimeType === "image/png" ? "png" : null;
        const image = extension
          ? dataUrlToFile(partial.photo, `product.${extension}`)
          : null;
        if (!image) throw new Error("Не удалось обработать фото товара.");
        updated = await productsApi.uploadImage(Number(serviceId), image, token);
      } else if (partial.photo === null && updated.image) {
        updated = await productsApi.deleteImage(Number(serviceId), token);
      }
      return apiProductToBusinessService(updated);
    }

    const updated = await servicesApi.update(
      Number(serviceId),
      {
        title: partial.name,
        description: partial.description,
        category: partial.category,
        duration: partial.duration,
        price: partial.price,
        is_active: partial.active,
        capacity: partial.guestCapacity,
        availability: partial.availability,
      },
      token,
    );
    if (partial.photo?.startsWith("data:")) {
      const mimeType = partial.photo.match(/^data:([^;]+);base64,/)?.[1];
      const extension =
        mimeType === "image/jpeg" ? "jpg" :
          mimeType === "image/webp" ? "webp" :
            mimeType === "image/png" ? "png" : null;
      const image = extension
        ? dataUrlToFile(partial.photo, `service.${extension}`)
        : null;
      if (!image) throw new Error("Не удалось обработать фото услуги.");
      return apiServiceToBusinessService(
        await servicesApi.uploadImage(Number(serviceId), image, token),
      );
    }

    if (partial.photo === null) {
      const current = await servicesApi.get(Number(serviceId));
      if (current.image) {
        return apiServiceToBusinessService(
          await servicesApi.deleteImage(Number(serviceId), token),
        );
      }
    }

    return apiServiceToBusinessService(updated);
  } catch (error) {
    console.error("API item update failed:", error);
    throw error;
  }
}

export async function removeServiceFromApi(serviceId: string, type: "service" | "product") {
  const token = getAuthToken();
  if (!/^\d+$/.test(serviceId)) return;
  if (!token) throw new Error("Войдите в аккаунт, чтобы удалить услугу или товар.");

  try {
    if (type === "product") {
      await productsApi.remove(Number(serviceId), token);
      return;
    }

    await servicesApi.remove(Number(serviceId), token);
  } catch (error) {
    console.error("API item delete failed:", error);
    throw error;
  }
}

export async function updateBusinessBookingStatusOnApi(
  bookingId: string,
  status: "accepted" | "cancelled",
) {
  const token = getAuthToken();
  // Local/demo booking cards use non-numeric ids and are stored only in the client.
  if (!token || !/^\d+$/.test(bookingId)) return null;

  try {
    if (status === "accepted") {
      return await bookingsApi.approve(Number(bookingId), token);
    }

    return await bookingsApi.reject(Number(bookingId), token);
  } catch (error) {
    throw error;
  }
}

export async function updateBusinessBookingAttendanceOnApi(
  bookingId: string,
  status: BookingAttendanceStatus,
  extraWaitMinutes = 0,
) {
  const token = getAuthToken();
  if (!token || !/^\d+$/.test(bookingId)) {
    throw new ApiError(401, "Не удалось подтвердить авторизацию для отметки посещения.");
  }

  return bookingsApi.attendance(
    Number(bookingId),
    {
      status: status === "on_time" ? "visited" : status,
      extra_wait_minutes: status === "late" ? extraWaitMinutes : 0,
    },
    token,
  );
}

export async function getCustomerRatingFromApi(customerId: number) {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError(401, "Войдите в аккаунт, чтобы загрузить рейтинг клиента.");
  }

  return reviewsApi.getCustomerRating(customerId, token);
}

export async function getCurrentUserId() {
  const token = getAuthToken();
  if (!token) return null;
  const me = await authApi.me(token);
  return me.id;
}
