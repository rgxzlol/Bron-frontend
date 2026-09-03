"use client";

import { routes } from "@/config/routes";
import { useBusinessStore } from "@/store/business.store";
import { useAuthStore } from "@/store/auth.store";
import { shouldRedirectFromBusinessPage, useBusinessNavAccess } from "@/lib/business/applicationAccess";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import BusinessModal from "./BusinessModal";
import BusinessDashboard from "./BusinessDashboard";
import BusinessEmptyPromo from "./BusinessEmptyPromo";
import MyBusiness from "./MyBusiness";

function useDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = () => setIsDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return isDesktop;
}

const Business = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editBusinessId, setEditBusinessId] = useState<string | null>(null);
  const businesses = useBusinessStore((s) => s.businesses);
  const showMyBusiness = useBusinessStore((s) => s.showMyBusiness);
  const setShowMyBusiness = useBusinessStore((s) => s.setShowMyBusiness);
  const fetchBusinessesFromApi = useBusinessStore((s) => s.fetchBusinessesFromApi);
  const resetDraft = useBusinessStore((s) => s.resetDraft);
  const loadForEdit = useBusinessStore((s) => s.loadForEdit);
  const token = useAuthStore((s) => s.token);
  const { status } = useBusinessNavAccess();

  const editId = searchParams.get("edit");
  const dashboardParam = searchParams.get("dashboard");
  const resolvedDashboardId =
    dashboardParam && businesses.some((business) => business.id === dashboardParam)
      ? dashboardParam
      : null;
  const resolvedEditId =
    editId && businesses.some((business) => business.id === editId) ? editId : null;
  const editModalOpen = editBusinessId !== null || Boolean(resolvedEditId);

  const hasBusinesses = businesses.length > 0;
  const showList = hasBusinesses || showMyBusiness;

  useEffect(() => {
    const redirectTo = shouldRedirectFromBusinessPage(status);
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [status, router]);

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

  useEffect(() => {
    if (createModalOpen) return;

    if (resolvedEditId) {
      setEditBusinessId(resolvedEditId);
      loadForEdit(resolvedEditId);
    }
  }, [resolvedEditId, loadForEdit, businesses, createModalOpen]);

  function pushBusinessView(query: { edit?: string | null; dashboard?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());

    if ("edit" in query) {
      if (query.edit) params.set("edit", query.edit);
      else params.delete("edit");
    }

    if ("dashboard" in query) {
      if (query.dashboard) params.set("dashboard", query.dashboard);
      else params.delete("dashboard");
    }

    const qs = params.toString();
    router.push(qs ? `${routes.business}?${qs}` : routes.business, { scroll: false });
  }

  function openModal() {
    resetDraft();
    setEditBusinessId(null);
    setCreateModalOpen(true);
    pushBusinessView({ edit: null, dashboard: null });
  }

  function openEditModal(id: string) {
    if (!businesses.some((business) => business.id === id)) return;
    setCreateModalOpen(false);
    setEditBusinessId(id);
    loadForEdit(id);
    pushBusinessView({ edit: id, dashboard: null });
  }

  function handleCloseModal() {
    resetDraft();
    if (editBusinessId || resolvedEditId) {
      setEditBusinessId(null);
      pushBusinessView({ edit: null });
      return;
    }
    setCreateModalOpen(false);
    setEditBusinessId(null);
    pushBusinessView({ edit: null, dashboard: null });
  }

  function handleSaved() {
    setCreateModalOpen(false);
    setEditBusinessId(null);
    pushBusinessView({ edit: null, dashboard: null });
    setShowMyBusiness(true);
  }

  function openDashboard(id: string) {
    if (!businesses.some((business) => business.id === id)) return;
    setEditBusinessId(null);
    pushBusinessView({ dashboard: id, edit: null });
  }

  function closeDashboard() {
    pushBusinessView({ dashboard: null });
  }

  const modalOpen = editModalOpen || createModalOpen;
  const modal = modalOpen ? (
    <BusinessModal onClose={handleCloseModal} onSaved={handleSaved} />
  ) : null;

  if (resolvedDashboardId) {
    return (
      <>
        <BusinessDashboard
          businessId={resolvedDashboardId}
          onClose={closeDashboard}
          onEditProfile={() => openEditModal(resolvedDashboardId)}
          onBusinessIdChange={(id) => openDashboard(id)}
        />
        {modal}
      </>
    );
  }

  if (showList) {
    return (
      <>
        {modalOpen ? (
          modal
        ) : (
          <MyBusiness
            onAddBusiness={openModal}
            onEditBusiness={openEditModal}
            onOpenStatistics={openDashboard}
          />
        )}
      </>
    );
  }

  return (
    <>
      {modalOpen ? (
        modal
      ) : (
        <BusinessEmptyPromo onAddBusiness={openModal} />
      )}
    </>
  );
};

export default Business;
