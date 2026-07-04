import { DEFAULT_SCHEDULE, type DaySchedule } from "@/lib/business/schedule";
import { businessCategoryToMapFilter } from "@/lib/business/coordinates";
import type {
  BusinessDraft,
  BusinessService,
  SavedBusiness,
} from "@/store/business.store";
import type {
  Branch,
  Business as ApiBusiness,
  BusinessCreate as ApiBusinessCreate,
  BusinessStats,
  BusinessUpdate as ApiBusinessUpdate,
  Booking as ApiBooking,
  Product as ApiProduct,
  Service as ApiService,
  WorkingHours,
} from "./types";
import type { BusinessBookingRequest } from "@/store/business.store";
import type { ProfileLanguage } from "@/store/profile.store";
import type { ShopsType } from "@/types/shops.types";
import { assets } from "@/lib/assets";
import { collectBusinessPhotoUrls, photosToGallerySlots } from "@/lib/business/photos";
import { normalizeCoords } from "@/lib/geocoding";
import { resolveMediaUrl } from "@/lib/api/media";
import type {
  ProductListItem,
  ServiceListItem,
} from "./types";

const UI_TO_API_CATEGORY: Record<string, string> = {
  "Спорт зал": "gym",
  Красота: "beauty",
  Здоровье: "health",
  Образование: "education",
  Еда: "food",
  Другое: "other",
};

const API_TO_UI_CATEGORY: Record<string, string> = {
  gym: "Спорт зал",
  beauty: "Красота",
  health: "Здоровье",
  education: "Образование",
  food: "Еда",
  club: "Клуб",
  other: "Другое",
};

export function uiCategoryToApi(category: string) {
  return UI_TO_API_CATEGORY[category] ?? category;
}

export function apiCategoryToUi(category: string) {
  const normalized = category.trim().toLowerCase();
  return API_TO_UI_CATEGORY[normalized] ?? category;
}

function parsePrice(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

const DAY_KEY_TO_INDEX: Record<string, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};

const DAY_INDEX_TO_KEY = Object.entries(DAY_KEY_TO_INDEX).reduce(
  (acc, [key, index]) => {
    acc[index] = key;
    return acc;
  },
  {} as Record<number, string>,
);

function normalizeTime(time: string) {
  return time.slice(0, 5);
}

export function scheduleToWorkingHoursPayload(
  businessId: number,
  schedule: DaySchedule[],
) {
  return schedule.map((day) => ({
    business_id: businessId,
    day_of_week: DAY_KEY_TO_INDEX[day.key],
    open_time: day.openTime,
    close_time: day.closeTime,
    is_closed: !day.isOpen,
  }));
}

export function workingHoursToSchedule(hours: WorkingHours[]): DaySchedule[] {
  const byDay = new Map(hours.map((item) => [item.day_of_week, item]));

  return DEFAULT_SCHEDULE.map((day) => {
    const apiDay = byDay.get(DAY_KEY_TO_INDEX[day.key]);
    if (!apiDay) return { ...day };

    return {
      ...day,
      isOpen: !apiDay.is_closed,
      openTime: normalizeTime(apiDay.open_time),
      closeTime: normalizeTime(apiDay.close_time),
    };
  });
}

export function draftToBusinessCreate(
  draft: BusinessDraft,
  coords?: { lat: number; lng: number },
): ApiBusinessCreate {
  return {
    name: draft.name.trim(),
    description: draft.description?.trim() || null,
    category: uiCategoryToApi(draft.category),
    address: draft.address.trim(),
    phone: draft.phone.trim(),
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
  };
}

export function draftToBusinessUpdate(
  draft: BusinessDraft,
  coords?: { lat: number; lng: number },
): ApiBusinessUpdate {
  return {
    name: draft.name.trim(),
    description: draft.description?.trim() || null,
    category: uiCategoryToApi(draft.category),
    address: draft.address.trim(),
    phone: draft.phone.trim(),
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
  };
}

export function apiServiceToBusinessService(service: ApiService): BusinessService {
  return {
    id: String(service.id),
    name: service.title,
    category: service.category,
    price: parsePrice(service.price),
    description: service.description ?? "",
    photo: resolveMediaUrl(service.image),
    active: service.is_active ?? true,
    type: "service",
  };
}

export function apiServiceListItemToBusinessService(
  service: ServiceListItem,
): BusinessService {
  return {
    id: String(service.id),
    name: service.title,
    category: service.category,
    price: parsePrice(service.price),
    description: service.description ?? "",
    photo: resolveMediaUrl(service.image),
    active: service.is_active ?? true,
    type: "service",
  };
}

export function apiProductToBusinessService(product: ApiProduct): BusinessService {
  return {
    id: String(product.id),
    name: product.name,
    category: "Товар",
    price: parsePrice(product.price),
    description: product.description ?? "",
    photo: resolveMediaUrl(product.image),
    active: product.is_active,
    type: "product",
  };
}

