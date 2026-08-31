"use client";

import { useMemo, useState } from "react";
import type { ShopService, ShopsType } from "@/types/shops.types";
import { formatPrice } from "@/lib/formatPrice";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Button from "@/components/shared/Button";
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

const ICON_TONES = [s.iconTonePink, s.iconToneBlue, s.iconTonePurple];

function ServiceIcon({ index }: { index: number }) {
  const tone = index % 3;

  if (tone === 0) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21s-7.6-4.9-9.4-9.3C1.2 8.5 3.3 5.4 6.4 5.4c1.9 0 3.6 1 4.6 2.6 1-1.6 2.7-2.6 4.6-2.6 3.1 0 5.2 3.1 3.8 6.3C19.6 16.1 12 21 12 21z" />
      </svg>
    );
  }

  if (tone === 1) {
    return (
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </svg>
    );
  }

  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5.6C10.9 4.5 9.5 3.8 8 3.8 5.2 3.8 3.1 6.1 3.4 8.8c.2 2.3 1.2 4.4 1.8 6.6.5 1.9 1 4.8 2.5 4.8 1.8 0 1.4-4.1 4.3-4.1s2.5 4.1 4.3 4.1c1.5 0 2-2.9 2.5-4.8.6-2.2 1.6-4.3 1.8-6.6.3-2.7-1.8-5-4.6-5-1.5 0-2.9.7-4 1.8z" />
    </svg>
  );
}

export default function HospitalServicesModal({
  shop,
  onClose,
  onContinue,
}: HospitalServicesModalProps) {
  const { t } = useTranslation();
  const services = useMemo<ShopService[]>(() => shop.services ?? [], [shop]);
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
          <button type="button" className={s.close} onClick={onClose} aria-label={t("common.close")}>
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
                    className={`${s.iconBox} ${ICON_TONES[index % 3]}`}
                    aria-hidden
                  >
                    <ServiceIcon index={index} />
                  </div>

                  <div className={s.cardBody}>
                    <h3 className={s.cardTitle}>{service.title}</h3>
                    <p className={s.cardDesc}>{service.description}</p>
                  </div>

                  <div className={s.cardSide}>
                    <span className={s.price}>
                      {t("map.priceFromShort", { price: formatPrice(service.priceFrom) })}
                    </span>
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
