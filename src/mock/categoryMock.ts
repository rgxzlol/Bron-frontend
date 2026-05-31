import icons from "@/utils/images";

export interface Category {
  id: number
  title: string
  icon: string
  color?: string
  count: number
}

export const categories = [
  {
    id: 1,
    title: "Салон красоты",
    icon: icons.сategory1,
    color: "#ffd7d8",
    count: 150
  },
  {
    id: 2,
    title: "Здоровье",
    icon: icons.сategory2,
    color: "#e1c0ff",
    count: 98
  },
  {
    id: 3,
    title: "Фитнес зал",
    icon: icons.сategory3,
    color: "#bac5ff",
    count: 102
  },
  {
    id: 4,
    title: "Учебные заведения",
    icon: icons.сategory4,
    color: "#bac5ff",
    count: 102
  },
  {
    id: 5,
    title: "Рестораны",
    icon: icons.сategory5,
    color: "#b5ffb8",
    count: 102
  },
]