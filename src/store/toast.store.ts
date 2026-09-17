import { create } from "zustand";

export type ToastItem = {
  id: number;
  title: string;
  text?: string;
};

type ToastStore = {
  toasts: ToastItem[];
  showToast: (title: string, text?: string) => void;
  dismissToast: (id: number) => void;
};

const TOAST_AUTO_DISMISS_MS = 4000;

let nextToastId = 1;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  showToast: (title, text) => {
    const id = nextToastId++;
    set((state) => ({ toasts: [...state.toasts, { id, title, text }] }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, TOAST_AUTO_DISMISS_MS);
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
