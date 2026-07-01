import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createProductOnApi,
  createServiceOnApi,
  fetchBusinessBookingsFromApi,
  fetchMyBusinessesFromApi,
  getCurrentUserId,
  removeBusinessFromApi,
  removeServiceFromApi,
  saveBusinessDraftToApi,
  updateBusinessBookingStatusOnApi,
  updateServiceOnApi,
} from "@/lib/api/businessSync";
import { getAuthToken } from "@/lib/api/token";
import { geocodeAddress, resolveDraftCoords } from "@/lib/geocoding";
import {
  DEFAULT_SCHEDULE,
  type DaySchedule,
} from "@/lib/business/schedule";
import { mergeBusinessFromApi } from "@/lib/business/photos";
import { hasValidCoords, normalizeCoords } from "@/lib/geocoding";

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
  lat: number | null;
  lng: number | null;
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
  defaultBranchId?: number;
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
  lat: null,
  lng: null,
  gallery: [...EMPTY_GALLERY],
  schedule: DEFAULT_SCHEDULE.map((d) => ({ ...d })),
});

function normalizeBusiness(business: SavedBusiness): SavedBusiness {
  return {
    ...business,
    services: Array.isArray(business.services) ? business.services : [],
    bookingRequests: Array.isArray(business.bookingRequests)
      ? business.bookingRequests
      : [],
  };
}

function ensureNewBusinessDefaults(business: SavedBusiness): SavedBusiness {
  return normalizeBusiness(business);
}

