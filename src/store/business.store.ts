import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createProductOnApi,
  createServiceOnApi,
  ensureWritableBusinessId,
  fetchBusinessBookingsFromApi,
  fetchMyBusinessesFromApi,
  getCustomerRatingFromApi,
  removeBusinessFromApi,
  removeServiceFromApi,
  saveBusinessDraftToApi,
  updateBusinessBookingAttendanceOnApi,
  updateBusinessBookingStatusOnApi,
  updateServiceOnApi,
} from "@/lib/api/businessSync";
import { getAuthToken } from "@/lib/api/token";
import { useNotificationStore } from "@/store/notification.store";
import { ApiError } from "@/lib/api/client";
import {
  apiCustomerRatingToStats,
  getCustomerDisplayName,
} from "@/lib/api/mappers";
import type {
  BookingAttendanceStatus,
  BookingOrderItem,
} from "@/lib/api/types";
import {
  formatUzbekPhoneInput,
  UZBEK_PHONE_PREFIX,
} from "@/lib/auth/validation";
import {
  DEFAULT_SCHEDULE,
  type DaySchedule,
} from "@/lib/business/schedule";
import { mergeBusinessFromApi } from "@/lib/business/photos";
import { isLegacyDemoBusiness } from "@/lib/business/legacyDemoBusiness";
import {
  hasValidCoords,
  normalizeCoords,
  resolveDraftCoords,
} from "@/lib/geocoding";

export const BUSINESS_CATEGORIES = [
  "Салон красоты",
  "Здоровье",
  "Фитнес зал",
  "Учебные заведения",
  "Рестораны",
  "Кафейни",
  "Авто сервис",
  "Кинотеатры",
  "Комп клуб",
  "Клининг",
  "Санатории",
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
  duration?: number;
  guestCapacity?: number;
  quantity?: number;
  dates?: string[];
  availability?: { date: string; times: string[] }[];
};

