import { assets } from "@/lib/assets";
import type { SavedBusiness } from "@/store/business.store";
import type { ShopsType } from "@/types/shops.types";

function hashId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash * 31 + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) + 10000;
}

function formatHours(business: SavedBusiness): string {
  const openDay = business.schedule.find((d) => d.isOpen);
  if (!openDay) return "Закрыто";
  return `${openDay.openTime} - ${openDay.closeTime}`;
}

export function businessToShop(business: SavedBusiness): ShopsType {
  const activeServices = business.services.filter((s) => s.active);
  const minPrice =
    activeServices.length > 0
      ? Math.min(...activeServices.map((s) => s.price))
      : 50000;

  return {
    id: hashId(business.id),
    title: business.name || "Бизнес",
    lat: business.lat,
    lng: business.lng,
    type: business.category || "Другое",
    img: assets.map.photo1,
    desc: business.description || "Описание отсутствует",
    rating: 0,
    reviews: 0,
    hours: formatHours(business),
    freeSeats: 10,
    price: minPrice,
    address: business.address || "Ташкент, Узбекистан",
    district: "Ташкент",
    phone: business.phone || "",
    category: business.category || "Услуги",
    distance: "—",
    time: 60,
    services: activeServices.map((service) => ({
      id: service.id,
      title: service.name,
      description: service.description,
      priceFrom: service.price,
      durationMin: 60,
    })),
  };
}
