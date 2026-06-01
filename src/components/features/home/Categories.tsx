import { categories } from "@/data/categories";
import { assets } from "@/lib/assets";
import { pluralizeServices } from "@/lib/pluralize";
import { routes } from "@/config/routes";
import Image from "next/image";
import Link from "next/link";
import s from "./categories.module.css";

export default function Categories() {
  return (
    <section className="my-[35px]">
      <h2 className="mb-[60px] text-[24px] font-semibold">
        Категории
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(130px,_1fr))] gap-[50px]">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={routes.home}
            className={`${s.links} flex w-full flex-col items-center gap-1 py-[15px] text-center`}
          >
            <div
              style={{ backgroundColor: category.color }}
              className="max-w-[75px] rounded-full p-[22px]"
            >
              <Image src={category.icon} alt={category.title} />
            </div>

            <span className="min-h-[64px] font-semibold">
              {category.title}
            </span>

            <span className="text-[14px] opacity-75">
              {category.count} {pluralizeServices(category.count)}
            </span>
          </Link>
        ))}
        <Link
          href={routes.home}
          className={`${s.links} flex w-full flex-col items-center gap-1 py-[15px] text-center`}
        >
          <div className="max-w-[75px] rounded-full bg-[#ffebd3] p-[22px]">
            <Image src={assets.categories.more} alt="Все категории" />
          </div>

          <span className="min-h-[64px] font-semibold">
            Больше
          </span>

          <span className="text-[14px] opacity-75">
            Посмотреть все
          </span>
        </Link>
      </div>
    </section>
  );
}