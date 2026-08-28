"use client";

import { popularPlaces } from "@/data/popular";
import { assets } from "@/lib/assets";
import { formatDurationMinutes, pluralizeReviews } from "@/lib/pluralize";
import { routes } from "@/config/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Button from "@/components/shared/Button";
import Image from "next/image";
import Link from "next/link";

function buildBookHref(shopId?: number) {
  return `${routes.book}?shopId=${shopId ?? 1}`;
}

export default function Popular() {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="mb-[20px] text-[24px] font-semibold">
        {t("home.popular")}
      </h2>

      <div className="flex flex-wrap gap-[20px] items-stretch">
        {popularPlaces.map((place) => (
          <article
            key={place.id}
            className="group flex w-full min-w-[240px] max-w-[274px] flex-1 flex-col overflow-hidden rounded-[18px] bg-white transition-all duration-300 hover:shadow-lg"
          >
            <Image
              className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
              src={place.img}
              alt={place.title}
              width={274}
              height={169}
            />

            <div className="flex flex-col gap-[9px] px-[16px] pb-[13px] pt-[4px] items-center">
              <div className="flex flex-col gap-[4px]">
                <span className="line-clamp-2 text-[20px] font-semibold leading-[28px]">
                  {place.title}
                </span>

                <div className="flex flex-wrap items-center gap-[15px]">
                  <div className="flex items-center gap-[6px]">
                    <Image
                      src={assets.popular.starRating}
                      alt={t("home.rating")}
                    />

                    <p className="text-[15px] font-semibold">
                      {place.rating}
                    </p>

                    <p className="text-[15px] font-semibold opacity-75">
                      ({place.reviews}{" "}
                      {pluralizeReviews(place.reviews)})
                    </p>
                  </div>

                  <div className="flex items-center gap-[6px]">
                    <Image
                      src={assets.popular.timeIcon}
                      alt={t("home.time")}
                    />

                    <p className="text-[15px] font-semibold">
                      {formatDurationMinutes(place.time)}
                    </p>
                  </div>
                </div>

                <p className="opacity-70 justify-start text-black text-[13px] font-semibold">
                  {place.desc}
                </p>
              </div>

              <Link href={buildBookHref(place.shopId)} data-testid="popular-book-button">
                <Button
                  text={t("map.bookPlace")}
                  as="span"
                  className="transition-colors duration-300 group-hover:bg-[#0859d3]"
                />
              </Link>
            </div>
          </article>
        ))}

        <Link
          href={routes.map}
          className="max-h-max flex flex-col items-center gap-2.5 rounded-[18px] bg-white pb-11 pt-14 pl-7 pr-6 group transition-all duration-300 hover:shadow-lg"
        >
          <Image
            src={assets.popular.blueMore}
            alt={t("common.viewAll")}
            height={23}
            width={23}
          />

          <span className="text-[20px] text-[#0a6af7] transition-colors duration-300 group-hover:text-[#0859d3]">
            {t("common.viewAll")}
          </span>
        </Link>
      </div>
    </section>
  );
}
