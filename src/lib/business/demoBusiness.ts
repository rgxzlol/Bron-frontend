import { DEFAULT_SCHEDULE } from "@/lib/business/schedule";
import { getFallbackBusinessBookings } from "@/lib/business/demoBookings";
import type {
  Branch,
  Business,
  BusinessApplication,
  BusinessStats,
  ServiceListItem,
} from "@/lib/api/types";
import type { BusinessService, SavedBusiness } from "@/store/business.store";

export const DEMO_BUSINESS_ID = 1;

const demoServices: BusinessService[] = [
  {
    id: "1",
    name: "Бронирование зала",
    category: "Тренировка",
    price: 80000,
    description: "Тренажерный зал на 1 час",
    photo: null,
    active: true,
    type: "service",
    guestCapacity: 12,
  },
];

export function isPlaceholderDemoBusiness(
  business: Pick<SavedBusiness, "id" | "name">,
) {
  return (
    business.id === String(DEMO_BUSINESS_ID) &&
    business.name === "BronFitness Club"
  );
}

export function getDemoSavedBusiness(): SavedBusiness {
  return {
    id: String(DEMO_BUSINESS_ID),
    status: "confirmed",
    bookings: 1,
    views: 24,
    profilePhoto: null,
    name: "BronFitness Club",
    description:
      "Современный фитнес клуб с тренажерным залом, групповые тренировки, SPA и зона отдыха",
    category: "Спорт зал",
    website: "",
    phone: "+998 99 999 99 99",
    address: "ул. Сайрам 123, Ташкент",
    gallery: [null, null, null, null, null, null],
    schedule: DEFAULT_SCHEDULE.map((day) => ({ ...day })),
    lat: 41.3111,
    lng: 69.2797,
    services: demoServices,
    bookingRequests: getFallbackBusinessBookings(demoServices),
    defaultBranchId: 1,
  };
}

export function getDemoOwnedBusinessRecord(): Business {
  return {
    id: DEMO_BUSINESS_ID,
    owner_id: 1,
    owner_username: "Иван Иванович",
    name: "BronFitness Club",
    description:
      "Современный фитнес клуб с тренажерным залом, групповые тренировки, SPA и зона отдыха",
    logo: null,
    category: "gym",
    address: "ул. Сайрам 123, Ташкент",
    phone: "+998 99 999 99 99",
    latitude: 41.3111,
    longitude: 69.2797,
    tin: null,
    website: null,
    social_links: {},
    comments: null,
    status: "approved",
    created_at: "2026-08-01T10:00:00.000Z",
  };
}

export function getDemoBusinessApplication(): BusinessApplication {
  const business = getDemoOwnedBusinessRecord();

  return {
    id: business.id,
    user_id: business.owner_id,
    company_name: business.name,
    tin: business.tin,
    sphere: business.category,
    location: business.address,
    phone: business.phone,
    description: business.description,
    latitude: business.latitude,
    longitude: business.longitude,
    website: business.website,
    social_links: business.social_links,
    comments: business.comments,
    status: "approved",
    created_at: business.created_at,
  };
}

export function getDemoBusinessStats(): BusinessStats {
  return {
    total_bookings: 12,
    pending_bookings: 1,
    approved_bookings: 10,
    cancelled_bookings: 1,
    total_revenue: "960000",
  };
}

export function getDemoBusinessServices(): ServiceListItem[] {
  return [
    {
      id: 1,
      title: "Бронирование зала",
      category: "training",
      duration: 60,
      price: 80000,
      description: "Тренажерный зал на 1 час",
      is_active: true,
    },
  ];
}

export function getDemoBusinessBranches(): Branch[] {
  return [
    {
      id: 1,
      business_id: DEMO_BUSINESS_ID,
      name: "Главный филиал",
      address: "ул. Сайрам 123, Ташкент",
      phone: "+998 99 999 99 99",
      latitude: 41.3111,
      longitude: 69.2797,
    },
  ];
}
