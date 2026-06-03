import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_SCHEDULE,
  type DaySchedule,
} from "@/lib/business/schedule";

export const BUSINESS_CATEGORIES = [
  "Спорт зал",
  "Красота",
  "Здоровье",
  "Образование",
  "Еда",
  "Другое",
] as const;

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

type BusinessStore = {
  businesses: SavedBusiness[];
  draft: BusinessDraft;
  showMyBusiness: boolean;
  updateDraft: (partial: Partial<BusinessDraft>) => void;
  setDraftSchedule: (schedule: DaySchedule[]) => void;
  resetDraft: () => void;
  saveDraft: () => SavedBusiness;
  removeBusiness: (id: string) => void;
  setShowMyBusiness: (value: boolean) => void;
};

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      businesses: [],
      draft: createEmptyDraft(),
      showMyBusiness: false,

      updateDraft: (partial) =>
        set((state) => ({ draft: { ...state.draft, ...partial } })),

      setDraftSchedule: (schedule) =>
        set((state) => ({ draft: { ...state.draft, schedule } })),

      resetDraft: () => set({ draft: createEmptyDraft() }),

      saveDraft: () => {
        const { draft, businesses } = get();
        const saved: SavedBusiness = {
          ...draft,
          id: crypto.randomUUID(),
          status: "confirmed",
          bookings: 0,
          views: 0,
        };
        set({
          businesses: [...businesses, saved],
          draft: createEmptyDraft(),
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
    }),
    { name: "business-storage" },
  ),
);
