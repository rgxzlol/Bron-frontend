"use client";

import { categories as fallbackCategories } from "@/data/categories";
import { assets } from "@/lib/assets";
import { fetchCategoriesWithCounts } from "@/lib/home/discovery";
import { pluralizeServices } from "@/lib/pluralize";
import { buildMapCategoryHref } from "@/lib/category/homeCategoryMap";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Category } from "@/types/category";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import s from "./homePage.module.css";

export default function Categories() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    void fetchCategoriesWithCounts()
      .then((nextCategories) => {
        if (!cancelled) {
          setCategories(nextCategories);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const renderCategoryCard = (category: Category) => (
    <Link
      key={category.id}
      href={buildMapCategoryHref(category.id)}
      className="min-w-40 gap-1.5 px-4.5 pt-6.5 pb-2.5 flex flex-1 flex-col items-center rounded-2xl text-center bg-white transition-all duration-300 hover:bg-[#F4F4F8]"
    >
      <div
        style={{ backgroundColor: category.color }}
        className={`${s.iconCircle} h-[75px] w-[75px] shrink-0 rounded-full`}
      >
        <Image
          src={category.icon}
          alt={category.title}
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
        />
      </div>

      <span className="line-clamp-2 min-h-12 font-semibold">
        {category.title}
      </span>

      <span className="text-[14px] opacity-75">
        {category.count} {pluralizeServices(category.count)}
      </span>
    </Link>
  );

  return (
    <section className={`${s.homeSection} my-8.75 scroll-mt-24`} id="categories">
      <h2 className="mb-15 w-full text-[24px] font-semibold">
        {t("home.categories")}
      </h2>

      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
          {categories.slice(0, 5).map(renderCategoryCard)}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="min-w-40 gap-1.5 px-4.5 pt-6.5 pb-2.5 flex flex-1 flex-col items-center rounded-2xl text-center text-nowrap bg-[#F4F4F8] transition-all duration-300 hover:bg-[#e2e2e2]"
            aria-expanded={isExpanded}
          >
            <div className={`${s.iconCircle} h-[75px] w-[75px] shrink-0 rounded-full bg-[#ffebd3]`}>
              <Image
                src={assets.categories.more}
                alt={t("home.allCategories")}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </div>

            <span className="min-h-12 font-semibold">
              {isExpanded ? t("common.less") : t("common.more")}
            </span>

            <span className="text-[14px] opacity-75">
              {isExpanded ? t("common.collapseHint") : t("common.viewAllHint")}
            </span>
          </button>
        </div>

        {isExpanded && (
          <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
            {categories.slice(5).map(renderCategoryCard)}
          </div>
        )}
      </div>
    </section>
  );
}
