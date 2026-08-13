"use client";

import { useBusinessStore } from "@/store/business.store";
import { useAuthStore } from "@/store/auth.store";
import { useEffect, useState } from "react";
import BusinessModal from "./BusinessModal";
import BusinessDashboard from "./BusinessDashboard";
import BusinessEmptyPromo from "./BusinessEmptyPromo";
import BusinessPanelOverlay from "./BusinessPanelOverlay";
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

  function handleOverlayClose() {
    if (dashboardId) {
      closeDashboard();
      return;
    }

    if (showList && hasBusinesses) {
      setShowMyBusiness(false);
    }
  }

  return (
    <>
      <BusinessPanelOverlay
        onClose={dashboardId || (showList && hasBusinesses) ? handleOverlayClose : undefined}
      >
        {dashboardId ? (
          <BusinessDashboard
            businessId={dashboardId}
            onClose={closeDashboard}
            onEditProfile={handleEditFromDashboard}
          />
        ) : showList ? (
          <MyBusiness
            onAddBusiness={openModal}
            onEditBusiness={openEditModal}
            onOpenStatistics={openDashboard}
          />
        ) : (
          <BusinessEmptyPromo onAddBusiness={openModal} />
        )}
      </BusinessPanelOverlay>

      {modalOpen && (
        <BusinessModal onClose={handleCloseModal} onSaved={handleSaved} />
      )}
    </>
  );
};

export default Business;
