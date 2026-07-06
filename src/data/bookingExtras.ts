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
    name: "data.bookingExtras.isotonic.name",
    description: "data.bookingExtras.isotonic.description",
    price: 29000,
    image: assets.popular.photo1,
  },
  {
    id: "protein-bar",
    name: "data.bookingExtras.proteinBar.name",
    description: "data.bookingExtras.proteinBar.description",
    price: 18000,
    image: assets.popular.photo2,
  },
  {
    id: "protein-shake",
    name: "data.bookingExtras.proteinShake.name",
    description: "data.bookingExtras.proteinShake.description",
    price: 35000,
    image: assets.popular.photo3,
  },
  {
    id: "water",
    name: "data.bookingExtras.water.name",
    description: "data.bookingExtras.water.description",
    price: 8000,
    image: assets.hero.photo2,
  },
  {
    id: "towel",
    name: "data.bookingExtras.towel.name",
    description: "data.bookingExtras.towel.description",
    price: 15000,
    image: assets.map.photo1,
  },
];
