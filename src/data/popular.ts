import { assets } from "@/lib/assets";
import type { PopularPlace } from "@/types/popular";

export const popularPlaces: PopularPlace[] = [
  {
    id: 1,
    shopId: 4,
    title: "Салон красоты",
    rating: 4.3,
    reviews: 132,
    time: 15,
    desc: "Специализированное помещение, оборудованное для занятий физической культурой",
    img: assets.popular.photo1,
  },
  {
    id: 2,
    shopId: 1,
    title: "Фитнес зал",
    rating: 4.6,
    reviews: 102,
    time: 15,
    desc: "Специализированное помещение, оборудованное для занятий физической культурой",
    img: assets.popular.photo2,
  },
  {
    id: 3,
    shopId: 3,
    title: "Клиника",
    rating: 4.3,
    reviews: 132,
    time: 15,
    desc: "Специализированное помещение, оборудованное для занятий физической культурой",
    img: assets.popular.photo3,
  },
];
