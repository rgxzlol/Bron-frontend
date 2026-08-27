import { assets } from "@/lib/assets";
import type { Category } from "@/types/category";

export const categories: Category[] = [
  {
    id: 1,
    title: "Салон красоты",
    icon: assets.categories.hairCare,
    color: "#ffd7d8",
    count: 150,
  },
  {
    id: 2,
    title: "Здоровье",
    icon: assets.categories.health,
    color: "#e1c0ff",
    count: 98,
  },
  {
    id: 3,
    title: "Фитнес зал",
    icon: assets.categories.gym,
    color: "#bac5ff",
    count: 102,
  },
  {
    id: 4,
    title: "Учебные заведения",
    icon: assets.categories.education,
    color: "#bac5ff",
    count: 102,
  },
  {
    id: 5,
    title: "Рестораны",
    icon: assets.categories.food,
    color: "#b5ffb8",
    count: 102,
  },
  {
    id: 6,
    title: "Кафейни",
    icon: assets.categories.coffee,
    color: "#E0A500",
    count: 20,
  },
  {
    id: 7,
    title: "Авто сервис",
    icon: assets.categories.autoService,
    color: "#00C8F0",
    count: 105,
  },
  {
    id: 8,
    title: "Кинотеатры",
    icon: assets.categories.cinema,
    color: "#BAC5FF",
    count: 123,
  },
  {
    id: 9,
    title: "Комп клуб",
    icon: assets.categories.pcClub,
    color: "#C493FF",
    count: 50,
  },
  {
    id: 10,
    title: "Клининг",
    icon: assets.categories.cleaning,
    color: "#FFB4B4",
    count: 132,
  },
  {
    id: 11,
    title: "Санатории",
    icon: assets.categories.sanatoriums,
    color: "#B5FFB8",
    count: 102,
  },
];
