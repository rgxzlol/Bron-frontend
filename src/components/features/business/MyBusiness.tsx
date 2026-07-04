"use client";

import Button from "@/components/shared/Button";
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
    <div className="rounded-[34px] bg-white px-[23px] py-[26px]">
      <div className="mb-[24px] flex items-center justify-between">
        <h2 className="text-[36px] font-semibold">Мой бизнес</h2>
        <Button
          text="Добавить новый бизнес"
          onClick={onAddBusiness}
          className="text-[18px] !px-[28px] py-[14px]"
        />
      </div>

      <div className="flex flex-col gap-[20px]">
        {businesses.map((business) => {
          const logoImage = business.profilePhoto ?? assets.map.photo1;
          const isDataUrl = typeof logoImage === "string";
          const isMenuOpen = openMenuId === business.id;

          return (
            <article
              key={business.id}
              className="flex gap-[24px] rounded-[24px] border border-[#ececf2] p-[20px]"
            >
              <div className="relative flex h-[200px] w-[280px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#f4f4f8]">
                {isDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoImage}
                    alt={business.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Image
                    src={logoImage}
                    alt={business.name}
                    fill
                    className="object-contain p-[16px]"
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="flex flex-col gap-[8px]">
                    {business.category && (
                      <span className="w-fit rounded-full bg-[#ede8ff] px-[14px] py-[5px] text-[14px] font-semibold text-[#6b4ee6]">
                        {business.category}
                      </span>
                    )}
                    <h3 className="text-[24px] font-semibold">
                      {business.name || "Без названия"}
                    </h3>
                    {business.address && (
                      <p className="flex items-center gap-[8px] text-[16px] opacity-75">
                        <Image src={assets.map.geoMark} alt="" width={16} height={16} />
                        {business.address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-[10px]">
                    <span className="flex items-center gap-[6px] rounded-full bg-[#e8f8ee] px-[12px] py-[6px] text-[14px] font-semibold text-[#1a9b4a]">
                      <span className="h-[8px] w-[8px] rounded-full bg-[#1a9b4a]" />
                      Подтверждено
                    </span>
                    <div className="relative">
                      <button
                        type="button"
                        className={`flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[#f4f4f8] text-[22px] leading-none transition hover:bg-[#ececf2] ${
                          isMenuOpen ? "ring-2 ring-[#0a6af7]/20" : ""
                        }`}
                        aria-label="Меню"
                        aria-expanded={isMenuOpen}
                        onClick={() =>
                          setOpenMenuId(isMenuOpen ? null : business.id)
                        }
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
                </div>

                <div className="mt-auto flex items-end justify-between gap-[16px] pt-[20px]">
                  <div className="flex gap-[12px]">
                    <div className="rounded-[12px] bg-[#f4f4f8] px-[16px] py-[10px]">
                      <p className="text-[13px] opacity-60">Бронирования</p>
                      <p className="text-[20px] font-semibold">{business.bookings}</p>
                    </div>
                    <div className="rounded-[12px] bg-[#f4f4f8] px-[16px] py-[10px]">
                      <p className="text-[13px] opacity-60">Просмотров</p>
                      <p className="text-[20px] font-semibold">
                        {business.views.toLocaleString("ru-RU")}
                      </p>
                    </div>
                  </div>

                  <Button
                    text="Панель управления"
                    className="text-[18px] !px-[40px] py-[14px]"
                    onClick={() => onOpenStatistics(business.id)}
                  />
                </div>
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