export function apiProductListItemToBusinessService(
  product: ProductListItem,
): BusinessService {
  return {
    id: String(product.id),
    name: product.name,
    category: "Товар",
    price: parsePrice(product.price),
    description: product.description ?? "",
    photo: resolveMediaUrl(product.image),
    active: product.is_active ?? true,
    type: "product",
  };
}

export function resolveApiBusinessCoords(
  business: Pick<ApiBusiness, "latitude" | "longitude">,
  branch?: Pick<Branch, "latitude" | "longitude"> | null,
): { lat: number; lng: number } {
  const fromBusiness = normalizeCoords(business.latitude, business.longitude);
  if (fromBusiness) return fromBusiness;

  const fromBranch = normalizeCoords(branch?.latitude, branch?.longitude);
  if (fromBranch) return fromBranch;

  return { lat: 0, lng: 0 };
}

export function apiBusinessToSavedBusiness(
  business: ApiBusiness,
  extras?: {
    services?: BusinessService[];
    defaultBranchId?: number;
    schedule?: DaySchedule[];
    stats?: BusinessStats;
    bookingRequests?: BusinessBookingRequest[];
    branch?: Pick<Branch, "latitude" | "longitude"> | null;
    coords?: { lat: number; lng: number };
  },
): SavedBusiness {
  const coords =
    extras?.coords ?? resolveApiBusinessCoords(business, extras?.branch);

  const mappedServices = extras?.services ?? [];
  const photoUrls = collectBusinessPhotoUrls({
    profilePhoto: resolveMediaUrl(business.logo),
    gallery: [],
    services: mappedServices,
  });

  return {
    id: String(business.id),
    status: "confirmed",
    bookings: extras?.stats?.total_bookings ?? 0,
    views: extras?.stats?.approved_bookings ?? 0,
    profilePhoto: resolveMediaUrl(business.logo),
    name: business.name,
    description: business.description ?? "",
    category: apiCategoryToUi(business.category),
    website: "",
    phone: business.phone,
    address: business.address,
    gallery: photosToGallerySlots(photoUrls),
    schedule: extras?.schedule ?? DEFAULT_SCHEDULE.map((day) => ({ ...day })),
    lat: coords.lat,
    lng: coords.lng,
    services: mappedServices,
    bookingRequests: extras?.bookingRequests ?? [],
    defaultBranchId: extras?.defaultBranchId,
  };
}

function apiBookingStatusToUi(status: string): BusinessBookingRequest["status"] {
  if (status === "approved" || status === "accepted" || status === "waiting") {
    return "accepted";
  }
  if (status === "cancelled" || status === "rejected") return "cancelled";
  return "pending";
}

export function apiBookingToBusinessBookingRequest(
  booking: ApiBooking,
  serviceName = "Услуга",
  customerName = "Клиент",
): BusinessBookingRequest {
  return {
    id: String(booking.id),
    time: booking.start_time.slice(0, 5),
    customerName,
    serviceName,
    price: booking.total_price,
    status: apiBookingStatusToUi(booking.status),
  };
}

export function apiBusinessToShop(
  business: ApiBusiness,
  services: BusinessService[] = [],
  defaultBranchId?: number,
  branch?: Pick<Branch, "latitude" | "longitude"> | null,
): ShopsType {
  const activeServices = services.filter((service) => service.active);
  const minPrice =
    activeServices.length > 0
      ? Math.min(...activeServices.map((service) => service.price))
      : 50000;

  const coords = resolveApiBusinessCoords(business, branch);
  const savedBusiness = {
    profilePhoto: resolveMediaUrl(business.logo),
    gallery: [] as (string | null)[],
    services,
  };
  const photoUrls = collectBusinessPhotoUrls(savedBusiness);

  return {
    id: business.id,
    apiBusinessId: business.id,
    apiBranchId: defaultBranchId,
    title: business.name,
    lat: coords.lat,
    lng: coords.lng,
    type: businessCategoryToMapFilter(apiCategoryToUi(business.category)),
    img: photoUrls[0] ?? assets.map.photo1,
    profilePhoto: resolveMediaUrl(business.logo),
    gallery: photoUrls,
    desc: business.description ?? "",
    rating: 0,
    reviews: 0,
    hours: "09:00 - 20:00",
    freeSeats: 10,
    price: minPrice,
    address: business.address,
    district: "Ташкент",
    phone: business.phone,
    category: apiCategoryToUi(business.category),
    distance: "—",
    time: 60,
    services: activeServices.map((service) => ({
      id: service.id,
      title: service.name,
      description: service.description,
      priceFrom: service.price,
      durationMin: service.type === "service" ? 60 : 0,
      icon: service.photo ?? undefined,
    })),
  };
}

export function mapApiLanguage(language: string): ProfileLanguage {
  if (language === "uz" || language === "en" || language === "ru") {
    return language;
  }
  return "ru";
}

export function mapProfileLanguage(language: ProfileLanguage) {
  return language;
}

export function addMinutesToTime(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const nextHours = Math.floor(total / 60) % 24;
  const nextMins = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMins).padStart(2, "0")}`;
}

export function formatBookingDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export { DAY_KEY_TO_INDEX, DAY_INDEX_TO_KEY };
