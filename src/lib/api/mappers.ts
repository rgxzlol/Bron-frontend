import { DEFAULT_SCHEDULE, type DaySchedule } from "@/lib/business/schedule";
import { randomTashkentCoords } from "@/lib/business/coordinates";
import type {
  BusinessDraft,
  BusinessService,
  SavedBusiness,
} from "@/store/business.store";
import type {
  Business as ApiBusiness,
  BusinessCreate as ApiBusinessCreate,
  BusinessUpdate as ApiBusinessUpdate,
  Product as ApiProduct,
  Service as ApiService,
  WorkingHours,
} from "./types";
import type { ProfileLanguage } from "@/store/profile.store";
import type { ShopsType } from "@/types/shops.types";
import { assets } from "@/lib/assets";

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
    category: draft.category,
    address: draft.address.trim(),
    phone: draft.phone.trim(),
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
  };
}

export function draftToBusinessUpdate(draft: BusinessDraft): ApiBusinessUpdate {
  return {
    name: draft.name.trim(),
    description: draft.description?.trim() || null,
    category: draft.category,
    address: draft.address.trim(),
    phone: draft.phone.trim(),
  };
}

export function apiServiceToBusinessService(service: ApiService): BusinessService {
  return {
    id: String(service.id),
    name: service.title,
    category: service.category,
    price: service.price,
    description: service.description,
    photo: null,
    active: service.is_active,
    type: "service",
  };
}

export function apiProductToBusinessService(product: ApiProduct): BusinessService {
  return {
    id: String(product.id),
    name: product.name,
    category: "Товар",
    price: product.price,
    description: product.description ?? "",
    photo: product.image,
    active: product.is_active,
    type: "product",
  };
}

export function apiBusinessToSavedBusiness(
  business: ApiBusiness,
  extras?: {
    services?: BusinessService[];
    defaultBranchId?: number;
    schedule?: DaySchedule[];
  },
): SavedBusiness {
  const coords =
    business.latitude != null && business.longitude != null
      ? { lat: business.latitude, lng: business.longitude }
      : randomTashkentCoords();

  return {
    id: String(business.id),
    status: "confirmed",
    bookings: 0,
    views: 0,
    profilePhoto: business.logo,
    name: business.name,
    description: business.description ?? "",
    category: business.category,
    website: "",
    phone: business.phone,
    address: business.address,
    gallery: Array(6).fill(null),
    schedule: extras?.schedule ?? DEFAULT_SCHEDULE.map((day) => ({ ...day })),
    lat: coords.lat,
    lng: coords.lng,
    services: extras?.services ?? [],
    bookingRequests: [],
    defaultBranchId: extras?.defaultBranchId,
  };
}

export function apiBusinessToShop(
  business: ApiBusiness,
  services: BusinessService[] = [],
  defaultBranchId?: number,
): ShopsType {
  const activeServices = services.filter((service) => service.active);
  const minPrice =
    activeServices.length > 0
      ? Math.min(...activeServices.map((service) => service.price))
      : 50000;

  return {
    id: business.id,
    apiBusinessId: business.id,
    apiBranchId: defaultBranchId,
    title: business.name,
    lat: business.latitude ?? randomTashkentCoords().lat,
    lng: business.longitude ?? randomTashkentCoords().lng,
    type: business.category,
    img: assets.map.photo1,
    desc: business.description ?? "",
    rating: 0,
    reviews: 0,
    hours: "09:00 - 20:00",
    freeSeats: 10,
    price: minPrice,
    address: business.address,
    district: "Ташкент",
    phone: business.phone,
    category: business.category,
    distance: "—",
    time: 60,
    services: activeServices.map((service) => ({
      id: service.id,
      title: service.name,
      description: service.description,
      priceFrom: service.price,
      durationMin: service.type === "service" ? 60 : 0,
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
