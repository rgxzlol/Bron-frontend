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
];
