"use client";

import Button from "@/components/shared/Button";
import { assets } from "@/lib/assets";
import { formatPrice } from "@/lib/formatPrice";
import {
  BUSINESS_CATEGORIES,
  SERVICE_CATEGORIES,
  type BusinessService,
  type SavedBusiness,
  useBusinessStore,
} from "@/store/business.store";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import s from "./businessModal.module.css";

type Props = {
  businessId: string;
  onClose: () => void;
  onEditProfile: () => void;
};

type Tab = "services" | "bookings";

const inputClass =
  "w-full rounded-[14px] bg-[#f4f4f8] px-[18px] py-[14px] text-[16px] outline-none focus:ring-2 focus:ring-[#0a6af7]/30";

const MAX_DESC = 120;

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[28px] w-[52px] shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#0a6af7]" : "bg-[#d0d0d8]"
      }`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all ${
          checked ? "left-[27px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

function PhotoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0a6af7" strokeWidth="2" />
      <circle cx="9" cy="10" r="2" fill="#0a6af7" />
      <path d="M21 15l-5-5-4 4-2-2-5 5" stroke="#0a6af7" strokeWidth="2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12"
        stroke="#e53935"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseModalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

async function readImageFile(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  if (file.size > 2 * 1024 * 1024) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

type ServiceFormData = {
  name: string;
  price: string;
  category: string;
  description: string;
  photo: string | null;
};

const emptyServiceForm = (): ServiceFormData => ({
  name: "",
  price: "",
  category: "",
  description: "",
  photo: null,
});

function DeleteServiceModal({
  serviceName,
  onCancel,
  onConfirm,
}: {
  serviceName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-[20px]">
      <div className="w-full max-w-[520px] rounded-[24px] bg-white p-[28px] shadow-xl">
        <div className="mb-[20px] flex items-start justify-between">
          <div className="flex items-center gap-[14px]">
            <span className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#fde8e8]">
              <TrashIcon />
            </span>
            <h3 className="text-[22px] font-semibold">Удалить услугу</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#f4f4f8]"
          >
            <CloseModalIcon />
          </button>
        </div>

        <p className="text-[16px] leading-relaxed">
          Вы уверены что хотите удалить услугу{" "}
          <strong>{serviceName}</strong>
        </p>
        <p className="mt-[10px] text-[14px] opacity-60">
          Все данные об услуге, время, даты и свободные слоты удалятся без
          возможности восстановить
        </p>

        <div className="mt-[20px] flex items-start gap-[12px] rounded-[14px] bg-[#fde8e8] px-[16px] py-[14px]">
          <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#e53935] text-[14px] font-bold text-white">
            !
          </span>
          <p className="text-[14px] leading-snug">
            Это действие нельзя будет отменить. Пожалуйста, убедитесь, что вы
            сохранили важные данные
          </p>
        </div>

        <div className="mt-[24px] flex gap-[12px]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[14px] bg-[#0a6af7] py-[14px] text-[16px] font-semibold text-white"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-[14px] bg-[#e53935] py-[14px] text-[16px] font-semibold text-white"
          >
            Удалить услугу
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceFormModal({
  title,
  subtitle,
  saveLabel,
  onClose,
  onSave,
}: {
  title: string;
  subtitle: string;
  saveLabel: string;
  onClose: () => void;
  onSave: (data: ServiceFormData) => void;
}) {
  const [form, setForm] = useState<ServiceFormData>(emptyServiceForm);
  const photoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-[20px]">
      <div className="max-h-[90dvh] w-full max-w-[900px] overflow-y-auto rounded-[24px] bg-white p-[32px] shadow-xl">
        <h3 className="text-[28px] font-semibold">{title}</h3>
        <p className="mt-[6px] text-[15px] opacity-60">{subtitle}</p>

        <div className="mt-[28px] grid grid-cols-1 gap-[24px] md:grid-cols-2">
          <div className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">Название</span>
              <input
                className={inputClass}
                placeholder="Введите название"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">Цена</span>
              <div className="flex gap-[10px]">
                <input
                  className={`${inputClass} flex-1`}
                  placeholder="Введите цену"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
                <select className={`${inputClass} w-[100px]`}>
                  <option>Сум</option>
                </select>
              </div>
            </label>

            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">Категория</span>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                <option value="">Выберите категорию</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">Описание</span>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                placeholder="Опишите товар"
                maxLength={MAX_DESC}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <span className="text-[14px] opacity-60">
                {form.description.length}/{MAX_DESC}
              </span>
            </label>

            <div className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">
                Фото услуги или товара
              </span>
              <input
                ref={photoRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await readImageFile(file);
                  if (url) setForm((f) => ({ ...f, photo: url }));
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex h-[160px] flex-col items-center justify-center gap-[10px] rounded-[16px] bg-[#f4f4f8]"
              >
                {form.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.photo}
                    alt=""
                    className="h-full w-full rounded-[16px] object-cover"
                  />
                ) : (
                  <>
                    <PhotoIcon />
                    <span className="text-[15px] font-semibold text-[#0a6af7]">
                      Загрузить фото
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-[28px] flex gap-[12px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[14px] border border-[#e0e0e8] py-[14px] text-[16px] font-semibold"
          >
            Назад
          </button>
          <Button
            text={saveLabel}
            onClick={() => {
              if (!form.name.trim()) {
                alert("Укажите название");
                return;
              }
              const price = Number(form.price.replace(/\s/g, ""));
              if (!price || price <= 0) {
                alert("Укажите цену");
                return;
              }
              onSave(form);
            }}
            className="flex-1 !w-full text-center !px-[20px]"
          />
        </div>
      </div>
    </div>
  );
}

function ServiceRowMenu({
  onDelete,
  onClose,
}: {
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-10 mt-[6px] min-w-[180px] rounded-[14px] bg-white p-[8px] shadow-lg"
    >
      <button
        type="button"
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="flex w-full items-center gap-[10px] rounded-[10px] px-[12px] py-[10px] text-[14px] font-semibold text-[#e53935] hover:bg-[#fde8e8]"
      >
        <TrashIcon />
        Удалить
      </button>
    </div>
  );
}

export default function BusinessDashboard({
  businessId,
  onClose,
  onEditProfile,
}: Props) {
  const getBusiness = useBusinessStore((s) => s.getBusiness);
  const addService = useBusinessStore((s) => s.addService);
  const addProduct = useBusinessStore((s) => s.addProduct);
  const removeService = useBusinessStore((s) => s.removeService);
  const toggleService = useBusinessStore((s) => s.toggleService);
  const updateBookingStatus = useBusinessStore((s) => s.updateBookingStatus);
  const businesses = useBusinessStore((s) => s.businesses);

  const business = useMemo(
    () => getBusiness(businessId),
    [businessId, getBusiness, businesses],
  );

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("services");
  const [showAddService, setShowAddService] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BusinessService | null>(
    null,
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !business) return null;

  const profileImage =
    business.profilePhoto ??
    business.gallery.find(Boolean) ??
    assets.map.photo1;
  const isDataUrl = typeof profileImage === "string";

  function handleAddService(data: ServiceFormData) {
    addService(businessId, {
      name: data.name,
      category: data.category || "Другое",
      price: Number(data.price.replace(/\s/g, "")),
      description: data.description,
      photo: data.photo,
      type: "service",
    });
    setShowAddService(false);
  }

  function handleAddProduct(data: ServiceFormData) {
    addProduct(businessId, {
      name: data.name,
      category: data.category || "Другое",
      price: Number(data.price.replace(/\s/g, "")),
      description: data.description,
      photo: data.photo,
    });
    setShowAddProduct(false);
  }

  return createPortal(
    <>
      <div className={s.backdrop}>
        <div className={s.panel}>
          <div className="mb-[8px]">
            <h2 className="text-[32px] font-semibold">Бизнес страница</h2>
            <div className="mt-[16px] flex gap-[32px] border-b border-[#ececf2]">
              <button
                type="button"
                onClick={() => setTab("services")}
                className={`pb-[12px] text-[16px] font-semibold transition ${
                  tab === "services"
                    ? "border-b-2 border-[#0a6af7] text-[#0a6af7]"
                    : "opacity-60"
                }`}
              >
                Услуги и персонал
              </button>
              <button
                type="button"
                onClick={() => setTab("bookings")}
                className={`pb-[12px] text-[16px] font-semibold transition ${
                  tab === "bookings"
                    ? "border-b-2 border-[#0a6af7] text-[#0a6af7]"
                    : "opacity-60"
                }`}
              >
                Бронирование
              </button>
            </div>
          </div>

          {tab === "services" && (
            <>
              <section className="rounded-[24px] border border-[#ececf2] bg-white p-[28px]">
                <div className="flex flex-wrap items-start justify-between gap-[16px]">
                  <div className="flex flex-wrap items-center gap-[24px]">
                    <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-full bg-[#f4f4f8]">
                      {isDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profileImage as string}
                          alt={business.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={profileImage}
                          alt={business.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-[24px] font-semibold">
                        {business.name}
                      </h3>
                      <p className="mt-[6px] flex items-center gap-[6px] text-[15px]">
                        <Image
                          src={assets.popular.starRating}
                          alt=""
                          width={16}
                          height={16}
                        />
                        0,0 (0 отзыва)
                      </p>
                      <p className="mt-[6px] flex items-center gap-[6px] text-[15px] opacity-75">
                        <Image
                          src={assets.map.geoMark}
                          alt=""
                          width={14}
                          height={14}
                        />
                        {business.address || "Ташкент, Узбекистан"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-[10px]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-[12px] border border-[#e0e0e8] px-[20px] py-[10px] text-[15px] font-semibold"
                    >
                      Назад
                    </button>
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="rounded-[12px] border border-[#e0e0e8] px-[20px] py-[10px] text-[15px] font-semibold"
                    >
                      Редактировать профиль
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-[24px] border border-[#ececf2] bg-white p-[28px]">
                <div className="mb-[20px] flex items-start justify-between gap-[16px]">
                  <div>
                    <h3 className="text-[22px] font-semibold">Услуги</h3>
                    <p className="mt-[6px] text-[15px] opacity-60">
                      Рабочие дни и услуги
                    </p>
                  </div>
                  <Button
                    text="Добавить товар"
                    onClick={() => setShowAddProduct(true)}
                    className="!px-[24px] py-[12px] text-[15px]"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-[14px]">
                    <thead>
                      <tr className="border-b border-[#ececf2] text-[13px] opacity-60">
                        <th className="pb-[12px] pr-[12px] font-semibold">
                          Название
                        </th>
                        <th className="pb-[12px] pr-[12px] font-semibold">
                          Категория
                        </th>
                        <th className="pb-[12px] pr-[12px] font-semibold">
                          Цена
                        </th>
                        <th className="pb-[12px] pr-[12px] font-semibold">
                          Описание
                        </th>
                        <th className="pb-[12px] pr-[12px] font-semibold">
                          Фото
                        </th>
                        <th className="pb-[12px] pr-[12px] font-semibold">
                          Статус
                        </th>
                        <th className="pb-[12px] font-semibold">Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {business.services.map((service) => (
                        <tr
                          key={service.id}
                          className="border-b border-[#f4f4f8] last:border-0"
                        >
                          <td className="py-[14px] pr-[12px] font-semibold">
                            {service.name}
                          </td>
                          <td className="py-[14px] pr-[12px]">
                            {service.category}
                          </td>
                          <td className="py-[14px] pr-[12px]">
                            {formatPrice(service.price)}
                          </td>
                          <td className="max-w-[200px] truncate py-[14px] pr-[12px] opacity-75">
                            {service.description}
                          </td>
                          <td className="py-[14px] pr-[12px]">
                            <div className="h-[40px] w-[56px] overflow-hidden rounded-[8px] bg-[#f4f4f8]">
                              {service.photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={service.photo}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Image
                                  src={assets.map.photo1}
                                  alt=""
                                  width={56}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-[14px] pr-[12px]">
                            <Toggle
                              checked={service.active}
                              onChange={(active) =>
                                toggleService(businessId, service.id, active)
                              }
                            />
                          </td>
                          <td className="relative py-[14px]">
                            <button
                              type="button"
                              className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#f4f4f8] text-[18px]"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === service.id ? null : service.id,
                                )
                              }
                            >
                              ⋮
                            </button>
                            {openMenuId === service.id && (
                              <ServiceRowMenu
                                onDelete={() => setDeleteTarget(service)}
                                onClose={() => setOpenMenuId(null)}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="flex gap-[16px] pb-[20px]">
                <Button
                  text="Добавить услугу"
                  onClick={() => setShowAddService(true)}
                  className="flex-1 !w-full text-center !px-[20px] text-[17px]"
                />
                <Button
                  text="Сохранить изменение"
                  onClick={onClose}
                  className="flex-1 !w-full text-center !px-[20px] text-[17px]"
                />
              </div>
            </>
          )}

          {tab === "bookings" && (
            <section className="rounded-[24px] border border-[#ececf2] bg-white p-[28px]">
              <div className="mb-[24px] flex items-center justify-between">
                <h3 className="text-[22px] font-semibold">Бронирования</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[12px] border border-[#e0e0e8] px-[20px] py-[10px] text-[15px] font-semibold"
                >
                  Назад
                </button>
              </div>

              <div className="flex flex-col gap-[14px]">
                {business.bookingRequests.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-wrap items-center justify-between gap-[16px] rounded-[16px] border border-[#ececf2] px-[20px] py-[16px]"
                  >
                    <div className="flex flex-wrap items-center gap-[20px]">
                      <span className="text-[18px] font-semibold">
                        {booking.time}
                      </span>
                      <span className="text-[16px] font-semibold">
                        {booking.customerName}
                      </span>
                      <span className="text-[15px] opacity-75">
                        {booking.serviceName}
                      </span>
                      <span className="text-[15px] font-semibold">
                        Цена {formatPrice(booking.price)}
                      </span>
                    </div>

                    {booking.status === "waiting" ? (
                      <span className="rounded-[12px] border border-[#e0e0e8] px-[28px] py-[12px] text-[15px] font-semibold opacity-60">
                        Ожидает
                      </span>
                    ) : booking.status === "pending" ? (
                      <div className="flex gap-[10px]">
                        <Button
                          text="Принять бронь"
                          onClick={() =>
                            updateBookingStatus(
                              businessId,
                              booking.id,
                              "accepted",
                            )
                          }
                          className="!px-[24px] py-[12px] text-[14px]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateBookingStatus(
                              businessId,
                              booking.id,
                              "cancelled",
                            )
                          }
                          className="rounded-[12px] border border-[#e0e0e8] px-[24px] py-[12px] text-[14px] font-semibold"
                        >
                          Отменить
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`rounded-[12px] px-[20px] py-[10px] text-[14px] font-semibold ${
                          booking.status === "accepted"
                            ? "bg-[#e8f8ee] text-[#1a9b4a]"
                            : "bg-[#fde8e8] text-[#e53935]"
                        }`}
                      >
                        {booking.status === "accepted"
                          ? "Принято"
                          : "Отменено"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {showAddService && (
        <ServiceFormModal
          title="Добавить услугу"
          subtitle="Добавьте услугу для брони"
          saveLabel="Сохранить услуги"
          onClose={() => setShowAddService(false)}
          onSave={handleAddService}
        />
      )}

      {showAddProduct && (
        <ServiceFormModal
          title="Добавить товар"
          subtitle="Заполните информацией о вашем товаре"
          saveLabel="Сохранить услуги или товар"
          onClose={() => setShowAddProduct(false)}
          onSave={handleAddProduct}
        />
      )}

      {deleteTarget && (
        <DeleteServiceModal
          serviceName={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            removeService(businessId, deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </>,
    document.body,
  );
}
