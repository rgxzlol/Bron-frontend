import { assets } from "@/lib/assets";
import type { StaticImageData } from "next/image";

export const supportContacts = {
  phone: "+998 77 960 89 07",
  email: "maverick902207@gmail.com",
  telegram: "maverick_hunter_ML",
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
    title: "Позвонить",
    description: "Позвоните нам по горячей линии",
    buttonText: "Позвонить",
    icon: assets.support.phone,
    href: `tel:${supportContacts.phone.replace(/\s/g, "")}`,
  },
  {
    id: "telegram",
    title: "Telegram",
    description: "Свяжитесь с нами в telegram",
    buttonText: "Открыть",
    icon: assets.support.tg,
    href: `https://t.me/${supportContacts.telegram}`,
    external: true,
  },
  {
    id: "email",
    title: "Email",
    description: "Отправьте нам письмо и мы ответим",
    buttonText: "Написать",
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
    question: "Как изменить или отменить бронь?",
    answer:
      "Перейдите в раздел «Мои брони», выберите нужную запись и нажмите «Изменить» или «Отменить». Отмена возможна не позднее чем за 2 часа до начала услуги.",
    icon: assets.support.book,
  },
  {
    id: "payment-methods",
    question: "Какие способы оплаты доступны?",
    answer:
      "Мы принимаем банковские карты Visa и Mastercard, а также оплату через Payme и Click. В некоторых заведениях доступна оплата на месте.",
    icon: assets.support.cardSupport,
  },
  {
    id: "view-bookings",
    question: "Где я могу посмотреть свои брони?",
    answer:
      "Все ваши бронирования отображаются в разделе «Мои брони» в боковом меню. Там вы увидите предстоящие и прошедшие записи.",
    icon: assets.support.bookandpen,
  },
  {
    id: "security",
    question: "Безопасность и конфиденциальность",
    answer:
      "Ваши данные защищены шифрованием. Мы не передаём личную информацию третьим лицам и используем её только для обработки бронирований.",
    icon: assets.support.securityIcon,
  },
];
