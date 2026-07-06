import { assets } from "@/lib/assets";
import type { PopularPlace } from "@/types/popular";

export const popularPlaces: PopularPlace[] = [
  {
    id: 1,
    shopId: 4,
    title: "data.popular.beautySalon.title",
    rating: 4.3,
    reviews: 132,
    time: 15,
    desc: "data.popular.beautySalon.desc",
    img: assets.popular.photo1,
  },
  {
    id: 2,
    shopId: 1,
    title: "data.popular.gym.title",
    rating: 4.6,
    reviews: 102,
    time: 15,
    desc: "data.popular.gym.desc",
    img: assets.popular.photo2,
  },
  {
    id: 3,
    shopId: 3,
    title: "data.popular.clinic.title",
    rating: 4.3,
    reviews: 132,
    time: 15,
    desc: "data.popular.clinic.desc",
    img: assets.popular.photo3,
  },
];
