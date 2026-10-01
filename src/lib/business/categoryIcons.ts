import {
  Bean,
  Cog,
  Clapperboard,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  Hospital,
  MoreHorizontal,
  Scissors,
  Shirt,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Array<[RegExp, LucideIcon]> = [
  [/beauty|salon|hair|салон красоты|красот|уход/i, Scissors],
  [/health|medical|medicine|clinic|hospital|здоров|медицин|клиник|больниц/i, HeartHandshake],
  [/fitness|sport|gym|фитнес|спорт|тренажер/i, Dumbbell],
  [/education|school|учеб|образован/i, GraduationCap],
  [/restaurant|food|ресторан|еда/i, Utensils],
  [/cafe|coffee|кафейн|кофе|кафе/i, Bean],
  [/auto|car service|авто|автосервис/i, Cog],
  [/cinema|movie|кинотеатр|кино/i, Clapperboard],
  [/pc club|computer|gaming|комп клуб|компьютер/i, Gamepad2],
  [/clean|клининг|уборк/i, Shirt],
  [/sanatorium|spa|wellness|санатор|спа/i, Hospital],
];

export function getBusinessCategoryIcon(category: string): LucideIcon {
  return (
    CATEGORY_ICONS.find(([pattern]) => pattern.test(category))?.[1] ??
    MoreHorizontal
  );
}
