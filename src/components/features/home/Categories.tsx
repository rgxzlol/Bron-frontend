"use client";
import { categories } from "@/data/categories";
import { assets } from "@/lib/assets";
import { pluralizeServices } from "@/lib/pluralize";
import { routes } from "@/config/routes";
import type { Category } from "@/types/category";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Categories() {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderCategoryCard = (category: Category) => (
    <Link
      key={category.id}
      href={routes.home}
      className="min-w-40 gap-1.5 px-4.5 pt-6.5 pb-2.5 flex flex-1 flex-col items-center rounded-2xl text-center bg-white transition-all duration-300 hover:bg-[#F4F4F8]"
    >
      <div
        style={{ backgroundColor: category.color }}
        className="flex h-18.75 w-18.75 items-center justify-center rounded-full"
      >
        <Image
          src={category.icon}
          alt={category.title}
          width={32}
          height={32}
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
    <section className="my-8.75" id="categories">
      <h2 className="mb-15 text-[24px] font-semibold">
        Категории
      </h2>

      <div className="flex flex-col gap-4">
        <div className="flex flex-nowrap gap-4">
          {categories.slice(0, 5).map(renderCategoryCard)}

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="min-w-40 gap-1.5 px-4.5 pt-6.5 pb-2.5 flex flex-1 flex-col items-center rounded-2xl text-center text-nowrap bg-[#F4F4F8] transition-all duration-300 hover:bg-[#e2e2e2]"
          >
            <div className="flex h-18.75 w-18.75 items-center justify-center rounded-full bg-[#ffebd3]">
              <Image
                src={assets.categories.more}
                alt="Все категории"
                width={32}
                height={32}
              />
            </div>

            <span className="min-h-12 font-semibold">
              {isExpanded ? 'Меньше' : 'Больше'}
            </span>

            <span className="text-[14px] opacity-75">
              {isExpanded ? 'Вернуться обратно' : 'Посмотреть все'}
            </span>
          </button>
        </div>

        {isExpanded && (
          <div className="flex flex-nowrap gap-4">
            {categories.slice(5).map(renderCategoryCard)}
          </div>
        )}
      </div>
    </section>
  );
}