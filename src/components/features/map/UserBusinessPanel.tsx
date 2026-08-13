"use client";

import Button from "@/components/shared/Button";
import { assets } from "@/lib/assets";
import { formatPrice } from "@/lib/formatPrice";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  BUSINESS_CATEGORY_KEYS,
  translateLabel,
} from "@/lib/i18n/labels";
import type { SavedBusiness } from "@/store/business.store";
import Image from "next/image";
import s from "./fullMap.module.css";

type UserBusinessPanelProps = {
  business: SavedBusiness;
  onClose: () => void;
  onBook: () => void;
};

export default function UserBusinessPanel({
  business,
  onClose,
  onBook,
}: UserBusinessPanelProps) {
  const { t, locale } = useTranslation();
  const previewImage =
    business.gallery.find(Boolean) ??
    business.profilePhoto ??
    assets.map.photo1;
  const isDataUrl = typeof previewImage === "string";
  const activeServices = business.services.filter((svc) => svc.active);
  const minPrice =
    activeServices.length > 0
      ? Math.min(...activeServices.map((svc) => svc.price))
      : null;

  return (
    <aside
      className={s.panel}
      role="dialog"
      aria-modal="true"
      aria-label={business.name}
    >
      <div className={s.panelScroll}>
        <div className={s.imageWrap}>
          {isDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={s.image}
              src={previewImage}
              alt={business.name}
            />
          ) : (
            <Image
              className={s.image}
              src={previewImage}
              alt={business.name}
              sizes="400px"
              priority
            />
          )}
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <Image src={assets.map.quitIcon} alt="" width={20} height={20} />
          </button>
        </div>

        <div className={s.body}>
          <div className={s.titleRow}>
            <h2 className={s.title}>{business.name}</h2>
            <div className={s.rating}>
              <Image
                src={assets.popular.starRating}
                alt=""
                width={18}
                height={18}
              />
              <span className={s.ratingValue}>0,0</span>
              <span className={s.ratingMuted}>{t("map.zeroReviews")}</span>
            </div>
          </div>

          <p className={s.category}>
            {translateLabel(t, business.category, BUSINESS_CATEGORY_KEYS)}
          </p>
          <p className={s.desc}>
            {business.description || t("map.noDescription")}
          </p>

          <div className={s.stats}>
            <div className={s.statBox}>
              <span className={s.statLabel}>{t("map.address")}</span>
              <span className={s.statValue}>
                {business.address || t("map.defaultCity")}
              </span>
            </div>
            <div className={s.statBox}>
              <span className={s.statLabel}>{t("map.phone")}</span>
              <span className={s.statValue}>{business.phone || "—"}</span>
            </div>
          </div>

          {activeServices.length > 0 && (
            <div className="mt-[16px]">
              <p className="mb-[10px] text-[15px] font-semibold">{t("map.services")}</p>
              <ul className="flex flex-col gap-[8px]">
                {activeServices.slice(0, 3).map((service) => (
                  <li
                    key={service.id}
                    className="flex justify-between rounded-[12px] bg-[#f4f4f8] px-[14px] py-[10px] text-[14px]"
                  >
                    <span className="font-semibold">{service.name}</span>
                    <span>{formatPrice(service.price, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {minPrice != null && (
            <p className="mt-[16px] text-[18px] font-semibold">
              {t("map.priceFrom", { price: formatPrice(minPrice, locale) })}
            </p>
          )}

          <Button
            text={t("home.book")}
            onClick={onBook}
            className="mt-[20px] w-full !px-[20px] text-center"
          />
        </div>
      </div>
    </aside>
  );
}
