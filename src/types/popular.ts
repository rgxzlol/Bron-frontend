import type { StaticImageData } from "next/image";

export type PopularPlace = {
  id: number;
  title: string;
  rating: number;
  time: number;
  reviews: number;
  desc: string;
  img: StaticImageData;
};
