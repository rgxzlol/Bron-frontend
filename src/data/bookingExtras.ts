import { assets } from "@/lib/assets";
import type { StaticImageData } from "next/image";

export type BookingExtra = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: StaticImageData;
};

export const bookingExtras: BookingExtra[] = [
  {
    id: "isotonic",
    name: "Изотоник",
    description: "Освежающий спортивный напиток",
    price: 29000,
    image: assets.popular.photo1,
  },
  {
    id: "protein-bar",
    name: "Протеиновый батончик",
    description: "Полезный перекус после тренировки",
    price: 18000,
    image: assets.popular.photo2,
  },
  {
    id: "protein-shake",
    name: "Протеиновый коктейль",
    description: "Восстановление мышц после нагрузки",
    price: 35000,
    image: assets.popular.photo3,
  },
  {
    id: "water",
    name: "Минеральная вода",
    description: "0.5 л, без газа",
    price: 8000,
    image: assets.hero.photo2,
  },
  {
    id: "towel",
    name: "Полотенце",
    description: "Аренда на время посещения",
    price: 15000,
    image: assets.map.photo1,
  },
];
