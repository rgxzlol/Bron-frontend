import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_SCHEDULE,
  type DaySchedule,
} from "@/lib/business/schedule";
import { randomTashkentCoords } from "@/lib/business/coordinates";

export const BUSINESS_CATEGORIES = [
  "Спорт зал",
  "Красота",
  "Здоровье",
  "Образование",
  "Еда",
  "Другое",
] as const;

export const SERVICE_CATEGORIES = [
  "Консультация",
  "Процедура",
  "Тренировка",
  "Диагностика",
  "Другое",
] as const;

export type BusinessService = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  photo: string | null;
  active: boolean;
  type: "service" | "product";
};

export type BusinessBookingRequest = {
  id: string;
  time: string;
  customerName: string;
  serviceName: string;
  price: number;
  status: "pending" | "waiting" | "accepted" | "cancelled";
};

export type BusinessDraft = {
  profilePhoto: string | null;
  name: string;
  description: string;
  category: string;
  website: string;
  phone: string;
  address: string;
  gallery: (string | null)[];
  schedule: DaySchedule[];
};

export type SavedBusiness = BusinessDraft & {
  id: string;
  status: "confirmed";
  bookings: number;
  views: number;
  lat: number;
  lng: number;
  services: BusinessService[];
  bookingRequests: BusinessBookingRequest[];
};

export const EMPTY_GALLERY: (string | null)[] = Array(6).fill(null);

export const createEmptyDraft = (): BusinessDraft => ({
  profilePhoto: null,
  name: "",
  description: "",
  category: "",
  website: "",
  phone: "",
  address: "",
  gallery: [...EMPTY_GALLERY],
  schedule: DEFAULT_SCHEDULE.map((d) => ({ ...d })),
});

function createDefaultServices(): BusinessService[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Консультация терапевта",
      category: "Консультация",
      price: 150000,
      description: "Первичный осмотр и консультация врача",
      photo: null,
      active: true,
      type: "service",
    },
  ];
}

function createDefaultBookingRequests(): BusinessBookingRequest[] {
  return [
    {
      id: crypto.randomUUID(),
      time: "10:30",
      customerName: "Мария Петровна",
      serviceName: "Консультация терапевта кабинет №1",
      price: 165000,
      status: "pending",
    },
    {
      id: crypto.randomUUID(),
      time: "10:30",
      customerName: "Мария Петровна",
      serviceName: "Консультация терапевта кабинет №1",
      price: 165000,
      status: "waiting",
    },
    {
      id: crypto.randomUUID(),
      time: "10:30",
      customerName: "Мария Петровна",
      serviceName: "Консультация терапевта кабинет №1",
      price: 165000,
      status: "pending",
    },
    {
      id: crypto.randomUUID(),
      time: "10:30",
      customerName: "Мария Петровна",
      serviceName: "Консультация терапевта кабинет №1",
      price: 165000,
      status: "pending",
    },
  ];
}

function ensureBusinessDefaults(business: SavedBusiness): SavedBusiness {
  const coords =
    business.lat != null && business.lng != null
      ? { lat: business.lat, lng: business.lng }
      : randomTashkentCoords();

  return {
    ...business,
    lat: coords.lat,
    lng: coords.lng,
    services:
      business.services?.length > 0
        ? business.services
        : createDefaultServices(),
    bookingRequests:
      business.bookingRequests?.length > 0
        ? business.bookingRequests
        : createDefaultBookingRequests(),
  };
}

type BusinessStore = {
  businesses: SavedBusiness[];
  draft: BusinessDraft;
  editingId: string | null;
  showMyBusiness: boolean;
  updateDraft: (partial: Partial<BusinessDraft>) => void;
  setDraftSchedule: (schedule: DaySchedule[]) => void;
  resetDraft: () => void;
  loadForEdit: (id: string) => void;
  saveDraft: () => SavedBusiness;
  removeBusiness: (id: string) => void;
  setShowMyBusiness: (value: boolean) => void;
  getBusiness: (id: string) => SavedBusiness | undefined;
  addService: (
    businessId: string,
    service: Omit<BusinessService, "id" | "active">,
  ) => void;
  addProduct: (
    businessId: string,
    product: Omit<BusinessService, "id" | "active" | "type">,
  ) => void;
  removeService: (businessId: string, serviceId: string) => void;
  toggleService: (
    businessId: string,
    serviceId: string,
    active: boolean,
  ) => void;
  updateBookingStatus: (
    businessId: string,
    bookingId: string,
    status: BusinessBookingRequest["status"],
  ) => void;
};

