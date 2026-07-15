import { assets } from "@/lib/assets";
import type { StaticImageData } from "next/image";

export const supportContacts = {
  phone: "+998 77 960 89 07",
  email: "maverick902207@gmail.com",
  telegram: "maverick_hunter_ML",
} as const;

export type SupportContact = {
  id: "phone" | "telegram" | "email";
  icon: StaticImageData;
  href: string;
  external?: boolean;
  /** Displayed as-is when set (e.g. phone number). */
  buttonText?: string;
};

export const supportContactCards: SupportContact[] = [
  {
    id: "phone",
    icon: assets.support.phone,
    href: `tel:${supportContacts.phone.replace(/\s/g, "")}`,
    buttonText: supportContacts.phone,
  },
  {
    id: "telegram",
    icon: assets.support.tg,
    href: `https://t.me/${supportContacts.telegram}`,
    external: true,
    buttonText: "Telegram",
  },
  {
    id: "email",
    icon: assets.support.email,
    href: `mailto:${supportContacts.email}`,
  },
];

export type FaqItem = {
  id: "change-booking" | "payment-methods" | "view-bookings" | "how-booking-works" | "security";
  icon: StaticImageData;
};

export const faqItems: FaqItem[] = [
  {
    id: "change-booking",
    icon: assets.support.book,
  },
  {
    id: "payment-methods",
    icon: assets.support.cardSupport,
  },
  {
    id: "view-bookings",
    icon: assets.support.bookandpen,
  },
  {
    id: "how-booking-works",
    icon: assets.support.clock,
  },
  {
    id: "security",
    icon: assets.support.securityIcon,
  },
];
