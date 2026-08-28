"use client";

import { assets } from "@/lib/assets";
import { useBusinessStore } from "@/store/business.store";
import Image from "next/image";
import { useState } from "react";
import BusinessCardMenu from "./BusinessCardMenu";
import DeleteBusinessModal from "./DeleteBusinessModal";

type Props = {
  onAddBusiness: () => void;
  onEditBusiness: (id: string) => void;
  onOpenStatistics: (id: string) => void;
};

export default function MyBusiness({
  onAddBusiness,
  onEditBusiness,
  onOpenStatistics,
}: Props) {
  const businesses = useBusinessStore((s) => s.businesses);
  const removeBusiness = useBusinessStore((s) => s.removeBusiness);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTarget = businesses.find((business) => business.id === deleteTargetId);

  return (
    <div className="lg:rounded-[34px] lg:bg-[var(--bg-surface)] lg:px-[23px] lg:py-[26px]">
      <div className="mb-[16px] flex items-center justify-between gap-[12px] lg:mb-[24px]">
        <h2 className="text-[22px] font-bold lg:text-[36px] lg:font-semibold">
          Мой бизнес
        </h2>
        <button
          type="button"
          onClick={onAddBusiness}
          className="rounded-[10px] bg-[#0a6af7] px-[16px] py-[10px] text-[13px] font-semibold text-white transition hover:bg-[#0858ce] lg:px-[28px] lg:py-[14px] lg:text-[18px]"
        >
          Добавить бизнес
        </button>
      </div>

      <div className="grid gap-[16px] lg:grid-cols-2 lg:gap-[20px] xl:grid-cols-3">
        {businesses.map((business) => {
          const galleryPhotos = business.gallery.filter(
            (photo): photo is string => Boolean(photo),
          );
          const coverPhoto = galleryPhotos[0] ?? business.profilePhoto;
          const photoCount = Math.max(galleryPhotos.length, 1);
          const isMenuOpen = openMenuId === business.id;

          return (
            <article
              key={business.id}
              className="flex flex-col rounded-[20px] bg-[var(--bg-surface)] p-[10px] pb-[16px] shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
            >
              <div className="relative h-[190px] w-full overflow-hidden rounded-[14px] bg-[var(--bg-surface-muted)]">
                {coverPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPhoto}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={assets.map.photo1}
                    alt={business.name}
                    fill
                    className="object-contain p-[24px]"
                  />
                )}

                <div className="absolute right-[10px] top-[10px] flex items-center gap-[8px]">
                  {business.category && (
                    <span className="rounded-full bg-[#f0f4ff] px-[12px] py-[6px] text-[12px] font-semibold text-[#0a6af7]">
                      {business.category}
                    </span>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-[18px] font-bold leading-none text-black transition hover:bg-[#f4f4f8]"
                      aria-label="Меню"
                      aria-expanded={isMenuOpen}
                      onClick={() => setOpenMenuId(isMenuOpen ? null : business.id)}
                    >
                      ⋮
                    </button>
                    {isMenuOpen && (
                      <BusinessCardMenu
                        onEdit={() => onEditBusiness(business.id)}
                        onDelete={() => {
                          setOpenMenuId(null);
                          setDeleteTargetId(business.id);
                        }}
                        onClose={() => setOpenMenuId(null)}
                      />
                    )}
                  </div>
                </div>

                <span className="absolute bottom-[10px] left-[12px] text-[13px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  1/{photoCount}
                </span>
              </div>

              <div className="flex flex-1 flex-col px-[6px] pt-[12px]">
                <div className="flex items-center justify-between gap-[10px]">
                  <h3 className="truncate text-[18px] font-bold">
                    {business.name || "Без названия"}
                  </h3>
                  <span className="shrink-0 rounded-full bg-[#e7f8ef] px-[12px] py-[5px] text-[12px] font-semibold text-[#00bd08]">
                    Подтверждено
                  </span>
                </div>

                {business.address && (
                  <p className="mt-[4px] truncate text-[14px] text-[var(--text-secondary)]">
                    {business.address}
                  </p>
                )}

                <div className="mt-[12px] grid grid-cols-2 gap-[10px]">
                  <div className="rounded-[10px] bg-[var(--bg-surface-muted)] px-[12px] py-[9px]">
                    <p className="text-[13px] font-semibold">Бронирований</p>
                    <p className="mt-[2px] text-[14px] text-[var(--text-secondary)]">
                      {business.bookings}
                    </p>
                  </div>
                  <div className="rounded-[10px] bg-[var(--bg-surface-muted)] px-[12px] py-[9px]">
                    <p className="text-[13px] font-semibold">Просмотров</p>
                    <p className="mt-[2px] text-[14px] text-[var(--text-secondary)]">
                      {business.views.toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStatistics(business.id)}
                  className="mt-[14px] w-full rounded-[14px] bg-[#0a6af7] py-[15px] text-[15px] font-semibold text-white transition hover:bg-[#0858ce]"
                >
                  Статистика
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <DeleteBusinessModal
        businessName={deleteTarget?.name || "Без названия"}
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId || isDeleting) return;
          setIsDeleting(true);
          try {
            await removeBusiness(deleteTargetId);
            setDeleteTargetId(null);
          } catch {
            alert("Не удалось удалить бизнес. Попробуйте ещё раз.");
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </div>
  );
}
