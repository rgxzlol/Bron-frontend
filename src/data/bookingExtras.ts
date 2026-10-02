export type BookingExtra = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export const bookingExtras: BookingExtra[] = [
  {
    id: "isotonic",
    name: "Изотоник",
    description: "Освежающий спортивный напиток",
    price: 29000,
  },
  {
    id: "protein-bar",
    name: "Протеиновый батончик",
    description: "Полезный перекус после тренировки",
    price: 18000,
  },
  {
    id: "protein-shake",
    name: "Протеиновый коктейль",
    description: "Восстановление мышц после нагрузки",
    price: 35000,
  },
  {
    id: "water",
    name: "Минеральная вода",
    description: "0.5 л, без газа",
    price: 8000,
  },
  {
    id: "towel",
    name: "Полотенце",
    description: "Аренда на время посещения",
    price: 15000,
  },
];
