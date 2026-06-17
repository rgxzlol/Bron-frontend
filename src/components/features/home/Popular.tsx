import { popularPlaces } from "@/data/popular";
import { assets } from "@/lib/assets";
import { formatDurationMinutes, pluralizeReviews } from "@/lib/pluralize";
import { routes } from "@/config/routes";
import Button from "@/components/shared/Button";
import Image from "next/image";
import Link from "next/link";

export default function Popular() {
  return (
    <section>
      <h2 className="mb-[20px] text-[24px] font-semibold">
        Популярные
      </h2>

      <div className="flex flex-nowrap gap-[20px]">
        {popularPlaces.map((place) => (
          <Link
            key={place.id}
            href={routes.home}
            className="flex w-full min-w-[270px] flex-1 flex-col overflow-hidden rounded-[18px] bg-white"
          >
            <Image
              className="h-[180px] w-full object-cover"
              src={place.img}
              alt={place.title}
              width={400}
              height={180}
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
                      alt="Рейтинг"
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
                      alt="Время"
                    />

                    <p className="text-[15px] font-semibold">
                      {formatDurationMinutes(place.time)}
                    </p>
                  </div>
                </div>

                <p className="line-clamp-3 min-h-[54px] text-[14px] leading-[18px] opacity-75">
                  {place.desc}
                </p>
              </div>

              <Button text="Забронировать" as="span" />
            </div>
          </Link>
        ))}

        <Link
          href={routes.home}
          className="flex min-h-[380px] flex-1 flex-col items-center justify-center rounded-[18px] bg-white p-[20px] max-w-[274px]"
        >
          <Image
            src={assets.popular.blueMore}
            alt="Смотреть все"
          />

          <span className="text-[20px] text-[#0a6af7]">
            Смотреть все
          </span>
        </Link>
      </div>
    </section>
  );
}