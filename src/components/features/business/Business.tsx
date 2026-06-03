"use client";

import Button from "@/components/shared/Button";
import { assets } from "@/lib/assets";
import { useBusinessStore } from "@/store/business.store";
import Image from "next/image";
import { useEffect, useState } from "react";
import BusinessModal from "./BusinessModal";
import MyBusiness from "./MyBusiness";

const Business = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const businesses = useBusinessStore((s) => s.businesses);
  const showMyBusiness = useBusinessStore((s) => s.showMyBusiness);
  const setShowMyBusiness = useBusinessStore((s) => s.setShowMyBusiness);
  const resetDraft = useBusinessStore((s) => s.resetDraft);

  const hasBusinesses = businesses.length > 0;
  const showList = hasBusinesses || showMyBusiness;

  useEffect(() => {
    if (hasBusinesses) {
      setShowMyBusiness(true);
    }
  }, [hasBusinesses, setShowMyBusiness]);

  function openModal() {
    resetDraft();
    setModalOpen(true);
  }

  function handleSaved() {
    setModalOpen(false);
    setShowMyBusiness(true);
  }

  if (showList) {
    return (
      <div className="relative min-h-110dvh]">
        <MyBusiness onAddBusiness={openModal} />
        {modalOpen && (
          <BusinessModal
            onClose={() => setModalOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100dvh-13rem)]">
      <div className="flex justify-between rounded-[34px] bg-white px-[23px] py-[26px]">
        <div className="flex flex-col gap-[8px]">
          <h3 className="max-w-[450px] text-[36px] font-semibold">
            Добавьте свой бизнес на карту для больших активов
          </h3>

          <p className="text-[20px] font-semibold opacity-75">
            Увеличь активы с помощью бронирования!
          </p>

          <Button
            onClick={openModal}
            className="mt-[25px] py-[15px] text-[20px] !px-[30px]"
            text="Добавить бизнес"
          />
        </div>

        <Image
          className="mr-[70px] max-w-[392px] object-cover"
          src={assets.bussines.photo1}
          alt=""
        />
      </div>

      {modalOpen && (
        <BusinessModal
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default Business;
