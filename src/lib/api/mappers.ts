import { normalizePhoneForApi } from "@/lib/auth/validation";
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
  BusinessCategory as ApiBusinessCategory,
  BusinessCreate as ApiBusinessCreate,
  BusinessStats,
  BusinessUpdate as ApiBusinessUpdate,
  Booking as ApiBooking,
  CustomerRating,
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

const UI_TO_API_CATEGORY: Record<string, string[]> = {
  "Салон красоты": ["beauty_salon", "salon_beauty", "beauty"],
  Здоровье: ["health", "healthcare", "medical", "medicine", "clinic"],
  "Фитнес зал": ["gym", "fitness", "sport"],
  "Учебные заведения": ["education", "school"],
  Рестораны: ["restaurants", "restaurant", "food"],
  Кафейни: ["cafes", "cafe", "coffee"],
  "Авто сервис": ["auto_service", "autoservice", "auto", "car_service"],
  Кинотеатры: ["cinema", "cinemas", "movie_theater"],
  "Комп клуб": ["pc_club", "computer_club", "gaming_club"],
  Клининг: ["cleaning", "cleaning_service"],
  Санатории: ["sanatoriums", "sanatorium", "spa", "wellness"],
  Другое: ["other", "другое"],
};

export type BookingRatingStats = {
  rating: number | null;
  evaluatedBookingsCount: number;
  onTimeCount: number;
  lateCount: number;
  noShowCount: number;
  available: boolean;
};

export function getCustomerDisplayName(
  customer: Pick<CustomerRating, "username" | "full_name">,
  customerId: number,
) {
  const fullName = customer.full_name?.trim();
  if (fullName) return fullName;

  const username = customer.username.trim();
  if (username && !/^\+?[\d\s()-]+$/.test(username)) return username;

  return `Клиент #${customerId}`;
}

export function apiCustomerRatingToStats(
  response: CustomerRating,
): BookingRatingStats {
  const counts = [
    response.evaluated_bookings_count,
    response.on_time_count,
    response.late_count,
    response.no_show_count,
  ];
  const validCounts = counts.every(
    (count) => Number.isInteger(count) && (count ?? -1) >= 0,
  );
  const evaluatedBookingsCount = response.evaluated_bookings_count ?? 0;
  const validBookingRating =
    evaluatedBookingsCount === 0
      ? response.booking_rating == null
      : typeof response.booking_rating === "number" &&
        Number.isFinite(response.booking_rating) &&
        response.booking_rating >= 0 &&
        response.booking_rating <= 5;
  const available =
    validCounts &&
    (response.on_time_count ?? 0) +
      (response.late_count ?? 0) +
      (response.no_show_count ?? 0) ===
      evaluatedBookingsCount &&
    validBookingRating;

  return {
    rating:
      available &&
      evaluatedBookingsCount > 0 &&
      typeof response.booking_rating === "number"
        ? response.booking_rating
        : null,
    evaluatedBookingsCount,
    onTimeCount: response.on_time_count ?? 0,
    lateCount: response.late_count ?? 0,
    noShowCount: response.no_show_count ?? 0,
    available,
  };
}