function draftFromBusiness(business: SavedBusiness): BusinessDraft {
  return {
    profilePhoto: business.profilePhoto,
    name: business.name,
    description: business.description,
    category: business.category,
    website: business.website,
    phone: business.phone,
    address: business.address,
    gallery: [...business.gallery],
    schedule: business.schedule.map((d) => ({ ...d })),
  };
}

function updateBusiness(
  businesses: SavedBusiness[],
  id: string,
  updater: (business: SavedBusiness) => SavedBusiness,
): SavedBusiness[] {
  return businesses.map((business) =>
    business.id === id ? updater(business) : business,
  );
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      businesses: [],
      draft: createEmptyDraft(),
      editingId: null,
      showMyBusiness: false,

      updateDraft: (partial) =>
        set((state) => ({ draft: { ...state.draft, ...partial } })),

      setDraftSchedule: (schedule) =>
        set((state) => ({ draft: { ...state.draft, schedule } })),

      resetDraft: () => set({ draft: createEmptyDraft(), editingId: null }),

      loadForEdit: (id) => {
        const business = get().businesses.find((b) => b.id === id);
        if (!business) return;
        set({ draft: draftFromBusiness(business), editingId: id });
      },

      getBusiness: (id) => {
        const business = get().businesses.find((b) => b.id === id);
        return business ? ensureBusinessDefaults(business) : undefined;
      },

      saveDraft: () => {
        const { draft, businesses, editingId } = get();

        if (editingId) {
          let saved: SavedBusiness | null = null;
          const next = businesses.map((business) => {
            if (business.id !== editingId) return business;
            saved = ensureBusinessDefaults({ ...business, ...draft });
            return saved;
          });
          if (!saved) throw new Error("Business not found");
          set({
            businesses: next,
            draft: createEmptyDraft(),
            editingId: null,
            showMyBusiness: true,
          });
          return saved;
        }

        const coords = randomTashkentCoords();
        const saved: SavedBusiness = ensureBusinessDefaults({
          ...draft,
          id: crypto.randomUUID(),
          status: "confirmed",
          bookings: 0,
          views: 0,
          lat: coords.lat,
          lng: coords.lng,
          services: createDefaultServices(),
          bookingRequests: createDefaultBookingRequests(),
        });
        set({
          businesses: [...businesses, saved],
          draft: createEmptyDraft(),
          editingId: null,
          showMyBusiness: true,
        });
        return saved;
      },

      removeBusiness: (id) =>
        set((state) => {
          const businesses = state.businesses.filter((b) => b.id !== id);
          return {
            businesses,
            showMyBusiness: businesses.length > 0,
          };
        }),

      setShowMyBusiness: (value) => set({ showMyBusiness: value }),

      addService: (businessId, service) =>
        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: [
              ...b.services,
              {
                ...service,
                id: crypto.randomUUID(),
                active: true,
                type: "service",
              },
            ],
          })),
        })),

      addProduct: (businessId, product) =>
        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: [
              ...b.services,
              {
                ...product,
                id: crypto.randomUUID(),
                active: true,
                type: "product",
              },
            ],
          })),
        })),

      removeService: (businessId, serviceId) =>
        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: b.services.filter((s) => s.id !== serviceId),
          })),
        })),

      toggleService: (businessId, serviceId, active) =>
        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: b.services.map((s) =>
              s.id === serviceId ? { ...s, active } : s,
            ),
          })),
        })),

      updateBookingStatus: (businessId, bookingId, status) =>
        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            bookingRequests: b.bookingRequests.map((req) =>
              req.id === bookingId ? { ...req, status } : req,
            ),
            bookings:
              status === "accepted" ? b.bookings + 1 : b.bookings,
          })),
        })),
    }),
    {
      name: "business-storage",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { businesses?: SavedBusiness[] };
        if (!state?.businesses) return persisted;
        return {
          ...state,
          businesses: state.businesses.map((b) =>
            ensureBusinessDefaults(b as SavedBusiness),
          ),
        };
      },
    },
  ),
);
