"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { routes } from "@/config/routes";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";
import { useBusinessApplicationStore } from "@/store/businessApplication.store";
import { useBusinessApplicationApiStore } from "@/store/businessApplicationApi.store";

type StatusModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText: string;
  testId: string;
  onAction: () => void;
  tone?: "success" | "error";
};

function StatusModal({
  isOpen,
  title,
  message,
  buttonText,
  testId,
  onAction,
  tone = "success",
}: StatusModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const accentClass = tone === "success" ? "bg-[#eef4ff] text-[#0a6af7]" : "bg-[#fff1f1] text-[#e02424]";

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/45 px-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        data-testid={testId}
        className="w-full max-w-[420px] rounded-[24px] bg-white px-6 py-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
      >
        <div
          className={`mx-auto mb-4 flex h-[64px] w-[64px] items-center justify-center rounded-full ${accentClass}`}
        >
          {tone === "success" ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M8 12.5l2.5 2.5L16 9"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M8 8l8 8M16 8l-8 8"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </div>
        <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-3 text-[15px] font-semibold text-[var(--text-secondary)]">{message}</p>
        <Button
          text={buttonText}
          onClick={onAction}
          className="mx-auto mt-6"
          data-testid={`${testId}-action`}
        />
      </div>
    </div>,
    document.body,
  );
}

export default function BusinessApplicationStatusModals() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const status = useBusinessApplicationApiStore((state) => state.status);
  const approvalAcknowledged = useBusinessApplicationStore(
    (state) => state.approvalAcknowledged,
  );
  const rejectionAcknowledged = useBusinessApplicationStore(
    (state) => state.rejectionAcknowledged,
  );
  const acknowledgeApproval = useBusinessApplicationStore(
    (state) => state.acknowledgeApproval,
  );
  const acknowledgeRejection = useBusinessApplicationStore(
    (state) => state.acknowledgeRejection,
  );

  const showApproval =
    hydrated && Boolean(token) && status === "approved" && !approvalAcknowledged;
  const showRejection =
    hydrated && Boolean(token) && status === "rejected" && !rejectionAcknowledged;

  return (
    <>
      <StatusModal
        isOpen={showApproval}
        title={t("businessApplication.approvedTitle")}
        message={t("businessApplication.approvedMessage")}
        buttonText={t("businessApplication.returnToBusinessPage")}
        testId="business-application-approved-modal"
        tone="success"
        onAction={() => {
          acknowledgeApproval();
          router.push(routes.business);
        }}
      />
      <StatusModal
        isOpen={showRejection}
        title={t("businessApplication.rejectedTitle")}
        message={t("businessApplication.rejectedMessage")}
        buttonText={t("businessApplication.returnToMainMenu")}
        testId="business-application-rejected-modal"
        tone="error"
        onAction={() => {
          acknowledgeRejection();
          router.push(routes.home);
        }}
      />
    </>
  );
}
