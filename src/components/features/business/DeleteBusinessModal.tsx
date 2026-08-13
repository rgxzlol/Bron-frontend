"use client";

import Image from "next/image";
import { assets } from "@/lib/assets";
import { useTranslation } from "@/lib/i18n/useTranslation";

type DeleteBusinessModalProps = {
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteBusinessModal({
  businessName,
  isOpen,
  onClose,
  onConfirm,
}: DeleteBusinessModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="relative w-full max-w-[842px] rounded-[18px] bg-white p-[24px_27px] shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-9 flex justify-between">
          <div className="flex items-center gap-[14px]">
            <span className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#fde8e8]">
              <Image src={assets.notification.trash} alt="" width={22} height={22} />
            </span>
            <h3 className="text-[20px] font-semibold text-black">
              {t("businessDeleteModal.title")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[55px] w-[71px] items-center justify-center rounded-[12px] bg-[#FAFAFF] transition hover:bg-[#EAEAEF]"
            aria-label={t("common.close")}
          >
            <Image src={assets.map.quitIcon} alt="" width={24} height={24} />
          </button>
        </div>

        <p className="text-[16px] font-semibold leading-relaxed text-[#585858]">
          {t("businessDeleteModal.confirm", { name: businessName })}
        </p>
        <p className="mt-[8px] text-[16px] font-semibold text-[#585858]">
          {t("businessDeleteModal.warning")}
        </p>

        <aside className="mb-[22px] mt-[22px] flex items-center gap-[13px] rounded-[5px] bg-[#fde8e8] p-[23px_19px]">
          <span
            className="grid h-6 w-6 place-items-center rounded-full bg-[#e53935] text-[14px] font-bold text-white"
            aria-hidden
          >
            !
          </span>
          <p className="text-[15px] font-semibold text-black">
            {t("businessDeleteModal.irreversible")}
          </p>
        </aside>

        <div className="flex gap-[28px]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-[75px] w-full max-w-[380px] items-center justify-center rounded-[11px] bg-[#0A6AF7] text-[20px] font-semibold text-white transition hover:bg-[#0856c6]"
          >
            {t("businessDeleteModal.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-[75px] w-full max-w-[380px] items-center justify-center rounded-[11px] bg-[#e53935] text-[20px] font-semibold text-white transition hover:bg-[#c62828]"
          >
            {t("businessDeleteModal.delete")}
          </button>
        </div>
      </section>
    </div>
  );
}