const API_TO_UI_CATEGORY: Record<string, string> = {
  beauty_salon: "Салон красоты",
  salon_beauty: "Салон красоты",
  beauty: "Салон красоты",
  "салон красоты": "Салон красоты",
  салон_красоты: "Салон красоты",
  health: "Здоровье",
  healthcare: "Здоровье",
  medical: "Здоровье",
  clinic: "Здоровье",
  hospital: "Здоровье",
  gym: "Фитнес зал",
  fitness: "Фитнес зал",
  sport: "Фитнес зал",
  education: "Учебные заведения",
  school: "Учебные заведения",
  restaurant: "Рестораны",
  restaurants: "Рестораны",
  food: "Рестораны",
  cafe: "Кафейни",
  cafes: "Кафейни",
  coffee: "Кафейни",
  auto_service: "Авто сервис",
  autoservice: "Авто сервис",
  car_service: "Авто сервис",
  auto: "Авто сервис",
  cinema: "Кинотеатры",
  cinemas: "Кинотеатры",
  movie_theater: "Кинотеатры",
  pc_club: "Комп клуб",
  computer_club: "Комп клуб",
  gaming_club: "Комп клуб",
  club: "Комп клуб",
  cleaning: "Клининг",
  cleaning_service: "Клининг",
  sanatorium: "Санатории",
  sanatoriums: "Санатории",
  spa: "Санатории",
  wellness: "Санатории",
  "спорт зал": "Фитнес зал",
  спорт_зал: "Фитнес зал",
  "фитнес зал": "Фитнес зал",
  фитнес_зал: "Фитнес зал",
  "учебные заведения": "Учебные заведения",
  учебные_заведения: "Учебные заведения",
  рестораны: "Рестораны",
  кафейни: "Кафейни",
  "авто сервис": "Авто сервис",
  авто_сервис: "Авто сервис",
  кинотеатры: "Кинотеатры",
  "комп клуб": "Комп клуб",
  комп_клуб: "Комп клуб",
  клининг: "Клининг",
  санатории: "Санатории",
  "кафе и рестораны": "Рестораны",
  кафе_и_рестораны: "Рестораны",
  restaurants_cafes: "Рестораны",
  sports_fitness: "Фитнес зал",
  sports_and_fitness: "Фитнес зал",
  beauty_care: "Салон красоты",
  beauty_and_care: "Салон красоты",
  cafe_and_restaurants: "Рестораны",
  cafes_and_restaurants: "Рестораны",
  medicine: "Здоровье",
  health_spa: "Санатории",
  health_and_spa: "Санатории",
  hotels_recreation: "Санатории",
  hotels_and_recreation: "Санатории",
  auto_services: "Авто сервис",
  entertainment: "Кинотеатры",
  leisure: "Кинотеатры",
  "спорт и фитнес": "Фитнес зал",
  спорт_и_фитнес: "Фитнес зал",
  "красота и уход": "Салон красоты",
  красота_и_уход: "Салон красоты",
  медицина: "Здоровье",
  "здоровье и spa": "Санатории",
  здоровье_и_spa: "Санатории",
  "отели и отдых": "Санатории",
  отели_и_отдых: "Санатории",
  автосервисы: "Авто сервис",
  образование: "Учебные заведения",
  развлечения: "Кинотеатры",
  еда: "Рестораны",
  other: "Другое",
  другое: "Другое",
};

export function uiCategoryToApi(category: string) {
  return UI_TO_API_CATEGORY[category]?.[0] ?? category;
}

export function findApiCategoryForUi(
  categories: ApiBusinessCategory[],
  uiCategory: string,
): ApiBusinessCategory | undefined {
  const expectedSlugs = new Set(
    (UI_TO_API_CATEGORY[uiCategory] ?? [uiCategory]).map((slug) =>
      slug.toLowerCase().replace(/[\s-]+/g, "_"),
    ),
  );

  return (
    categories.find((category) =>
      expectedSlugs.has(category.slug.toLowerCase().replace(/[\s-]+/g, "_")),
    ) ??
    categories.find(
      (category) => category.name.trim().toLowerCase() === uiCategory.toLowerCase(),
    ) ??
    categories.find((category) => apiCategoryToUi(category) === uiCategory)
  );
}

export function apiCategoryToUi(category: unknown): string {
  if (typeof category === "string") {
    const value = category.trim();
    if (!value) return "Другое";

    const normalizedValue = value.toLowerCase().replace(/[\s-]+/g, "_");
    return API_TO_UI_CATEGORY[normalizedValue] ??
      API_TO_UI_CATEGORY[value.toLowerCase()] ??
      value;
  }

  if (typeof category !== "object" || category === null) {
    return "Другое";
  }

  const slug = "slug" in category && typeof category.slug === "string"
    ? category.slug.trim()
    : "";
  const name = "name" in category && typeof category.name === "string"
    ? category.name.trim()
    : "";
  const normalizedSlug = slug.toLowerCase().replace(/[\s-]+/g, "_");

  if (!slug && !name) return "Другое";

  const normalizedName = name.toLowerCase().replace(/[\s-]+/g, "_");
  return API_TO_UI_CATEGORY[normalizedSlug] ??
    API_TO_UI_CATEGORY[normalizedName] ??
    (name || slug);
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
  categoryId?: number,
  owner?: { email: string; name: string },
): ApiBusinessCreate {
  if (categoryId == null || !owner?.email.trim() || !owner.name.trim()) {
    throw new Error("Для создания бизнеса нужны категория, email и имя владельца.");
  }

  return {
    name: draft.name.trim(),
    description: draft.description?.trim() || null,
    category_id: categoryId,
    address: draft.address.trim(),
    phone: normalizePhoneForApi(draft.phone),
    email: owner.email.trim(),
    owner_name: owner.name.trim(),
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
    website: draft.website?.trim() || null,
    comments: "",
  };
}

