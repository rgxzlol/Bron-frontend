import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createProductOnApi,
  createServiceOnApi,
  ensureWritableBusinessId,
  fetchBusinessBookingsFromApi,
  fetchMyBusinessesFromApi,
  getCurrentUserId,
  removeBusinessFromApi,
  removeServiceFromApi,
  saveBusinessDraftToApi,
  updateBusinessBookingStatusOnApi,
  updateServiceOnApi,
} from "@/lib/api/businessSync";
import { getFallbackBusinessBookings } from "@/lib/business/demoBookings";
import {
  getDemoSavedBusiness,
  isPlaceholderDemoBusiness,
} from "@/lib/business/demoBusiness";
import { getAuthToken } from "@/lib/api/token";
import { ApiError } from "@/lib/api/client";
import { UZBEK_PHONE_PREFIX } from "@/lib/auth/validation";
import { GeocodingError } from "@/lib/geocoding";
import {
  DEFAULT_SCHEDULE,
  type DaySchedule,
} from "@/lib/business/schedule";
import { mergeBusinessFromApi } from "@/lib/business/photos";
import {
  hasValidCoords,
  normalizeCoords,
  resolveDraftCoords,
} from "@/lib/geocoding";

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
  guestCapacity?: number;
  quantity?: number;
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
  phone: UZBEK_PHONE_PREFIX,
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
  ) => Promise<string>;
  addProduct: (
    businessId: string,
    product: Omit<BusinessService, "id" | "active" | "type">,
  ) => Promise<string>;
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

function resolveBusinessesWithDemo(
  businesses: SavedBusiness[],
  previous: SavedBusiness[] = [],
) {
  if (businesses.length > 0) {
    return businesses;
  }

  const previousDemo = previous.find(isPlaceholderDemoBusiness);
  return [previousDemo ? normalizeBusiness(previousDemo) : getDemoSavedBusiness()];
}

