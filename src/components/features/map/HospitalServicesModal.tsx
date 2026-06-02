"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { ShopService, ShopsType } from "@/types/shops.types";
import { formatPrice } from "@/lib/formatPrice";
import Button from "@/components/shared/Button";
import s from "./hospitalServicesModal.module.css";

type HospitalServicesModalProps = {
  hospital: ShopsType;
  onClose: () => void;
  onContinue: (serviceIds: string[]) => void;
};

export default function HospitalServicesModal({
  hospital,
  onClose,
  onContinue,
}: HospitalServicesModalProps) {
  const services = useMemo<ShopService[]>(() => hospital.services ?? [], [hospital]);
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
    <div className={s.backdrop} role="dialog" aria-modal="true">
      <div className={s.modal}>
        <div className={s.header}>
          <h2 className={s.title}>Услуги</h2>
          <button type="button" className={s.close} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={s.grid} role="list">
          {services.map((service) => {
            const isSelected = selectedIds.includes(service.id);
            return (
              <article
                key={service.id}
                role="listitem"
                className={`${s.card} ${isSelected ? s.cardSelected : ""}`}
              >
                <div className={s.cardInner}>
                  <div className={s.iconBox} aria-hidden>
                    {service.icon ? (
                      <Image src={service.icon} alt="" width={34} height={34} />
                    ) : (
                      <span className={s.iconFallback} />
                    )}
                  </div>

                  <div className={s.cardBody}>
                    <h3 className={s.cardTitle}>{service.title}</h3>
                    <p className={s.cardDesc}>{service.description}</p>
                    <div className={s.cardMeta}>
                      <span className={s.price}>От {formatPrice(service.priceFrom)} сум</span>
                      <span className={s.duration}>{service.durationMin}мин</span>
                    </div>
                    <button
                      type="button"
                      className={isSelected ? s.pickBtnPress : s.pickBtn }
                      onClick={() => toggleService(service.id)}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? "Выбрано" : "Выбрать услугу"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className={s.footer}>
          <div className={s.footerInfo}>
            <span className={s.infoText}>Выбрано: {selectedCount} услуг</span>
          </div>
          <Button
            text="Продолжить"
            className={`${s.continueBtn} ${!canContinue ? s.continueDisabled : ""}`}
            onClick={handleContinue}
            disabled={!canContinue}
          />
        </div>
      </div>
    </div>
  );
}
