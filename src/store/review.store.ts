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
  createdAt: string;
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
  setRating: (rating: number) => void;
  setText: (text: string) => void;
  setAuthorName: (authorName: string) => void;
  toggleTag: (tag: ReviewTag) => void;
  addPhoto: (url: string) => void;
  removePhoto: (index: number) => void;
  resetDraft: () => void;
  submitReview: (meta?: { shopId?: string; shopName?: string }) => void;
};

export const REVIEW_TAGS: { id: ReviewTag; label: string }[] = [
  { id: "equipment", label: "Оборудование" },
  { id: "location", label: "Расположение" },
  { id: "cleanliness", label: "Чистота" },
  { id: "staff", label: "Персонал" },
  { id: "atmosphere", label: "Атмосфера" },
  { id: "price", label: "Цена" },
  { id: "service", label: "Услуга" },
  { id: "other", label: "Другое" },
];

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      draft: EMPTY_DRAFT,
      reviews: [],

      setRating: (rating) =>
        set((state) => ({
          draft: { ...state.draft, rating },
        })),

      setText: (text) =>
        set((state) => ({
          draft: { ...state.draft, text: text.slice(0, 500) },
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

      submitReview: (meta) => {
        const { draft } = get();
        if (!draft.rating || !draft.text.trim() || !draft.authorName.trim()) return;

        const review: SubmittedReview = {
          ...draft,
          text: draft.text.trim(),
          authorName: draft.authorName.trim(),
          id: crypto.randomUUID(),
          shopId: meta?.shopId,
          shopName: meta?.shopName,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          reviews: [review, ...state.reviews],
          draft: EMPTY_DRAFT,
        }));
      },
    }),
    {
      name: "review-storage",
      version: 1,
    },
  ),
);
