"use client";

import Button from "@/components/shared/Button";
import { assets } from "@/lib/assets";
import { useBusinessStore } from "@/store/business.store";
import Image from "next/image";
import { useEffect, useState } from "react";
import BusinessModal from "./BusinessModal";
import BusinessDashboard from "./BusinessDashboard";
import MyBusiness from "./MyBusiness";

const Business = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const businesses = useBusinessStore((s) => s.businesses);
  const showMyBusiness = useBusinessStore((s) => s.showMyBusiness);
  const setShowMyBusiness = useBusinessStore((s) => s.setShowMyBusiness);
  const resetDraft = useBusinessStore((s) => s.resetDraft);
  const loadForEdit = useBusinessStore((s) => s.loadForEdit);

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

  function openEditModal(id: string) {
    loadForEdit(id);
    setModalOpen(true);
  }

  function handleCloseModal() {
    resetDraft();
    setModalOpen(false);
  }

  function handleSaved() {
    setModalOpen(false);
    setShowMyBusiness(true);
  }

  function openDashboard(id: string) {
    setDashboardId(id);
  }

  function closeDashboard() {
    setDashboardId(null);
  }

  function handleEditFromDashboard() {
    if (!dashboardId) return;
    closeDashboard();
    openEditModal(dashboardId);
  }

  if (dashboardId) {
    return (
      <BusinessDashboard
        businessId={dashboardId}
        onClose={closeDashboard}
        onEditProfile={handleEditFromDashboard}
      />
    );
  }

  if (showList) {
    return (
      <>
        <MyBusiness
          onAddBusiness={openModal}
          onEditBusiness={openEditModal}
          onOpenStatistics={openDashboard}
        />
        {modalOpen && (
          <BusinessModal onClose={handleCloseModal} onSaved={handleSaved} />
        )}
      </>
    );
  }

  return (
    <>
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
        <BusinessModal onClose={handleCloseModal} onSaved={handleSaved} />
      )}
    </>
  );
};

export default Business;