function replaceBusiness(
  businesses: SavedBusiness[],
  previousId: string | null,
  saved: SavedBusiness,
) {
  const next = businesses.filter(
    (business) => business.id !== saved.id && business.id !== previousId,
  );
  return [...next, saved];
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      businesses: [getDemoSavedBusiness()],
      draft: createEmptyDraft(),
      editingId: null,
      showMyBusiness: true,
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

        const persistLocally = async (): Promise<SavedBusiness> => {
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
        };

        if (token) {
          try {
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

            set({
              businesses: replaceBusiness(businesses, editingId, normalized),
              draft: createEmptyDraft(),
              editingId: null,
              showMyBusiness: true,
              mapFocusBusinessId: normalized.id,
            });
            return normalized;
          } catch (error) {
            if (error instanceof GeocodingError || error instanceof ApiError) {
              throw error;
            }

            console.warn("API business save failed, using local fallback:", error);
            return persistLocally();
          }
        }

        return persistLocally();
      },

      removeBusiness: async (id) => {
        try {
          await removeBusinessFromApi(id);
        } catch (error) {
          console.warn("API business delete failed, removing locally:", error);
        }

        set((state) => {
          const remaining = state.businesses.filter((b) => b.id !== id);
          const businesses = resolveBusinessesWithDemo(remaining, state.businesses);
          return {
            businesses,
            showMyBusiness: businesses.length > 0,
          };
        });
      },

      fetchBusinessesFromApi: async () => {
        const token = getAuthToken();
        if (!token) return;

        const userId = await getCurrentUserId();
        if (!userId) return;

        try {
          const existing = get().businesses;
          const existingById = new Map(existing.map((item) => [item.id, item]));
          const fromApi = await fetchMyBusinessesFromApi(userId);
          const merged = fromApi.map((item) =>
            mergeBusinessFromApi(item, existingById.get(item.id)),
          );
          const apiIds = new Set(merged.map((item) => item.id));
          const localOnly = existing.filter(
            (item) =>
              !apiIds.has(item.id) && !isPlaceholderDemoBusiness(item),
          );
          const businesses = resolveBusinessesWithDemo(
            merged.length > 0 ? [...merged, ...localOnly] : localOnly,
            existing,
          );

          set({
            businesses,
            showMyBusiness: businesses.length > 0,
          });
        } catch (error) {
          console.error("Не удалось загрузить бизнесы:", error);
          const current = get().businesses;
          const businesses = resolveBusinessesWithDemo(current, current);
          set({ businesses, showMyBusiness: businesses.length > 0 });
        }
      },

      refreshBusinessBookings: async (businessId) => {
        const business = get().businesses.find((item) => item.id === businessId);
        if (!business) return;

        let bookingRequests: BusinessBookingRequest[] = [];

        if (/^\d+$/.test(businessId)) {
          try {
            bookingRequests = await fetchBusinessBookingsFromApi(
              Number(businessId),
              business.services,
            );
          } catch (error) {
            console.error("Не удалось обновить бронирования:", error);
          }
        }

        if (bookingRequests.length === 0) {
          bookingRequests = getFallbackBusinessBookings(business.services);
        }

        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (item) => ({
            ...item,
            bookingRequests,
            bookings: bookingRequests.filter(
              (booking) => booking.status === "accepted",
            ).length,
          })),
        }));
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
        const current = get().getBusiness(businessId);
        if (!current) {
          throw new Error("Business not found");
        }

        const writable = await ensureWritableBusinessId(
          businessId,
          draftFromBusiness(current),
        );
        const targetId = writable.id;
        const created = await createServiceOnApi(targetId, service);
        const nextItem = created ?? {
          ...service,
          id: crypto.randomUUID(),
          active: true,
          type: "service" as const,
        };

        set((state) => {
          const businesses =
            targetId === businessId
              ? state.businesses
              : replaceBusiness(state.businesses, businessId, {
                  ...current,
                  ...("business" in writable ? writable.business : current),
                  id: targetId,
                });

          return {
            businesses: updateBusiness(businesses, targetId, (b) => ({
              ...b,
              services: [...b.services, nextItem],
            })),
          };
        });

        return targetId;
      },

      addProduct: async (businessId, product) => {
        const current = get().getBusiness(businessId);
        if (!current) {
          throw new Error("Business not found");
        }

        const writable = await ensureWritableBusinessId(
          businessId,
          draftFromBusiness(current),
        );
        const targetId = writable.id;
        const created = await createProductOnApi(targetId, product);
        const nextItem = created ?? {
          ...product,
          id: crypto.randomUUID(),
          active: true,
          type: "product" as const,
        };

        set((state) => {
          const businesses =
            targetId === businessId
              ? state.businesses
              : replaceBusiness(state.businesses, businessId, {
                  ...current,
                  ...("business" in writable ? writable.business : current),
                  id: targetId,
                });

          return {
            businesses: updateBusiness(businesses, targetId, (b) => ({
              ...b,
              services: [...b.services, nextItem],
            })),
          };
        });

        return targetId;
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
        if (!current) return;

        const previous = { ...current };

        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: b.services.map((s) =>
              s.id === serviceId ? { ...s, ...partial } : s,
            ),
          })),
        }));

        try {
          const updated = await updateServiceOnApi(serviceId, {
            ...current,
            ...partial,
          });
          if (updated) {
            set((state) => ({
              businesses: updateBusiness(state.businesses, businessId, (b) => ({
                ...b,
                services: b.services.map((s) =>
                  s.id === serviceId ? { ...s, ...partial, ...updated } : s,
                ),
              })),
            }));
          }
        } catch (error) {
          console.warn("Failed to update service:", error);
          set((state) => ({
            businesses: updateBusiness(state.businesses, businessId, (b) => ({
              ...b,
              services: b.services.map((s) =>
                s.id === serviceId ? previous : s,
              ),
            })),
          }));
          throw error;
        }
      },

      toggleService: async (businessId, serviceId, active) => {
        const business = get().businesses.find((item) => item.id === businessId);
        const current = business?.services.find((item) => item.id === serviceId);
        if (!current) return;

        const previousActive = current.active;

        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (b) => ({
            ...b,
            services: b.services.map((s) =>
              s.id === serviceId ? { ...s, active } : s,
            ),
          })),
        }));

        try {
          await updateServiceOnApi(serviceId, { ...current, active });
        } catch (error) {
          console.warn("Failed to toggle service status:", error);
          set((state) => ({
            businesses: updateBusiness(state.businesses, businessId, (b) => ({
              ...b,
              services: b.services.map((s) =>
                s.id === serviceId ? { ...s, active: previousActive } : s,
              ),
            })),
          }));
        }
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
      version: 4,
      migrate: (persisted) => {
        const state = persisted as {
          businesses?: SavedBusiness[];
          showMyBusiness?: boolean;
        };
        if (!state) return persisted;

        const businesses = resolveBusinessesWithDemo(
          (state.businesses ?? []).map((b) =>
            normalizeBusiness(b as SavedBusiness),
          ),
        );

        return {
          ...state,
          businesses,
          showMyBusiness: businesses.length > 0 ? true : state.showMyBusiness,
        };
      },
      partialize: (state) => ({
        businesses: state.businesses,
        showMyBusiness: state.showMyBusiness,
      }),
    },
  ),
);
