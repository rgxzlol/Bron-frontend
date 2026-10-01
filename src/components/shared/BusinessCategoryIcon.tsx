import { createElement } from "react";
import type { LucideProps } from "lucide-react";
import { getBusinessCategoryIcon } from "@/lib/business/categoryIcons";

type BusinessCategoryIconProps = LucideProps & {
  category: string;
};

export default function BusinessCategoryIcon({
  category,
  color = "#243b53",
  strokeWidth = 2.4,
  strokeLinecap = "round",
  strokeLinejoin = "round",
  ...props
}: BusinessCategoryIconProps) {
  return createElement(getBusinessCategoryIcon(category), {
    ...props,
    color,
    strokeWidth,
    strokeLinecap,
    strokeLinejoin,
  });
}
