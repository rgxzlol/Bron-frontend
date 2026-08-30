"use client";

import { popularPlaces as fallbackPopularPlaces } from "@/data/popular";
import { assets } from "@/lib/assets";
import { isRemoteShopImage } from "@/lib/business/shopImages";
import { fetchPopularPlaces } from "@/lib/home/discovery";
import { formatDurationMinutes, pluralizeReviews } from "@/lib/pluralize";
import { routes } from "@/config/routes";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { PopularPlace } from "@/types/popular";
import Button from "@/components/shared/Button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import s from "./homePage.module.css";
import popularStyles from "./popular.module.css";

function buildBookHref(shopId?: number) {
  return `${routes.book}?shopId=${shopId ?? 1}`;
}

function PopularCardImage({ place }: { place: PopularPlace }) {
  const imageClassName =
    "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105";

  return (
    <div className="relative h-[169px] w-full shrink-0 overflow-hidden">
      {isRemoteShopImage(place.img) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={imageClassName} src={place.img} alt={place.title} />
      ) : (
        <Image
          className={imageClassName}
          src={place.img}
          alt={place.title}
          width={274}
          height={169}
        />
      )}
    </div>
  );
}

export default function Popular() {
  const { t } = useTranslation();
  const [places, setPlaces] = useState<PopularPlace[]>(fallbackPopularPlaces);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void fetchPopularPlaces()
      .then((nextPlaces) => {
        if (!cancelled) {
          setPlaces(nextPlaces);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cardClassName = `${popularStyles.card} group flex h-full flex-col overflow-hidden rounded-[18px] bg-white transition-all duration-300 hover:shadow-lg`;

  return (
    <section className={`${s.homeSection} w-full`}>
      <h2 className="mb-[20px] text-[24px] font-semibold">
        {t("home.popular")}
      </h2>

      <div className={popularStyles.cards}>
        {places.map((place) => (
          <article key={place.id} className={cardClassName}>
            <PopularCardImage place={place} />

            <div className="flex flex-1 flex-col px-[16px] pb-[13px] pt-[4px]">
              <div className="flex flex-1 flex-col gap-[4px]">
                <span className="line-clamp-2 min-h-[56px] text-[20px] font-semibold leading-[28px] text-[var(--text-primary)]">
                  {place.title}
                </span>

                <div className="flex flex-col gap-x-[15px] gap-y-[6px]">
                  <div className="flex items-center gap-[6px]">
                    <Image
                      src={assets.popular.starRating}
                      alt={t("home.rating")}
                    />

                    <p className="text-[15px] font-semibold">{place.rating}</p>

                    <p className="text-[15px] font-semibold opacity-75">
                      ({place.reviews} {pluralizeReviews(place.reviews)})
                    </p>
                  </div>

                  <div className="flex items-center gap-[6px]">
                    <Image src={assets.popular.timeIcon} alt={t("home.time")} />

                    <p className="text-[15px] font-semibold">
                      {formatDurationMinutes(place.time)}
                    </p>
                  </div>
                </div>

                <p className="line-clamp-2 min-h-[40px] text-[13px] font-semibold leading-[20px] text-black/70">
                  {place.desc}
                </p>
              </div>

              <Link
                href={buildBookHref(place.shopId)}
                className="mt-[20px] flex justify-center"
                data-testid="popular-book-button"
              >
                <Button
                  text={t("map.bookPlace")}
                  as="span"
                  className="transition-colors duration-300 group-hover:bg-[#0859d3]"
                />
              </Link>
            </div>
          </article>
        ))}

        {isLoading
          ? Array.from({ length: Math.max(0, 3 - places.length) }).map(
              (_, index) => (
                <div
                  key={`popular-skeleton-${index}`}
                  className={`${cardClassName} min-h-[320px] animate-pulse`}
                />
              ),
            )
          : null}

        <Link href={routes.map} className={`${cardClassName} items-center justify-center gap-2.5 px-6 py-11`}>
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
