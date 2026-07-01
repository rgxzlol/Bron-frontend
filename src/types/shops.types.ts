import type { StaticImageData } from "next/image";

export type ShopService = {
  id: string;
  title: string;
  description: string;
  priceFrom: number;
  durationMin: number;
  icon?: StaticImageData | string;
};

export type ShopsType = {
  id: number;
  apiBusinessId?: number;
  apiBranchId?: number;
  title: string;
  lat: number;
  lng: number;
  img: StaticImageData | string;
  profilePhoto?: string | null;
  gallery?: string[];
  website?: string;
  type: string;
  desc: string;
  rating: number;
  reviews: number;
  hours: string;
  freeSeats: number;
  price: number;
  address: string;
  district: string;
  phone: string;
  category: string;
  distance: string;
  time: number;
  services?: ShopService[];
};