export function draftToBusinessUpdate(
  draft: BusinessDraft,
  coords?: { lat: number; lng: number },
  categoryId?: number,
): ApiBusinessUpdate {
  if (categoryId == null) {
    throw new Error("Не удалось определить категорию бизнеса.");
  }

  return {
    name: draft.name.trim(),
    description: draft.description?.trim() || null,
    category_id: categoryId,
    address: draft.address.trim(),
    phone: normalizePhoneForApi(draft.phone),
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
    website: draft.website?.trim() || null,
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
    duration: service.duration,
    guestCapacity: service.capacity ?? 1,
    availability: service.availability ?? [],
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
    duration: service.duration,
    guestCapacity: service.capacity ?? 1,
    availability: service.availability ?? [],
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
    galleryUrls?: string[];
  },
): SavedBusiness {
  const coords =
    extras?.coords ?? resolveApiBusinessCoords(business, extras?.branch);

  const mappedServices = extras?.services ?? [];
  const galleryUrls = (extras?.galleryUrls ?? []).map((url) => resolveMediaUrl(url)).filter(
    (url): url is string => Boolean(url),
  );
  const businessApprovalStatus = business.status?.toLowerCase();

  return {
    id: String(business.id),
    status: "confirmed",
    approvalStatus:
      businessApprovalStatus === "pending" ||
      businessApprovalStatus === "approved"
        ? businessApprovalStatus
        : undefined,
    bookings: extras?.stats?.total_bookings ?? 0,
    views: business.views_count ?? 0,
    profilePhoto: resolveMediaUrl(business.logo),
    name: business.name,
    description: business.description ?? "",
    category: apiCategoryToUi(business.category),
    website: business.website ?? "",
    phone: business.phone,
    address: business.address,
    gallery: photosToGallerySlots(galleryUrls, true),
    schedule: extras?.schedule ?? DEFAULT_SCHEDULE.map((day) => ({ ...day })),
    lat: coords.lat,
    lng: coords.lng,
    services: mappedServices,
    bookingRequests: extras?.bookingRequests ?? [],
    defaultBranchId: extras?.defaultBranchId,
  };
}

function apiBookingStatusToUi(status: string): BusinessBookingRequest["status"] {
  const normalizedStatus = status.trim().toLowerCase();
  if (
    normalizedStatus === "approved" ||
    normalizedStatus === "accepted" ||
    normalizedStatus === "confirmed" ||
    normalizedStatus === "waiting"
  ) {
    return "accepted";
  }
  if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "rejected"
  ) {
    return "cancelled";
  }
  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "finished" ||
    normalizedStatus === "done" ||
    normalizedStatus === "past"
  ) {
    return "completed";
  }
  return "pending";
}

export function apiBookingToBusinessBookingRequest(
  booking: ApiBooking,
  serviceName = "Услуга",
  customer: {
    name?: string;
    avatar?: string | null;
    bookingRating?: number | null;
    evaluatedBookingsCount?: number;
    onTimeCount?: number;
    lateCount?: number;
    noShowCount?: number;
    ratingStatsAvailable?: boolean;
  } = {},
): BusinessBookingRequest {
  return {
    id: String(booking.id),
    customerId: booking.user_id,
    customerAvatar: resolveMediaUrl(customer.avatar),
    customerRating: customer.bookingRating,
    customerEvaluatedBookingsCount: customer.evaluatedBookingsCount,
    customerOnTimeCount: customer.onTimeCount,
    customerLateCount: customer.lateCount,
    customerNoShowCount: customer.noShowCount,
    customerRatingStatsAvailable: customer.ratingStatsAvailable,
    bookingId: booking.id,
    bookingDate: booking.booking_date,
    endTime: booking.end_time?.slice(0, 5),
    time: booking.start_time?.slice(0, 5) ?? "",
    customerName: customer.name?.trim() || `Клиент #${booking.user_id}`,
    serviceName,
    price: booking.total_price,
    items: booking.items ?? [],
    status: apiBookingStatusToUi(booking.status),
    attendanceStatus:
      booking.attendance_status === "visited"
        ? "on_time"
        : booking.attendance_status,
    extraWaitMinutes: booking.extra_wait_minutes,
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
      kind: service.type,
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export { DAY_KEY_TO_INDEX, DAY_INDEX_TO_KEY };
