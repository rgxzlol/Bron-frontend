"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ShopService, ShopsType } from "@/types/shops.types";
import { formatPrice } from "@/lib/formatPrice";
import Button from "@/components/shared/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { DEMO_SERVICE_KEYS } from "@/lib/i18n/labels";
import s from "./hospitalServicesModal.module.css";

type HospitalServicesModalProps = {
  shop: ShopsType;
  onClose: () => void;
  onContinue: (serviceIds: string[]) => void;
};

export default function HospitalServicesModal({
  shop,
  onClose,
  onContinue,
}: HospitalServicesModalProps) {
  const { t, locale } = useTranslation();
  const services = useMemo<ShopService[]>(() => shop.services ?? [], [shop]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = selectedIds.length;
  const canContinue = selectedCount > 0;

  function toggleService(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleContinue() {
    if (!canContinue) return;
    onContinue(selectedIds);
  }

  return (
    <div
      className={s.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>{t("map.services")}</h2>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className={s.grid} role="list">
          {services.map((service) => {
            const isSelected = selectedIds.includes(service.id);
            const demoKeys = DEMO_SERVICE_KEYS[service.id];
            const title = demoKeys ? t(demoKeys.title) : service.title;
            const description = demoKeys
              ? t(demoKeys.description)
              : service.description;

            return (
              <article
                key={service.id}
                role="listitem"
                className={`${s.card} ${isSelected ? s.cardSelected : ""}`}
              >
                <div className={s.cardInner}>
                  <div className={s.iconBox} aria-hidden>
                    {service.icon ? (
                      typeof service.icon === "string" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={service.icon}
                          alt=""
                          width={34}
                          height={34}
                          className="h-[34px] w-[34px] rounded-[8px] object-cover"
                        />
                      ) : (
                        <Image src={service.icon} alt="" width={34} height={34} />
                      )
                    ) : (
                      <span className={s.iconFallback} />
                    )}
                  </div>

                  <div className={s.cardBody}>
                    <h3 className={s.cardTitle}>{title}</h3>
                    <p className={s.cardDesc}>{description}</p>
                    <div className={s.cardMeta}>
                      <span className={s.price}>
                        {formatPrice(service.priceFrom, locale)} {t("common.sum")}
                      </span>
                      <span className={s.duration}>
                        {t("map.durationMin", { min: service.durationMin })}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={isSelected ? s.pickBtnPress : s.pickBtn}
                      onClick={() => toggleService(service.id)}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? t("map.selected") : t("map.selectService")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className={s.footer}>
          <div className={s.footerInfo}>
            <span className={s.infoText}>
              {t("map.selectedCount", { count: selectedCount })}
            </span>
          </div>
          <Button
            text={t("map.continue")}
            className={`${s.continueBtn} ${!canContinue ? s.continueDisabled : ""}`}
            onClick={handleContinue}
            disabled={!canContinue}
          />
        </div>
      </div>
    </div>
  );
}
