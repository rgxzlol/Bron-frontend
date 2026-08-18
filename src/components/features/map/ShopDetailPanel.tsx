"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { assets } from "@/lib/assets";
import { formatPrice, formatRating } from "@/lib/formatPrice";
import {
  pluralizeReviews,
} from "@/lib/pluralize";
import {
  getShopGallery,
  isRemoteShopImage,
} from "@/lib/business/shopImages";
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
  const gallery = getShopGallery(shop);
  const [imageIndex, setImageIndex] = useState(0);
  const currentImage = gallery[imageIndex] ?? shop.img;
  const activeServices = shop.services ?? [];

  useEffect(() => {
    setImageIndex(0);
  }, [shop.id]);

  function showPrevImage() {
    setImageIndex((index) => (index > 0 ? index - 1 : gallery.length - 1));
  }

  function showNextImage() {
    setImageIndex((index) => (index < gallery.length - 1 ? index + 1 : 0));
  }

  return (
    <aside
      className={s.panel}
      role="dialog"
      aria-modal="true"
      aria-label={shop.title}
    >
      <div className={s.panelScroll}>
        <div className={s.imageWrap}>
          {isRemoteShopImage(currentImage) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={s.image}
              src={currentImage}
              alt={shop.title}
            />
          ) : (
            <Image
              className={s.image}
              src={currentImage}
              alt={shop.title}
              fill
              sizes="400px"
              priority
            />
          )}
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <Image src={assets.map.quitIcon} alt="" width={20} height={20} />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                className={`${s.galleryNav} ${s.galleryNavPrev}`}
                onClick={showPrevImage}
                aria-label="Предыдущее фото"
              >
                ‹
              </button>
              <button
                type="button"
                className={`${s.galleryNav} ${s.galleryNavNext}`}
                onClick={showNextImage}
                aria-label="Следующее фото"
              >
                ›
              </button>
            </>
          )}
          <span className={s.slideCounter}>
            {imageIndex + 1}/{gallery.length}
          </span>
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

          <p className={s.category}>{shop.category}</p>
          <p className={s.desc}>{shop.desc}</p>

          <div className={s.stats}>
            <div className={s.statBox}>
              <span className={s.statLabel}>Открыто</span>
              <span className={s.statValue}>{shop.hours}</span>
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

            {shop.website && (
              <div className={s.phoneRow}>
                <Image
                  className={s.contactIcon}
                  src={assets.map.geoMark}
                  alt=""
                  width={20}
                  height={20}
                />
                <a
                  className={s.phone}
                  href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shop.website}
                </a>
              </div>
            )}
          </div>

          {activeServices.length > 0 && (
            <div className="flex flex-col gap-[8px]">
              <h3 className={s.pricingTitle}>Услуги</h3>
              {activeServices.map((service) => (
                <div key={service.id} className={s.priceItem}>
                  <div className={s.priceInfo}>
                    <span className={s.priceName}>{service.title}</span>
                    {service.description && (
                      <span className={s.priceDuration}>{service.description}</span>
                    )}
                  </div>
                  <span className={s.priceAmount}>
                    {formatPrice(service.priceFrom)} сум
                  </span>
                </div>
              ))}
            </div>
          )}

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
