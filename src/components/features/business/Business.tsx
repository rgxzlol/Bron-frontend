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

const Business = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const businesses = useBusinessStore((s) => s.businesses);
  const showMyBusiness = useBusinessStore((s) => s.showMyBusiness);
  const setShowMyBusiness = useBusinessStore((s) => s.setShowMyBusiness);
  const fetchBusinessesFromApi = useBusinessStore((s) => s.fetchBusinessesFromApi);
  const resetDraft = useBusinessStore((s) => s.resetDraft);
  const loadForEdit = useBusinessStore((s) => s.loadForEdit);
  const token = useAuthStore((s) => s.token);
  const { status, canAccessBusinessPage } = useBusinessNavAccess();

  const editId = searchParams.get("edit");
  const dashboardParam = searchParams.get("dashboard");
  const resolvedDashboardId =
    dashboardParam && businesses.some((business) => business.id === dashboardParam)
      ? dashboardParam
      : null;
  const resolvedEditId =
    editId && businesses.some((business) => business.id === editId) ? editId : null;
  const editModalOpen = Boolean(resolvedEditId);

  const hasBusinesses = businesses.length > 0;
  const showList = hasBusinesses || showMyBusiness;

  useEffect(() => {
    const redirectTo = shouldRedirectFromBusinessPage(status, canAccessBusinessPage);
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [status, canAccessBusinessPage, router]);

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
    if (resolvedEditId) {
      loadForEdit(resolvedEditId);
    }
  }, [resolvedEditId, loadForEdit, businesses]);

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
    setCreateModalOpen(true);
  }

  function openEditModal(id: string) {
    if (!businesses.some((business) => business.id === id)) return;
    loadForEdit(id);
    pushBusinessView({ edit: id, dashboard: null });
  }

  function handleCloseModal() {
    resetDraft();
    if (editModalOpen) {
      pushBusinessView({ edit: null });
      return;
    }
    setCreateModalOpen(false);
  }

  function handleSaved() {
    setCreateModalOpen(false);
    pushBusinessView({ edit: null, dashboard: null });
    setShowMyBusiness(true);
  }

  function openDashboard(id: string) {
    if (!businesses.some((business) => business.id === id)) return;
    pushBusinessView({ dashboard: id, edit: null });
  }

  function closeDashboard() {
    pushBusinessView({ dashboard: null });
  }

  const modal = (editModalOpen || createModalOpen) && (
    <BusinessModal onClose={handleCloseModal} onSaved={handleSaved} />
  );

  if (resolvedDashboardId) {
    return (
      <>
        <BusinessDashboard
          businessId={resolvedDashboardId}
          onClose={closeDashboard}
          onEditProfile={() => openEditModal(resolvedDashboardId)}
        />
        {modal}
      </>
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
        {modal}
      </>
    );
  }

  return (
    <>
      <BusinessEmptyPromo onAddBusiness={openModal} />
      {modal}
    </>
  );
};

export default Business;
