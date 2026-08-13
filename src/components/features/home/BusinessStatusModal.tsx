"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { useBusinessFormStore } from "@/store/businessForm.store";
import { routes } from "@/config/routes";

export default function BusinessStatusModal() {
  const router = useRouter();
  const applicationStatus = useBusinessFormStore((s) => s.applicationStatus);
  const dismissResult = useBusinessFormStore((s) => s.dismissResult);

  if (applicationStatus !== "approved" && applicationStatus !== "rejected") {
    return null;
  }

  const isApproved = applicationStatus === "approved";

  function handleClose() {
    dismissResult();
    if (isApproved) {
      router.push(routes.business);
    } else {
      router.push(routes.home);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-[420px] rounded-[24px] bg-white p-[32px] text-center">
        <div
          className={`mx-auto mb-[16px] flex h-[72px] w-[72px] items-center justify-center rounded-full ${
            isApproved ? "bg-[#16a34a]" : "bg-[#e53935]"
          }`}
        >
          <span className="text-[36px] text-white">
            {isApproved ? "✓" : "✕"}
          </span>
        </div>

        <h2 className="mb-[12px] text-[24px] font-semibold">
          {isApproved ? "Ваша заявка одобрена" : "Ваша заявка отклонена"}
        </h2>

        <p className="mb-[24px] text-[16px] leading-[19px] text-[var(--text-muted)]">
          {isApproved
            ? "Ваша заявка была одобрена и ваш бизнес будет добавлен на карту. Теперь вы можете продвигать свой бизнес на нашей платформе"
            : "Ваша заявка была отклонена. Обратитесь в поддержку чтобы узнать причину"}
        </p>

        <Button
          text={
            isApproved
              ? "Вернуться на бизнес страницу"
              : "Вернуться в главное меню"
          }
          onClick={handleClose}
          className="w-full justify-center"
        />
      </div>
    </div>
  );
}
