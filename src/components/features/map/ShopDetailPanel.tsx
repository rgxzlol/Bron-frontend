"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { assets } from "@/lib/assets";
import { formatPrice, formatRating } from "@/lib/formatPrice";
import {
  pluralizeReviews,
} from "@/lib/pluralize";
import {
  getShopGallery,
  isRemoteShopImage,
} from "@/lib/business/shopImages";
import { useFavoriteStore } from "@/store/favorite.store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { fetchBusinessReviewStats } from "@/lib/reviews/businessReviews";
import { getEffectiveShopRating, useReviewStore } from "@/store/review.store";
import { useAuthStore } from "@/store/auth.store";
import type { ShopsType } from "@/types/shops.types";
import Button from "@/components/shared/Button";
import s from "./fullMap.module.css";

type ShopDetailPanelProps = {
  shop: ShopsType;
  onClose: () => void;
  onBook: () => void;
};

function GalleryImage({
  image,
  alt,
  className,
  sizes = "200px",
}: {
  image: StaticImageData | string;
  alt: string;
  className: string;
  sizes?: string;
}) {
  if (isRemoteShopImage(image)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={image} alt={alt} />;
  }
  return <Image className={className} src={image} alt={alt} fill sizes={sizes} />;
}

export default function ShopDetailPanel({
  shop,
  onClose,
  onBook,
}: ShopDetailPanelProps) {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const shopReviewStats = useReviewStore((state) => state.shopReviewStats);
  const fetchFavorites = useFavoriteStore((state) => state.fetchFavorites);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const isFavorite = useFavoriteStore((state) => state.isFavorite);
  const gallery = getShopGallery(shop);
  const [imageIndex, setImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [apiRating, setApiRating] = useState<{ rating: number; reviews: number } | null>(
    null,
  );
  const businessId = shop.apiBusinessId ?? shop.id;
  const currentImage = gallery[imageIndex] ?? shop.img;
  const activeServices = shop.services ?? [];

  useEffect(() => {
    setImageIndex(0);
    setExpanded(false);
  }, [shop.id]);

  useEffect(() => {
    if (!token) return;
    void fetchFavorites();
  }, [token, fetchFavorites]);

  useEffect(() => {
    if (!businessId) return;

    void fetchBusinessReviewStats(businessId).then(({ stats }) => {
      if (stats.reviews > 0) {
        setApiRating(stats);
      }
    });
  }, [businessId]);

  function showPrevImage() {
    setImageIndex((index) => (index > 0 ? index - 1 : gallery.length - 1));
  }

  function showNextImage() {
    setImageIndex((index) => (index < gallery.length - 1 ? index + 1 : 0));
  }

  const priceRows =
    activeServices.length > 0
      ? activeServices.map((service) => ({
          id: service.id,
          name: service.title,
          duration: `${service.durationMin} мин`,
          price: service.priceFrom,
        }))
      : [
          {
            id: "base",
            name: shop.category,
            duration: shop.type === "Больница" ? `${shop.time} мин` : "1 час",
            price: shop.price,
          },
        ];

  const { rating: displayRating, reviews: displayReviews } = getEffectiveShopRating(
    shop.id,
    apiRating?.rating ?? shop.rating,
    apiRating?.reviews ?? shop.reviews,
    shopReviewStats,
  );

  async function handleToggleFavorite() {
    if (!token || !businessId) return;
    await toggleFavorite(businessId);
  }

  const ratingRow = (
    <div className={s.sheetRating} data-testid="map-vendor-rating">
      <Image src={assets.popular.starRating} alt="" width={16} height={16} />
      <span className={s.sheetRatingValue}>{formatRating(displayRating)}</span>
      <span className={s.sheetRatingMuted}>
        ({displayReviews} {pluralizeReviews(displayReviews)})
      </span>
    </div>
  );

  const priceLabel = `От ${formatPrice(shop.price)} сум`;

  const mobileSheet = (
    <section
      className={s.sheet}
      role="dialog"
      aria-modal="false"
      aria-label={shop.title}
      data-testid="map-vendor-preview-card"
    >
      <button
        type="button"
        className={s.sheetHandle}
        onClick={() => setExpanded((value) => !value)}
        aria-label={expanded ? "Свернуть" : "Развернуть"}
        aria-expanded={expanded}
      >
        <span className={s.handleBar} />
      </button>

      <button
        type="button"
        className={s.sheetClose}
        onClick={onClose}
        aria-label="Закрыть"
      >
        ×
      </button>

      {token ? (
        <button
          type="button"
          className={`${s.sheetFavorite} ${isFavorite(businessId) ? s.sheetFavoriteActive : ""}`}
          onClick={() => void handleToggleFavorite()}
          aria-label={isFavorite(businessId) ? t("favorites.remove") : t("favorites.add")}
          data-testid="map-vendor-favorite-button"
        >
          {isFavorite(businessId) ? "♥" : "♡"}
        </button>
      ) : null}

      <div className={s.sheetScroll}>
        <div className={s.sheetCard}>
          <div className={s.sheetPhoto}>
            <GalleryImage
              image={gallery[0] ?? shop.img}
              alt={shop.title}
              className={s.photoImg}
              sizes="104px"
            />
          </div>
          <div className={s.sheetInfo}>
            <span className={s.sheetTag}>{shop.type}</span>
            <h2 className={s.sheetTitle} data-testid="map-vendor-title">
              {shop.title}
            </h2>
            {ratingRow}
            <span className={s.sheetPrice} data-testid="map-vendor-price">
              {priceLabel}
            </span>
            <p className={s.sheetHours} data-testid="map-vendor-hours">
              {shop.hours}
            </p>
            <p className={s.sheetAddress} data-testid="map-vendor-address">
              {shop.address}
            </p>
          </div>
        </div>

        <Button
          text={t("map.bookPlace")}
          className={s.sheetBookBtn}
          data-testid="map-vendor-book-btn"
          onClick={onBook}
        />

        {expanded && (
          <>
            <div className={s.sheetStats}>
              <div className={s.sheetStatBox}>
                <span className={s.sheetStatLabel}>Открыто</span>
                <span className={s.sheetStatValue}>
                  {shop.hours.replace("-", "—")}
                </span>
              </div>
              <div className={s.sheetStatBox}>
                <span className={s.sheetStatLabel}>Св.мест</span>
                <span className={s.sheetStatPeople}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="8.5" cy="8" r="3" />
                    <path d="M2.5 18.5c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5v.5h-12v-.5z" />
                    <circle cx="16.5" cy="8.5" r="2.4" />
                    <path d="M16.2 14.3c3 .3 5.3 1.8 5.3 4.2v.5h-3.6v-.5c0-1.6-.6-3-1.7-4.2z" />
                  </svg>
                  {shop.freeSeats}
                </span>
              </div>
              <div className={s.sheetStatBox}>
                <span className={s.sheetStatLabel}>
                  От {formatPrice(shop.price)}сум
                </span>
                <span className={s.sheetStatValue}>
                  {shop.type === "Больница" ? "За приём" : "За час"}
                </span>
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
              </div>

              <div className={s.phoneRow}>
                <Image
                  className={s.contactIcon}
                  src={assets.map.phoneIcon}
                  alt=""
                  width={20}
                  height={20}
                />
                <a
                  className={s.phone}
                  href={`tel:${shop.phone.replace(/\s/g, "")}`}
                >
                  {shop.phone}
                </a>
              </div>
            </div>

            <div className={s.sheetSection}>
              <h3 className={s.sheetSectionTitle}>Фото</h3>
              <div className={s.photoGrid}>
                <div className={`${s.photoCell} ${s.photoBig}`}>
                  <GalleryImage
                    image={gallery[0] ?? shop.img}
                    alt={shop.title}
                    className={s.photoImg}
                    sizes="220px"
                  />
                </div>
                <div className={s.photoCell}>
                  <GalleryImage
                    image={gallery[1] ?? gallery[0] ?? shop.img}
                    alt={shop.title}
                    className={s.photoImg}
                    sizes="140px"
                  />
                </div>
                <div className={s.photoCell}>
                  <GalleryImage
                    image={gallery[2] ?? gallery[0] ?? shop.img}
                    alt={shop.title}
                    className={s.photoImg}
                    sizes="140px"
                  />
                </div>
              </div>
            </div>

            <div className={s.sheetSection}>
              <h3 className={s.sheetSectionTitle}>Цена</h3>
              {priceRows.map((row) => (
                <div key={row.id} className={s.priceItem}>
                  <span className={s.priceCircle} aria-hidden="true">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M6.5 9v6M4 10.5v3M17.5 9v6M20 10.5v3M6.5 12h11" />
                    </svg>
                  </span>
                  <div className={s.priceInfo}>
                    <span className={s.priceName}>{row.name}</span>
                    <span className={s.priceDuration}>{row.duration}</span>
                  </div>
                  <span className={s.priceAmount}>
                    {formatPrice(row.price)} сум
                  </span>
                </div>
              ))}
            </div>

            <div className={s.sheetSection}>
              <h3 className={s.sheetSectionTitle}>Отзывы</h3>
              {ratingRow}
            </div>

            <Button
              text={t("map.bookPlace")}
              className={s.sheetBookBtn}
              data-testid="map-vendor-book-btn"
              onClick={onBook}
            />
          </>
        )}
      </div>
    </section>
  );

  return (
    <>
      {mobileSheet}

      <aside
        className={s.panel}
        role="dialog"
        aria-modal="true"
        aria-label={shop.title}
        data-testid="map-vendor-preview-card"
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
              <h2 className={s.title} data-testid="map-vendor-title">
                {shop.title}
              </h2>
              <div className={s.rating} data-testid="map-vendor-rating">
                <Image
                  src={assets.popular.starRating}
                  alt=""
                  width={18}
                  height={18}
                />
                <span className={s.ratingValue}>{formatRating(displayRating)}</span>
                <span className={s.ratingMuted}>
                  ({displayReviews} {pluralizeReviews(displayReviews)})
                </span>
              </div>
            </div>

            <p className={s.category}>{shop.category}</p>
            <p className={s.priceFrom} data-testid="map-vendor-price">
              {priceLabel}
            </p>
            <p className={s.desc}>{shop.desc}</p>

            <div className={s.stats}>
              <div className={s.statBox}>
                <span className={s.statLabel}>Открыто</span>
                <span className={s.statValue} data-testid="map-vendor-hours">
                  {shop.hours}
                </span>
              </div>
              <div className={s.statBox}>
                <span className={s.statLabel}>Св.мест</span>
                <span className={s.statValue}>{shop.freeSeats}</span>
              </div>
              <div className={s.statBox}>
                <span className={s.statLabel}>Цена</span>
                <span className={s.statValue}>{formatPrice(shop.price)} сум</span>
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
                  <span className={s.addressMain} data-testid="map-vendor-address">
                    {shop.address}
                  </span>
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
              text={t("map.bookPlace")}
              className={s.bookBtn}
              data-testid="map-vendor-book-btn"
              onClick={onBook}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
