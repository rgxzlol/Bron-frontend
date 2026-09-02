"use client";

import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useBusinessStore } from "@/store/business.store";
import { useToastStore } from "@/store/toast.store";
import Image from "next/image";
import { useRef, useState } from "react";
import BusinessCardMenu from "./BusinessCardMenu";
import DeleteBusinessModal from "./DeleteBusinessModal";
import desktop from "./businessDesktop.module.css";

type Props = {
  onAddBusiness: () => void;
  onEditBusiness: (id: string) => void;
  onOpenStatistics: (id: string) => void;
};

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function useBusinessCards() {
  const { locale } = useTranslation();
  const businesses = useBusinessStore((s) => s.businesses);

  return businesses.map((business) => {
    const galleryPhotos = business.gallery.filter((photo): photo is string =>
      Boolean(photo),
    );
    const coverPhoto = galleryPhotos[0] ?? business.profilePhoto;

    return {
      id: business.id,
      name: business.name,
      category: business.category,
      address: business.address,
      coverPhoto,
      photoCount: Math.max(galleryPhotos.length, 1),
      bookings: business.bookings,
      views: business.views,
      viewsFormatted: business.views.toLocaleString(locale),
    };
  });
}

export default function MyBusiness({
  onAddBusiness,
  onEditBusiness,
  onOpenStatistics,
}: Props) {
  const { t } = useTranslation();
  const cards = useBusinessCards();
  const removeBusiness = useBusinessStore((s) => s.removeBusiness);
  const showToast = useToastStore((s) => s.showToast);
  const [openMenu, setOpenMenu] = useState<{
    id: string;
    variant: "mobile" | "desktop";
  } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuAnchorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const deleteTarget = cards.find((business) => business.id === deleteTargetId);
  const openMenuAnchor = openMenu
    ? menuAnchorRefs.current[
        openMenu.variant === "desktop" ? `desktop-${openMenu.id}` : openMenu.id
      ]
    : null;

  return (
    <div data-testid="my-business-dashboard">
      <div className="mb-[16px] flex items-center justify-between gap-[12px] lg:mb-[28px]">
        <h2 className="text-[22px] font-bold lg:text-[36px] lg:font-semibold">
          {t("business.myBusiness")}
        </h2>
        <button
          type="button"
          onClick={onAddBusiness}
          className="shrink-0 rounded-[10px] bg-[#0a6af7] px-[16px] py-[10px] text-[13px] font-semibold text-white transition hover:bg-[#0858ce] lg:px-[18px] lg:py-[11px] lg:text-[14px]"
          data-testid="business-add-button"
        >
          {t("business.addNewBusiness")}
        </button>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-[16px] lg:hidden" data-testid="my-business-list">
        {cards.map((business) => {
          const isMenuOpen =
            openMenu?.id === business.id && openMenu.variant === "mobile";

          return (
            <article
              key={business.id}
              className="flex flex-col rounded-[20px] bg-[var(--bg-surface)] p-[10px] pb-[16px] shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
              data-testid={`business-card-${business.id}`}
            >
              <div className="relative">
                <div className="relative h-[190px] w-full overflow-hidden rounded-[14px] bg-[var(--bg-surface-muted)]">
                  {business.coverPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={business.coverPhoto}
                      alt={business.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={assets.map.photo1}
                      alt={business.name}
                      fill
                      className="object-cover"
                    />
                  )}
                  <span className="absolute bottom-[10px] left-[12px] text-[13px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    1/{business.photoCount}
                  </span>
                </div>
                <div className="absolute right-[10px] top-[10px] z-10 flex items-center gap-[8px]">
                  {business.category && (
                    <span className="rounded-full bg-[var(--bg-active-soft)] px-[12px] py-[6px] text-[12px] font-semibold text-[#0a6af7]">
                      {business.category}
                    </span>
                  )}
                  <div
                    ref={(el) => {
                      menuAnchorRefs.current[business.id] = el;
                    }}
                    className="relative"
                  >
                    <button
                      type="button"
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--bg-surface-muted)] text-[18px] font-bold leading-none text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
                      aria-label={t("business.menuAria")}
                      aria-expanded={isMenuOpen}
                      data-testid={`business-card-menu-${business.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenu(
                          isMenuOpen
                            ? null
                            : { id: business.id, variant: "mobile" },
                        );
                      }}
                    >
                      ⋮
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-[6px] pt-[12px]">
                <div className="flex items-center justify-between gap-[10px]">
                  <h3
                    className="truncate text-[18px] font-bold"
                    data-testid={`business-card-name-${business.id}`}
                  >
                    {business.name || t("business.untitled")}
                  </h3>
                  <span
                    className="shrink-0 rounded-full bg-[#e7f8ef] px-[12px] py-[5px] text-[12px] font-semibold text-[#00bd08]"
                    data-testid={`business-card-status-${business.id}`}
                  >
                    {t("business.confirmed")}
                  </span>
                </div>

                {business.address && (
                  <p className="mt-[4px] truncate text-[14px] text-[var(--text-secondary)]">
                    {business.address}
                  </p>
                )}

                <div
                  className="mt-[12px] grid grid-cols-2 gap-[10px]"
                  data-testid={`business-card-metrics-${business.id}`}
                >
                  <div className="rounded-[10px] bg-[var(--bg-surface-muted)] px-[12px] py-[9px]">
                    <p className="text-[13px] font-semibold">{t("business.bookingsLabel")}</p>
                    <p
                      className="mt-[2px] text-[14px] text-[var(--text-secondary)]"
                      data-testid={`business-card-bookings-${business.id}`}
                    >
                      {business.bookings}
                    </p>
                  </div>
                  <div className="rounded-[10px] bg-[var(--bg-surface-muted)] px-[12px] py-[9px]">
                    <p className="text-[13px] font-semibold">{t("business.viewsLabel")}</p>
                    <p
                      className="mt-[2px] text-[14px] text-[var(--text-secondary)]"
                      data-testid={`business-card-views-${business.id}`}
                    >
                      {business.viewsFormatted}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onEditBusiness(business.id)}
                  className="mt-[10px] w-full rounded-[14px] border border-[#0a6af7] py-[13px] text-[14px] font-semibold text-[#0a6af7] transition hover:bg-[var(--bg-active-soft)]"
                  data-testid={`business-card-edit-profile-${business.id}`}
                >
                  {t("businessCardMenu.editProfile")}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenStatistics(business.id)}
                  className="mt-[10px] w-full rounded-[14px] bg-[#0a6af7] py-[15px] text-[15px] font-semibold text-white transition hover:bg-[#0858ce]"
                  data-testid={`business-card-dashboard-${business.id}`}
                >
                  {t("business.dashboard")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Desktop cards */}
      <div className="hidden flex-col gap-[20px] lg:flex" data-testid="my-business-list-desktop">
        {cards.map((business) => {
          const isMenuOpen =
            openMenu?.id === business.id && openMenu.variant === "desktop";

          return (
            <article
              key={business.id}
              className={desktop.listCard}
              data-testid={`business-card-desktop-${business.id}`}
            >
              <div className={desktop.listImage}>
                {business.coverPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.coverPhoto}
                    alt={business.name}
                    className={desktop.listImagePhoto}
                  />
                ) : (
                  <Image
                    src={assets.map.photo1}
                    alt={business.name}
                    fill
                    className="object-cover"
                  />
                )}
                <span className={desktop.listImageCounter}>1/{business.photoCount}</span>
              </div>

              <div className={desktop.listBody}>
                {business.category && (
                  <span className={desktop.listCategory}>{business.category}</span>
                )}
                <h3 className={desktop.listName} data-testid={`business-card-name-${business.id}`}>
                  {business.name || t("business.untitled")}
                </h3>
                {business.address && (
                  <p className={desktop.listAddress}>
                    <PinIcon />
                    <span className="truncate">{business.address}</span>
                  </p>
                )}
                <div className={desktop.listStats} data-testid={`business-card-metrics-${business.id}`}>
                  <div className={desktop.listStatBox}>
                    <p className={desktop.listStatLabel}>{t("business.bookingsLabel")}</p>
                    <p className={desktop.listStatValue} data-testid={`business-card-bookings-${business.id}`}>
                      {business.bookings}
                    </p>
                  </div>
                  <div className={desktop.listStatBox}>
                    <p className={desktop.listStatLabel}>{t("business.viewsLabel")}</p>
                    <p className={desktop.listStatValue} data-testid={`business-card-views-${business.id}`}>
                      {business.viewsFormatted}
                    </p>
                  </div>
                </div>
              </div>

              <div className={desktop.listAside}>
                <div className={desktop.listStatusRow}>
                  <span className={desktop.listStatus} data-testid={`business-card-status-${business.id}`}>
                    • {t("business.confirmed")}
                  </span>
                  <div
                    ref={(el) => {
                      menuAnchorRefs.current[`desktop-${business.id}`] = el;
                    }}
                    className="relative"
                  >
                    <button
                      type="button"
                      className={desktop.listMenuButton}
                      aria-label={t("business.menuAria")}
                      aria-expanded={isMenuOpen}
                      data-testid={`business-card-menu-${business.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenu(
                          isMenuOpen
                            ? null
                            : { id: business.id, variant: "desktop" },
                        );
                      }}
                    >
                      ⋮
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenStatistics(business.id)}
                  className={desktop.listStatsButton}
                  data-testid={`business-card-statistics-${business.id}`}
                >
                  {t("business.statistics")}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {openMenu && (
        <BusinessCardMenu
          variant={openMenu.variant === "desktop" ? "desktop" : "default"}
          anchorEl={openMenuAnchor}
          onEdit={() => onEditBusiness(openMenu.id)}
          onDelete={() => setDeleteTargetId(openMenu.id)}
          onClose={() => setOpenMenu(null)}
        />
      )}

      <DeleteBusinessModal
        businessName={deleteTarget?.name || t("business.untitled")}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId || isDeleting) return;
          setIsDeleting(true);
          try {
            await removeBusiness(deleteTargetId);
            setDeleteTargetId(null);
            showToast(t("business.deleteSuccessTitle"), t("business.deleteSuccessDesc"));
          } catch {
            alert(t("business.deleteFailed"));
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </div>
  );
}
