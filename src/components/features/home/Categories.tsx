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

      <div className="flex flex-nowrap gap-[50px]">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={routes.home}
            className={`${s.links} flex min-w-[130px] flex-1 flex-col items-center gap-2 py-[15px] text-center`}
          >
            <div
              style={{ backgroundColor: category.color }}
              className="flex h-[75px] w-[75px] items-center justify-center rounded-full"
            >
              <Image
                src={category.icon}
                alt={category.title}
                width={32}
                height={32}
              />
            </div>

            <span className="line-clamp-2 min-h-[48px] font-semibold">
              {category.title}
            </span>

            <span className="text-[14px] opacity-75">
              {category.count} {pluralizeServices(category.count)}
            </span>
          </Link>
        ))}

        <Link
          href={routes.home}
          className={`${s.links} flex min-w-[130px] flex-1 flex-col items-center gap-2 py-[15px] text-center`}
        >
          <div className="flex h-[75px] w-[75px] items-center justify-center rounded-full bg-[#ffebd3]">
            <Image
              src={assets.categories.more}
              alt="Все категории"
              width={32}
              height={32}
            />
          </div>

          <span className="min-h-[48px] font-semibold">
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