import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProfileLanguage = "ru" | "uz" | "en";
export type ProfileTheme = "light" | "dark";
export type CardBrand = "visa" | "mastercard";

export type NotificationSettings = {
  push: boolean;
  email: boolean;
  bookingReminder: boolean;
  promotions: boolean;
};

export type PaymentCard = {
  id: string;
  brand: CardBrand;
  numberMasked: string;
  expiresAt: string;
};

export type PaymentHistoryItem = {
  id: string;
  title: string;
  reference: string;
  amount: number;
  date: string;
};

type ProfileState = {
  fullName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  language: ProfileLanguage;
  theme: ProfileTheme;
  notifications: NotificationSettings;
  cards: PaymentCard[];
  paymentHistory: PaymentHistoryItem[];
  updatePersonalInfo: (payload: {
    fullName: string;
    phone: string;
    email: string;
  }) => void;
  setAvatarUrl: (avatarUrl: string | null) => void;
  setLanguage: (language: ProfileLanguage) => void;
  setTheme: (theme: ProfileTheme) => void;
  toggleNotification: (key: keyof NotificationSettings) => void;
  addCard: (payload: {
    holder: string;
    number: string;
    expiresAt: string;
  }) => void;
  removeCard: (id: string) => void;
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  push: true,
  email: true,
  bookingReminder: true,
  promotions: false,
};

const DEFAULT_PAYMENT_HISTORY: PaymentHistoryItem[] = [
  {
    id: "1",
    title: "Оплата бронирования",
    reference: "123123",
    amount: 80000,
    date: "12 мая 2026",
  },
  {
    id: "2",
    title: "Оплата бронирования",
    reference: "123124",
    amount: 80000,
    date: "10 мая 2026",
  },
];

function normalizeCardNumber(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 16);
}

function maskCardNumber(raw: string): string {
  const normalized = normalizeCardNumber(raw);
  const tail = normalized.slice(-4).padStart(4, "0");
  return `.... ${tail}`;
}

function detectBrand(number: string): CardBrand {
  const firstDigit = normalizeCardNumber(number)[0];
  return firstDigit === "5" ? "mastercard" : "visa";
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      fullName: "Иван Иванович",
      phone: "+998 99 999 99 99",
      email: "bron@gmail.com",
      avatarUrl: null,
      language: "ru",
      theme: "light",
      notifications: DEFAULT_NOTIFICATIONS,
      cards: [
        {
          id: "visa-4242",
          brand: "visa",
          numberMasked: ".... 4242",
          expiresAt: "09/12",
        },
        {
          id: "mc-7878",
          brand: "mastercard",
          numberMasked: ".... 7878",
          expiresAt: "09/12",
        },
      ],
      paymentHistory: DEFAULT_PAYMENT_HISTORY,

      updatePersonalInfo: ({ fullName, phone, email }) =>
        set({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        }),

      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),

      setLanguage: (language) => set({ language }),

      setTheme: (theme) => set({ theme }),

      toggleNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),

      addCard: ({ holder, number, expiresAt }) =>
        set((state) => ({
          cards: [
            {
              id: crypto.randomUUID(),
              brand: detectBrand(number),
              numberMasked: maskCardNumber(number),
              expiresAt: expiresAt.trim(),
            },
            ...state.cards,
          ],
        })),

      removeCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        })),
    }),
    {
      name: "profile-storage",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as Partial<ProfileState>;
        if (!state?.cards) {
          return {
            ...state,
            avatarUrl: state.avatarUrl ?? null,
          };
        }

        return {
          ...state,
          avatarUrl: state.avatarUrl ?? null,
          cards: state.cards.map((card) => ({
            ...card,
            brand: card.brand ?? ("visa" as CardBrand),
          })),
          paymentHistory: (state.paymentHistory ?? DEFAULT_PAYMENT_HISTORY).map(
            (item, index) => ({
              ...item,
              reference: item.reference ?? `12312${index + 3}`,
            }),
          ),
        };
      },
    },
  ),
);
