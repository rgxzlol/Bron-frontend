"use client";

import Image from "next/image";
import Link from "next/link";
import { assets } from "@/lib/assets";
import { routes } from "@/config/routes";
import { pluralizeReviews } from "@/lib/pluralize";
import { useSearchStore } from "@/store/search.store";
import s from "./homePage.module.css";

export default function SearchResults() {
  const submittedQuery = useSearchStore((state) => state.submittedQuery);
  const results = useSearchStore((state) => state.results);

  if (!submittedQuery) return null;

  return (
    <section className={`${s.homeSection} my-8.75`} aria-live="polite">
      <h2 className="mb-5 text-[24px] font-semibold">
        Результаты поиска: {submittedQuery}
      </h2>

      {results.length === 0 ? (
        <p className="rounded-[18px] bg-white px-5 py-6 text-[16px] font-semibold text-[var(--text-secondary)]">
          По вашему запросу ничего не найдено. Попробуйте изменить ключевые слова.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => (
            <Link
              key={item.id}
              href={`${routes.map}?shopId=${item.shopId}`}
              className="rounded-[18px] bg-white p-5 transition-all duration-200 hover:shadow-lg"
            >
              <h3 className="text-[20px] font-semibold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-[14px] font-semibold text-[var(--text-secondary)]">
                {item.description}
              </p>
              {item.rating != null ? (
                <div className="mt-4 flex items-center gap-2">
                  <Image src={assets.popular.starRating} alt="" width={18} height={18} />
                  <span className="text-[14px] font-semibold">
                    {item.rating}
                    {item.reviews != null
                      ? ` (${item.reviews} ${pluralizeReviews(item.reviews)})`
                      : ""}
                  </span>
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
