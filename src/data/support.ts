import { assets } from "@/lib/assets";
import type { StaticImageData } from "next/image";

export const supportContacts = {
  phone: "+998 99 999 99 99",
  email: "support@bron.uz",
  telegram: "bron_support",
} as const;

export type SupportContact = {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  icon: StaticImageData;
  href: string;
  external?: boolean;
};

export const supportContactCards: SupportContact[] = [
  {
    id: "phone",
    title: "data.support.contacts.phone.title",
    description: "data.support.contacts.phone.description",
    buttonText: supportContacts.phone,
    icon: assets.support.phone,
    href: `tel:${supportContacts.phone.replace(/\s/g, "")}`,
  },
  {
    id: "telegram",
    title: "data.support.contacts.telegram.title",
    description: "data.support.contacts.telegram.description",
    buttonText: "data.support.contacts.telegram.buttonText",
    icon: assets.support.tg,
    href: `https://t.me/${supportContacts.telegram}`,
    external: true,
  },
  {
    id: "email",
    title: "data.support.contacts.email.title",
    description: "data.support.contacts.email.description",
    buttonText: "data.support.contacts.email.buttonText",
    icon: assets.support.email,
    href: `mailto:${supportContacts.email}?subject=${encodeURIComponent("Обращение в поддержку Bron")}`,
  },
];

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  icon: StaticImageData;
};

export const faqItems: FaqItem[] = [
  {
    id: "change-booking",
    question: "data.support.faq.changeBooking.question",
    answer:
      "data.support.faq.changeBooking.answer",
    icon: assets.nav.booking,
  },
  {
    id: "payment-methods",
    question: "data.support.faq.paymentMethods.question",
    answer:
      "data.support.faq.paymentMethods.answer",
    icon: assets.support.email,
  },
  {
    id: "view-bookings",
    question: "data.support.faq.viewBookings.question",
    answer:
      "data.support.faq.viewBookings.answer",
    icon: assets.nav.map,
  },
  {
    id: "how-booking-works",
    question: "data.support.faq.howBookingWorks.question",
    answer:
      "data.support.faq.howBookingWorks.answer",
    icon: assets.popular.timeIcon,
  },
  {
    id: "security",
    question: "data.support.faq.security.question",
    answer:
      "data.support.faq.security.answer",
    icon: assets.map.security,
  },
];
