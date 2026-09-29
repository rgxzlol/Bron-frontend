"use client";

import { useMemo, useState } from "react";
import type { ShopService, ShopsType } from "@/types/shops.types";
import { formatPrice } from "@/lib/formatPrice";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Button from "@/components/shared/Button";
import BusinessCategoryIcon from "@/components/shared/BusinessCategoryIcon";
import s from "./hospitalServicesModal.module.css";

type HospitalServicesModalProps = {
  shop: ShopsType;
  onClose: () => void;
  onContinue: (serviceIds: string[]) => void;
};

function pluralizeServices(count: number, t: (key: string) => string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return t("map.serviceWordMany");
  if (mod10 === 1) return t("map.serviceWordOne");
  if (mod10 >= 2 && mod10 <= 4) return t("map.serviceWordFew");
  return t("map.serviceWordMany");
}

const ICON_TONES = [
  s.iconToneGreen,
  s.iconTonePink,
  s.iconToneBlue,
  s.iconTonePurple,
  s.iconToneYellow,
  s.iconToneSky,
];

export default function HospitalServicesModal({
  shop,
  onClose,
  onContinue,
}: HospitalServicesModalProps) {
  const { t } = useTranslation();
  const services = useMemo<ShopService[]>(
    () => (shop.services ?? []).filter((service) => service.kind !== "product"),
    [shop],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = selectedIds.length;
  const canContinue = selectedCount > 0;

  const totalPrice = useMemo(
    () =>
      services
        .filter((service) => selectedIds.includes(service.id))
        .reduce((sum, service) => sum + service.priceFrom, 0),
    [services, selectedIds],
  );

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
        <div className={s.handle} aria-hidden="true">
          <span className={s.handleBar} />
        </div>

        <div className={s.header}>
          <div className={s.headerText}>
            <h2 className={s.title}>{t("map.services")}</h2>
            <p className={s.subtitle}>
              {t("map.hospitalServicesSubtitle")}
            </p>
          </div>
          <button type="button" className={`${s.close} theme-close-button`} onClick={onClose} aria-label={t("common.close")}>
            ×
          </button>
        </div>

        <div className={s.grid} role="list">
          {services.map((service, index) => {
            const isSelected = selectedIds.includes(service.id);
            return (
              <article
                key={service.id}
                role="listitem"
                className={`${s.card} ${isSelected ? s.cardSelected : ""}`}
              >
                <div className={s.cardInner}>
                  <div
                    className={`${s.iconBox} ${ICON_TONES[index % ICON_TONES.length]}`}
                    aria-hidden
                  >
                    <BusinessCategoryIcon
                      category={service.category || shop.type || shop.category}
                      size={24}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className={s.cardBody}>
                    <h3 className={s.cardTitle}>{service.title}</h3>
                    <p className={s.cardDesc}>{service.description}</p>
                  </div>

                  <div className={s.cardSide}>
                    <div className={s.priceMeta}>
                      <span className={s.price}>
                        {t("map.priceFromShort", { price: formatPrice(service.priceFrom) })}
                      </span>
                      {service.durationMin > 0 && (
                        <span className={s.duration}>
                          {t("map.durationMin", { min: service.durationMin })}
                        </span>
                      )}
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
          <div className={s.totalBox}>
            <div className={s.totalInfo}>
              <span className={s.totalLabel}>{t("booking.total")}</span>
              <span className={s.totalValue}>{formatPrice(totalPrice)}сум</span>
            </div>
            <span className={s.countPill}>
              {selectedCount} {pluralizeServices(selectedCount, t)}
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