export type BusinessBookingRequest = {
  id: string;
  bookingId: number;
  customerId: number;
  customerAvatar?: string | null;
  customerRating?: number | null;
  customerReviewsCount?: number;
  customerEvaluatedBookingsCount?: number;
  customerOnTimeCount?: number;
  customerLateCount?: number;
  customerNoShowCount?: number;
  customerRatingStatsAvailable?: boolean;
  bookingDate?: string;
  endTime?: string;
  items?: BookingOrderItem[];
  time: string;
  customerName: string;
  serviceName: string;
  price: number;
  status: "pending" | "waiting" | "accepted" | "cancelled" | "completed";
  attendanceStatus?: BookingAttendanceStatus;
  extraWaitMinutes?: number;
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
  approvalStatus?: "pending" | "approved";
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

function withoutPersistedCustomerRatings(business: SavedBusiness): SavedBusiness {
  return {
    ...business,
    bookingRequests: business.bookingRequests.map((booking) => {
      const withoutRating = { ...booking };
      delete withoutRating.customerRating;
      delete withoutRating.customerReviewsCount;
      delete withoutRating.customerEvaluatedBookingsCount;
      delete withoutRating.customerOnTimeCount;
      delete withoutRating.customerLateCount;
      delete withoutRating.customerNoShowCount;
      delete withoutRating.customerRatingStatsAvailable;
      return withoutRating;
    }),
  };
}

type BusinessStore = {
  businesses: SavedBusiness[];
  hasLoadedBusinesses: boolean;
  draft: BusinessDraft;
  editingId: string | null;
  showMyBusiness: boolean;
  mapFocusBusinessId: string | null;
  updateDraft: (partial: Partial<BusinessDraft>) => void;
  updateBusinessViews: (businessId: string, views: number) => void;
  setBusinessViews: (businessId: string, views: number) => void;
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
    partial: Partial<
      Pick<
        BusinessService,
        | "name"
        | "category"
        | "price"
        | "description"
        | "photo"
        | "duration"
        | "guestCapacity"
        | "quantity"
        | "availability"
      >
    >,
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
  updateBookingAttendance: (
    businessId: string,
    bookingId: string,
    attendanceStatus: BookingAttendanceStatus,
  ) => Promise<void>;
};

function draftFromBusiness(business: SavedBusiness): BusinessDraft {
  return {
    profilePhoto: business.profilePhoto,
    name: business.name,
    description: business.description,
    category: business.category,
    website: business.website,
    phone: formatUzbekPhoneInput(business.phone, { keepPrefix: true }),
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

function countAcceptedBookings(bookings: BusinessBookingRequest[]) {
  return bookings.filter((booking) => booking.status === "accepted").length;
}

function notifyBusinessBookingStatus(
  businessId: string,
  booking: BusinessBookingRequest,
  status: string,
) {
  const normalized = status.toLowerCase();
  const isCancelled = normalized === "cancelled" || normalized === "rejected";
  const isConfirmed = normalized === "accepted" || normalized === "approved";

  useNotificationStore.getState().addLocalNotification({
    id: `local-business-booking-${businessId}-${booking.id}-${normalized}`,
    type: "booking",
    title: isCancelled
      ? "Пользователь отменил бронирование"
      : isConfirmed
        ? "Бронирование подтверждено"
        : "Новое бронирование",
    description: isCancelled
      ? `${booking.customerName} отменил бронирование на ${booking.time}`
      : isConfirmed
        ? `Бронирование клиента ${booking.customerName} подтверждено`
        : `Клиент ${booking.customerName} ожидает подтверждения`,
  });
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
      businesses: [],
      hasLoadedBusinesses: false,
      draft: createEmptyDraft(),
      editingId: null,
      showMyBusiness: false,
      mapFocusBusinessId: null,

      updateDraft: (partial) =>
        set((state) => ({ draft: { ...state.draft, ...partial } })),

      updateBusinessViews: (businessId, views) =>
        set((state) => {
          const currentBusiness = state.businesses.find(
            (business) => business.id === businessId,
          );
          if (!currentBusiness) return state;

          const nextViews = Math.max(currentBusiness.views, views);
          if (nextViews === currentBusiness.views) return state;

          return {
            businesses: state.businesses.map((business) =>
              business.id === businessId
                ? { ...business, views: nextViews }
                : business,
            ),
          };
        }),

      setBusinessViews: (businessId, views) =>
        set((state) => ({
          businesses: state.businesses.map((business) =>
            business.id === businessId ? { ...business, views } : business,
          ),
        })),

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

        if (!token) throw new ApiError(401, "Требуется авторизация");

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
      },

      removeBusiness: async (id) => {
        await removeBusinessFromApi(id);

        set((state) => {
          const remaining = state.businesses.filter((b) => b.id !== id);
          return {
            businesses: remaining,
            showMyBusiness: remaining.length > 0,
          };
        });
      },

      fetchBusinessesFromApi: async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
          const fromApi = await fetchMyBusinessesFromApi();
          const existingById = new Map(
            get().businesses.map((item) => [item.id, item]),
          );
          const merged = fromApi.map((item) =>
            mergeBusinessFromApi(item, existingById.get(item.id)),
          );
          merged.forEach((item) => {
            const previous = existingById.get(item.id);
            const previousBookings = new Map(
              previous?.bookingRequests.map((booking) => [booking.id, booking]) ?? [],
            );
            item.bookingRequests.forEach((booking) => {
              const oldBooking = previousBookings.get(booking.id);
              if (oldBooking && oldBooking.status !== booking.status) {
                notifyBusinessBookingStatus(item.id, booking, booking.status);
              } else if (!oldBooking) {
                notifyBusinessBookingStatus(item.id, booking, "pending");
              }
            });
          });
          set({
            businesses: merged,
            showMyBusiness: merged.length > 0,
            hasLoadedBusinesses: true,
          });
        } catch (error) {
          console.error("Не удалось загрузить бизнесы:", error);
          set({ hasLoadedBusinesses: true });
        }
      },

      refreshBusinessBookings: async (businessId) => {
        const business = get().businesses.find((item) => item.id === businessId);
        if (!business) return;

        if (!/^\d+$/.test(businessId)) return;

        let bookingRequests: BusinessBookingRequest[];
        try {
          bookingRequests = await fetchBusinessBookingsFromApi(
            Number(businessId),
            business.services,
          );
        } catch (error) {
          console.error("Не удалось обновить бронирования:", error);
          return;
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
          hasLoadedBusinesses: false,
          mapFocusBusinessId: null,
        }),

      addService: async (businessId, service) => {
        const current = get().getBusiness(businessId);
        if (!current) {
          throw new Error("Business not found");
        }

        let targetId = businessId;
        let writableBusiness: SavedBusiness | undefined;
        let canSyncToApi = false;

        try {
          const writable = await ensureWritableBusinessId(
            businessId,
            draftFromBusiness(current),
          );
          targetId = writable.id;
          canSyncToApi = true;
          if ("business" in writable) {
            writableBusiness = writable.business;
          }
        } catch (error) {
          console.warn(
            "Failed to ensure writable business for service, saving locally:",
            error,
          );
        }

        const created = canSyncToApi
          ? await createServiceOnApi(targetId, service)
          : null;
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
                  ...(writableBusiness ?? current),
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

        let targetId = businessId;
        let writableBusiness: SavedBusiness | undefined;
        let canSyncToApi = false;

        try {
          const writable = await ensureWritableBusinessId(
            businessId,
            draftFromBusiness(current),
          );
          targetId = writable.id;
          canSyncToApi = true;
          if ("business" in writable) {
            writableBusiness = writable.business;
          }
        } catch (error) {
          console.warn(
            "Failed to ensure writable business for product, saving locally:",
            error,
          );
        }

        const created = canSyncToApi
          ? await createProductOnApi(targetId, product)
          : null;
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
                  ...(writableBusiness ?? current),
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
        try {
          if (status === "accepted" || status === "cancelled") {
            await updateBusinessBookingStatusOnApi(bookingId, status);
          }
        } catch (error) {
          console.warn("Failed to update booking status:", error);
          await get().refreshBusinessBookings(businessId);
          throw error;
        }

        const currentBusiness = get().businesses.find(
          (item) => item.id === businessId,
        );
        const nextRequests = (currentBusiness?.bookingRequests ?? []).map(
          (request) =>
            request.id === bookingId ? { ...request, status } : request,
        );
        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (item) => ({
            ...item,
            bookingRequests: nextRequests,
            bookings: countAcceptedBookings(nextRequests),
          })),
        }));

        const updatedBooking = nextRequests.find((booking) => booking.id === bookingId);
        if (updatedBooking) {
          notifyBusinessBookingStatus(businessId, updatedBooking, status);
        }
      },

      updateBookingAttendance: async (businessId, bookingId, attendanceStatus) => {
        const business = get().businesses.find((item) => item.id === businessId);
        const booking = business?.bookingRequests.find((item) => item.id === bookingId);
        if (
          !business ||
          !booking ||
          booking.status === "cancelled" ||
          booking.attendanceStatus === attendanceStatus
        ) {
          return;
        }

        const updated = await updateBusinessBookingAttendanceOnApi(
          bookingId,
          attendanceStatus,
        );
        if (!updated) return;

        set((state) => ({
          businesses: updateBusiness(state.businesses, businessId, (item) => ({
            ...item,
            bookingRequests: item.bookingRequests.map((request) =>
              request.id === bookingId
                ? {
                    ...request,
                    attendanceStatus:
                      updated.attendance_status === "visited"
                        ? "on_time"
                        : updated.attendance_status,
                    extraWaitMinutes: updated.extra_wait_minutes,
                  }
                : request,
            ),
          })),
        }));

        try {
          const rating = await getCustomerRatingFromApi(booking.customerId);
          const stats = apiCustomerRatingToStats(rating);
          set((state) => ({
            businesses: updateBusiness(state.businesses, businessId, (item) => ({
              ...item,
              bookingRequests: item.bookingRequests.map((request) =>
                request.id === bookingId
                  ? {
                      ...request,
                      customerName: getCustomerDisplayName(
                        rating,
                        booking.customerId,
                      ),
                      customerRating: stats.rating,
                      customerEvaluatedBookingsCount:
                        stats.evaluatedBookingsCount,
                      customerOnTimeCount: stats.onTimeCount,
                      customerLateCount: stats.lateCount,
                      customerNoShowCount: stats.noShowCount,
                      customerRatingStatsAvailable: stats.available,
                    }
                  : request,
              ),
            })),
          }));
        } catch (error) {
          console.warn(
            `Attendance was saved, but customer rating could not be refreshed for customer ${booking.customerId}:`,
            error,
          );
        }
      },
    }),
    {
      name: "business-storage",
      version: 8,
      migrate: (persisted) => {
        const state = persisted as {
          businesses?: SavedBusiness[];
          showMyBusiness?: boolean;
        };
        if (!state) return persisted;

        const businesses = (state.businesses ?? [])
          .filter((business) => !isLegacyDemoBusiness(business))
          .map((b) =>
            withoutPersistedCustomerRatings(
              normalizeBusiness(b as SavedBusiness),
            ),
          );

        return {
          ...state,
          businesses,
          showMyBusiness: businesses.length > 0,
        };
      },
      merge: (persisted, current) => {
        const state = persisted as Partial<BusinessStore> | undefined;
        const businesses = (state?.businesses ?? [])
          .filter((business) => !isLegacyDemoBusiness(business))
          .map((business) =>
            withoutPersistedCustomerRatings(normalizeBusiness(business)),
          );

        return {
          ...current,
          ...state,
          businesses,
          showMyBusiness: businesses.length > 0,
        };
      },
      partialize: (state) => ({
        businesses: state.businesses.map(withoutPersistedCustomerRatings),
        showMyBusiness: state.showMyBusiness,
      }),
    },
  ),
);
