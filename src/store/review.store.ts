import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReviewTag =
  | "equipment"
  | "location"
  | "cleanliness"
  | "staff"
  | "atmosphere"
  | "price"
  | "service"
  | "other";

export const REVIEW_MAX_LENGTH = 500;

export type ReviewDraft = {
  rating: number;
  text: string;
  authorName: string;
  photos: string[];
  tags: ReviewTag[];
};

export type SubmittedReview = ReviewDraft & {
  id: string;
  shopId?: string;
  shopName?: string;
  bookingId?: number;
  createdAt: string;
};

type ShopReviewStats = {
  ratingSum: number;
  count: number;
};

const EMPTY_DRAFT: ReviewDraft = {
  rating: 0,
  text: "",
  authorName: "",
  photos: [],
  tags: [],
};

type ReviewState = {
  draft: ReviewDraft;
  reviews: SubmittedReview[];
  reviewedBookingIds: number[];
  shopReviewStats: Record<string, ShopReviewStats>;
  setRating: (rating: number) => void;
  setText: (text: string) => void;
  setAuthorName: (authorName: string) => void;
  toggleTag: (tag: ReviewTag) => void;
  addPhoto: (url: string) => void;
  removePhoto: (index: number) => void;
  resetDraft: () => void;
  hasReviewedBooking: (bookingId: number) => boolean;
  submitReview: (meta?: {
    shopId?: string;
    shopName?: string;
    bookingId?: number;
  }) => boolean;
};

export const REVIEW_TAG_LABEL_KEYS: Record<ReviewTag, string> = {
  equipment: "review.tagEquipment",
  location: "review.tagLocation",
  cleanliness: "review.tagCleanliness",
  staff: "review.tagStaff",
  atmosphere: "review.tagAtmosphere",
  price: "review.tagPrice",
  service: "review.tagService",
  other: "review.tagOther",
};

export const REVIEW_TAGS: { id: ReviewTag; labelKey: string }[] = [
  { id: "equipment", labelKey: REVIEW_TAG_LABEL_KEYS.equipment },
  { id: "location", labelKey: REVIEW_TAG_LABEL_KEYS.location },
  { id: "cleanliness", labelKey: REVIEW_TAG_LABEL_KEYS.cleanliness },
  { id: "staff", labelKey: REVIEW_TAG_LABEL_KEYS.staff },
  { id: "atmosphere", labelKey: REVIEW_TAG_LABEL_KEYS.atmosphere },
  { id: "price", labelKey: REVIEW_TAG_LABEL_KEYS.price },
  { id: "service", labelKey: REVIEW_TAG_LABEL_KEYS.service },
  { id: "other", labelKey: REVIEW_TAG_LABEL_KEYS.other },
];

export function getEffectiveShopRating(
  shopId: number | string,
  baseRating: number,
  baseReviews: number,
  statsMap?: Record<string, ShopReviewStats>,
) {
  const stats = (statsMap ?? useReviewStore.getState().shopReviewStats)[String(shopId)];
  if (!stats || stats.count === 0) {
    return { rating: baseRating, reviews: baseReviews };
  }

  const reviews = baseReviews + stats.count;
  const rating =
    reviews > 0 ? (baseRating * baseReviews + stats.ratingSum) / reviews : baseRating;

  return { rating, reviews };
}

function createReviewId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      draft: EMPTY_DRAFT,
      reviews: [],
      reviewedBookingIds: [],
      shopReviewStats: {},

      setRating: (rating) =>
        set((state) => ({
          draft: { ...state.draft, rating },
        })),

      setText: (text) =>
        set((state) => ({
          draft: { ...state.draft, text: text.slice(0, REVIEW_MAX_LENGTH) },
        })),

      setAuthorName: (authorName) =>
        set((state) => ({
          draft: { ...state.draft, authorName },
        })),

      toggleTag: (tag) =>
        set((state) => {
          const tags = state.draft.tags.includes(tag)
            ? state.draft.tags.filter((item) => item !== tag)
            : [...state.draft.tags, tag];
          return { draft: { ...state.draft, tags } };
        }),

      addPhoto: (url) =>
        set((state) => ({
          draft: {
            ...state.draft,
            photos: [...state.draft.photos, url].slice(0, 5),
          },
        })),

      removePhoto: (index) =>
        set((state) => ({
          draft: {
            ...state.draft,
            photos: state.draft.photos.filter((_, i) => i !== index),
          },
        })),

      resetDraft: () => set({ draft: EMPTY_DRAFT }),

      hasReviewedBooking: (bookingId) =>
        get().reviewedBookingIds.includes(bookingId),

      submitReview: (meta) => {
        const { draft } = get();
        if (!draft.rating || !draft.text.trim() || !draft.authorName.trim()) {
          return false;
        }

        if (meta?.bookingId && get().reviewedBookingIds.includes(meta.bookingId)) {
          return false;
        }

        const review: SubmittedReview = {
          ...draft,
          text: draft.text.trim(),
          authorName: draft.authorName.trim(),
          id: createReviewId(),
          shopId: meta?.shopId,
          shopName: meta?.shopName,
          bookingId: meta?.bookingId,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const shopKey = meta?.shopId;
          const nextShopStats = { ...state.shopReviewStats };

          if (shopKey) {
            const prev = nextShopStats[shopKey] ?? { ratingSum: 0, count: 0 };
            nextShopStats[shopKey] = {
              ratingSum: prev.ratingSum + draft.rating,
              count: prev.count + 1,
            };
          }

          return {
            reviews: [review, ...state.reviews],
            reviewedBookingIds:
              meta?.bookingId != null
                ? [...state.reviewedBookingIds, meta.bookingId]
                : state.reviewedBookingIds,
            shopReviewStats: nextShopStats,
            draft: EMPTY_DRAFT,
          };
        });

        return true;
      },
    }),
    {
      name: "review-storage",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<ReviewState>;
        return {
          ...state,
          reviewedBookingIds: state.reviewedBookingIds ?? [],
          shopReviewStats: state.shopReviewStats ?? {},
        };
      },
    },
  ),
);
