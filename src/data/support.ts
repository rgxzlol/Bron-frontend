import { assets } from "@/lib/assets";
import type { StaticImageData } from "next/image";

export const supportContacts = {
  phone: "+998 90 022 66 07",
  phoneHref: "tel:+998900226607",
  email: "Bron_Suport@gmail.com",
  telegram: "Muhammad_JI",
  telegramHref: "https://t.me/Muhammad_JI",
} as const;

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
