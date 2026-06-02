"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { formatPrice, formatRating } from "@/lib/formatPrice";
import {
  formatDurationMinutes,
  pluralizeReviews,
} from "@/lib/pluralize";
import type { ShopsType } from "@/types/shops.types";
import Button from "@/components/shared/Button";
import s from "./fullMap.module.css";

type ShopDetailPanelProps = {
  shop: ShopsType;
  onClose: () => void;
  onBook: () => void;
};

export default function ShopDetailPanel({
  shop,
  onClose,
  onBook,
}: ShopDetailPanelProps) {
  return (
    <aside
      className={s.panel}
      role="dialog"
      aria-modal="true"
      aria-label={shop.title}
    >
      <div className={s.panelScroll}>
        <div className={s.imageWrap}>
          <Image
            className={s.image}
            src={shop.img}
            alt={shop.title}
            sizes="400px"
            priority
          />
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <Image src={assets.map.quitIcon} alt="" width={20} height={20} />
          </button>
          <span className={s.slideCounter}>1/3</span>
        </div>

        <div className={s.body}>
          <div className={s.titleRow}>
            <h2 className={s.title}>{shop.title}</h2>
            <div className={s.rating}>
              <Image
                src={assets.popular.starRating}
                alt=""
                width={18}
                height={18}
              />
              <span className={s.ratingValue}>{formatRating(shop.rating)}</span>
              <span className={s.ratingMuted}>
                ({shop.reviews} {pluralizeReviews(shop.reviews)})
              </span>
            </div>
          </div>

          <p className={s.category}>{shop.type}</p>
          <p className={s.desc}>{shop.desc}</p>

          <div className={s.stats}>
            <div className={s.statBox}>
              <span className={s.statLabel}>Открыто</span>
              <span className={s.statValue}>{shop.hours}</span>
            </div>
            <div className={s.statBox}>
              <span className={s.statLabel}>Своб.Мест</span>
              <span className={s.statValueRow}>
                <Image
                  src={assets.map.freeSeat}
                  alt=""
                  width={16}
                  height={16}
                />
                <span>{shop.freeSeats}</span>
              </span>
            </div>
            <div className={s.statBox}>
              <span className={s.statLabel}>от {formatPrice(shop.price)} сум</span>
              <span className={s.statValue}>за час</span>
            </div>
          </div>

          <div className={s.contact}>
            <div className={s.addressRow}>
              <Image
                className={s.contactIcon}
                src={assets.map.geoMark}
                alt=""
                width={20}
                height={20}
              />
              <div className={s.addressText}>
                <span className={s.addressMain}>{shop.address}</span>
                <span className={s.addressSub}>{shop.district}</span>
              </div>
              <span className={s.distance}>{shop.distance}</span>
            </div>

            <div className={s.phoneRow}>
              <Image
                className={s.contactIcon}
                src={assets.map.phoneIcon}
                alt=""
                width={20}
                height={20}
              />
              <a className={s.phone} href={`tel:${shop.phone.replace(/\s/g, "")}`}>
                {shop.phone}
              </a>
            </div>
          </div>

          <div className={s.pricing}>
            <h3 className={s.pricingTitle}>Ценна</h3>
            <div className={s.priceItem}>
              <div className={s.priceIcon}>
                <Image
                  src={assets.map.strenght}
                  alt=""
                  width={24}
                  height={24}
                />
              </div>
              <div className={s.priceInfo}>
                <span className={s.priceName}>{shop.category}</span>
                <span className={s.priceDuration}>
                  {formatDurationMinutes(shop.time)}
                </span>
              </div>
              <span className={s.priceAmount}>
                {formatPrice(shop.price)} сум
              </span>
            </div>
          </div>

          <Button
            text="Забронировать место"
            className={s.bookBtn}
            onClick={onBook}
          />
        </div>
      </div>
    </aside>
  );
}
