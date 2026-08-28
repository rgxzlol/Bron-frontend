"use client";

import Button from "@/components/shared/Button";
import { assets } from "@/lib/assets";
import { useBusinessStore } from "@/store/business.store";
import { useAuthStore } from "@/store/auth.store";
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
  const fetchBusinessesFromApi = useBusinessStore((s) => s.fetchBusinessesFromApi);
  const resetDraft = useBusinessStore((s) => s.resetDraft);
  const loadForEdit = useBusinessStore((s) => s.loadForEdit);
  const token = useAuthStore((s) => s.token);

  const hasBusinesses = businesses.length > 0;
  const showList = hasBusinesses || showMyBusiness;

  useEffect(() => {
    if (token) {
      void fetchBusinessesFromApi();
    }
  }, [token, fetchBusinessesFromApi]);

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
      <div className="flex flex-col gap-6 rounded-[34px] bg-white px-5 py-6 md:flex-row md:items-center md:justify-between md:px-[23px] md:py-[26px]">
        <div className="flex flex-col gap-[8px]">
          <h3 className="max-w-[450px] text-[26px] font-semibold md:text-[36px]">
            Добавьте свой бизнес на карту для больших активов
          </h3>

          <p className="text-[18px] font-semibold opacity-75 md:text-[20px]">
            Увеличь активы с помощью бронирования!
          </p>

          <Button
            onClick={openModal}
            className="mt-[25px] py-[15px] text-[20px] !px-[30px]"
            text="Добавить бизнес"
          />
        </div>

        <Image
          className="mx-auto h-auto w-full max-w-[280px] object-cover md:mx-0 md:mr-[70px] md:max-w-[392px]"
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