type BusinessStore = {
  businesses: SavedBusiness[];
  draft: BusinessDraft;
  editingId: string | null;
  showMyBusiness: boolean;
  mapFocusBusinessId: string | null;
  updateDraft: (partial: Partial<BusinessDraft>) => void;
  setDraftSchedule: (schedule: DaySchedule[]) => void;
  resetDraft: () => void;
  loadForEdit: (id: string) => void;
  saveDraft: () => Promise<SavedBusiness>;
  removeBusiness: (id: string) => Promise<void>;
  setShowMyBusiness: (value: boolean) => void;
  clearMapFocus: () => void;
  clearBusinesses: () => void;
  getBusiness: (id: string) => SavedBusiness | undefined;
  fetchBusinessesFromApi: () => Promise<void>;
  refreshBusinessBookings: (businessId: string) => Promise<void>;
  addService: (
    businessId: string,
    service: Omit<BusinessService, "id" | "active">,
  ) => Promise<void>;
  addProduct: (
    businessId: string,
    product: Omit<BusinessService, "id" | "active" | "type">,
  ) => Promise<void>;
  removeService: (businessId: string, serviceId: string) => Promise<void>;
  updateService: (
    businessId: string,
    serviceId: string,
    partial: Partial<Pick<BusinessService, "name" | "category" | "price" | "description" | "photo">>,
  ) => Promise<void>;
  toggleService: (
    businessId: string,
    serviceId: string,
    active: boolean,
  ) => Promise<void>;
  updateBookingStatus: (
    businessId: string,
    bookingId: string,
    status: BusinessBookingRequest["status"],
  ) => Promise<void>;
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
    lat: hasValidCoords(business) ? business.lat : null,
    lng: hasValidCoords(business) ? business.lng : null,
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
      mapFocusBusinessId: null,

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
        return business ? normalizeBusiness(business) : undefined;
      },

      saveDraft: async () => {
        const { draft, businesses, editingId } = get();
        const token = getAuthToken();

        if (token) {
          const coords = await resolveDraftCoords(draft);
          const saved = await saveBusinessDraftToApi(draft, editingId);
          const resolved = normalizeCoords(coords.lat, coords.lng);
          const normalized: SavedBusiness = normalizeBusiness({
            ...saved,
            lat: resolved?.lat ?? coords.lat,
            lng: resolved?.lng ?? coords.lng,
            profilePhoto: saved.profilePhoto ?? draft.profilePhoto,
            gallery: saved.gallery.some(Boolean) ? saved.gallery : draft.gallery,
            website: saved.website || draft.website,
            description: saved.description || draft.description,
          });
          const next = editingId
            ? businesses.map((business) =>
                business.id === editingId || business.id === normalized.id
                  ? normalized
                  : business,
              )
            : [...businesses, normalized];

          set({
            businesses: next,
            draft: createEmptyDraft(),
            editingId: null,
            showMyBusiness: true,
            mapFocusBusinessId: normalized.id,
          });
          return normalized;
        }

        if (editingId) {
          const coords = await resolveDraftCoords(draft);
          let updatedBusiness: SavedBusiness | null = null;
          const next = businesses.map((business) => {
            if (business.id !== editingId) return business;
            updatedBusiness = normalizeBusiness({
              ...business,
              ...draft,
              lat: coords.lat,
              lng: coords.lng,
            });
            return updatedBusiness;
          });
          if (!updatedBusiness) throw new Error("Business not found");
          const savedBusiness: SavedBusiness = updatedBusiness;
          set({
            businesses: next,
            draft: createEmptyDraft(),
            editingId: null,
            showMyBusiness: true,
            mapFocusBusinessId: savedBusiness.id,
          });
          return savedBusiness;
        }

        const coords = await resolveDraftCoords(draft);
        const saved: SavedBusiness = ensureNewBusinessDefaults({
          ...draft,
          id: crypto.randomUUID(),
          status: "confirmed",
          bookings: 0,
          views: 0,
          lat: coords.lat,
          lng: coords.lng,
          services: [],
          bookingRequests: [],
        });
        set({
          businesses: [...businesses, saved],
          draft: createEmptyDraft(),
          editingId: null,
          showMyBusiness: true,
          mapFocusBusinessId: saved.id,
        });
        return saved;
      },

      removeBusiness: async (id) => {
        await removeBusinessFromApi(id);
        set((state) => {
          const businesses = state.businesses.filter((b) => b.id !== id);
          return {
            businesses,
            showMyBusiness: businesses.length > 0,
          };
        });
      },

      fetchBusinessesFromApi: async () => {
        const userId = await getCurrentUserId();
        if (!userId) {
          set({ businesses: [], showMyBusiness: false });
          return;
        }

        try {
          const existing = get().businesses;
          const existingById = new Map(existing.map((item) => [item.id, item]));
          const fromApi = await fetchMyBusinessesFromApi(userId);
          const merged = fromApi.map((item) =>
            mergeBusinessFromApi(item, existingById.get(item.id)),
          );

          set({
            businesses: merged,
            showMyBusiness: merged.length > 0,
          });
        } catch (error) {
          console.error("Не удалось загрузить бизнесы:", error);
        }
      },

      refreshBusinessBookings: async (businessId) => {
        if (!/^\d+$/.test(businessId)) return;

        const business = get().businesses.find((item) => item.id === businessId);
        if (!business) return;

        try {
          const bookingRequests = await fetchBusinessBookingsFromApi(
            Number(businessId),
            business.services,
          );

          set((state) => ({
            businesses: updateBusiness(state.businesses, businessId, (item) => ({
              ...item,
              bookingRequests,
              bookings: bookingRequests.filter(
                (booking) => booking.status === "accepted",
              ).length,
            })),
          }));
        } catch (error) {
          console.error("Не удалось обновить бронирования:", error);
        }
      },

      setShowMyBusiness: (value) => set({ showMyBusiness: value }),

      clearMapFocus: () => set({ mapFocusBusinessId: null }),

      clearBusinesses: () =>
        set({
          businesses: [],
          showMyBusiness: false,
          mapFocusBusinessId: null,
        }),

      addService: async (businessId, service) => {
        const created = await createServiceOnApi(businessId, service);
        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: [
              ...b.services,
              created ?? {
                ...service,
                id: crypto.randomUUID(),
                active: true,
                type: "service",
              },
            ],
          })),
        }));
      },

      addProduct: async (businessId, product) => {
        const created = await createProductOnApi(businessId, product);
        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: [
              ...b.services,
              created ?? {
                ...product,
                id: crypto.randomUUID(),
                active: true,
                type: "product",
              },
            ],
          })),
        }));
      },

      removeService: async (businessId, serviceId) => {
        const business = get().businesses.find((item) => item.id === businessId);
        const service = business?.services.find((item) => item.id === serviceId);
        if (service) {
          await removeServiceFromApi(serviceId, service.type);
        }

        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: b.services.filter((s) => s.id !== serviceId),
          })),
        }));
      },

      updateService: async (businessId, serviceId, partial) => {
        const business = get().businesses.find((item) => item.id === businessId);
        const current = business?.services.find((item) => item.id === serviceId);
        const updated = current
          ? await updateServiceOnApi(serviceId, { ...current, ...partial })
          : null;

        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: b.services.map((s) =>
              s.id === serviceId ? { ...s, ...partial, ...(updated ?? {}) } : s,
            ),
          })),
        }));
      },

      toggleService: async (businessId, serviceId, active) => {
        const business = get().businesses.find((item) => item.id === businessId);
        const current = business?.services.find((item) => item.id === serviceId);
        if (current) {
          await updateServiceOnApi(serviceId, { ...current, active });
        }

        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: b.services.map((s) =>
              s.id === serviceId ? { ...s, active } : s,
            ),
          })),
        }));
      },

      updateBookingStatus: async (businessId, bookingId, status) => {
        if (status === "accepted" || status === "cancelled") {
          await updateBusinessBookingStatusOnApi(bookingId, status);
        }

        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            bookingRequests: b.bookingRequests.map((req) =>
              req.id === bookingId ? { ...req, status } : req,
            ),
            bookings:
              status === "accepted" ? b.bookings + 1 : b.bookings,
          })),
        }));
      },
    }),
    {
      name: "business-storage",
      version: 3,
      migrate: (persisted) => {
        const state = persisted as { businesses?: SavedBusiness[] };
        if (!state?.businesses) return persisted;

        return {
          ...state,
          businesses: state.businesses.map((b) =>
            normalizeBusiness(b as SavedBusiness),
          ),
        };
      },
      partialize: (state) => ({
        businesses: state.businesses,
        showMyBusiness: state.showMyBusiness,
      }),
    },
  ),
);
