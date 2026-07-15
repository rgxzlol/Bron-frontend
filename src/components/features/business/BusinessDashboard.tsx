"use client";

import Button from "@/components/shared/Button";
import { assets } from "@/lib/assets";
import {
  formatPrice,
  formatPriceInput,
  formatPriceInputOnChange,
  parsePrice,
} from "@/lib/formatPrice";
import {
  SERVICE_CATEGORIES,
  type BusinessService,
  useBusinessStore,
} from "@/store/business.store";
import {
  SERVICE_CATEGORY_KEYS,
  translateLabel,
} from "@/lib/i18n/labels";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

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
      className={`relative h-[28px] w-[52px] shrink-0 rounded-full transition-colors ${checked ? "bg-[#0a6af7]" : "bg-[#d0d0d8]"
        }`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all ${checked ? "left-[27px]" : "left-[3px]"
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
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-[20px]">
      <div className="w-full max-w-[520px] rounded-[24px] bg-white p-[28px] shadow-xl">
        <div className="mb-[20px] flex items-start justify-between">
          <div className="flex items-center gap-[14px]">
            <span className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#fde8e8]">
              <TrashIcon />
            </span>
            <h3 className="text-[22px] font-semibold">
              {t("businessDashboard.deleteTitle")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#f4f4f8]"
            aria-label={t("common.close")}
          >
            <CloseModalIcon />
          </button>
        </div>

        <p className="text-[16px] leading-relaxed">
          {t("businessDashboard.deleteConfirm")}{" "}
          <strong>{serviceName}</strong>
        </p>
        <p className="mt-[10px] text-[14px] opacity-60">
          {t("businessDashboard.deleteHint")}
        </p>

        <div className="mt-[20px] flex items-start gap-[12px] rounded-[14px] bg-[#fde8e8] px-[16px] py-[14px]">
          <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#e53935] text-[14px] font-bold text-white">
            !
          </span>
          <p className="text-[14px] leading-snug">
            {t("businessDashboard.deleteWarning")}
          </p>
        </div>

        <div className="mt-[24px] flex gap-[12px]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[14px] bg-[#0a6af7] py-[14px] text-[16px] font-semibold text-white"
          >
            {t("businessDashboard.deleteCancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-[14px] bg-[#e53935] py-[14px] text-[16px] font-semibold text-white"
          >
            {t("businessDashboard.deleteConfirmBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <select
        className={`${inputClass} appearance-none pr-[34px]`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("businessForms.selectCategory")}</option>
        {SERVICE_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {translateLabel(t, cat, SERVICE_CATEGORY_KEYS)}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-[7px] top-1/2 -translate-y-1/2 text-[#6b7280]">
        <ChevronDownIcon />
      </span>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
      <path
        d="M1 1.5L6 6.5L11 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PriceField({
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[15px] font-semibold text-black">{label}</span>
      <div className="flex items-stretch gap-[8px]">
        <input
          type="text"
          className="min-w-0 flex-1 rounded-[14px] bg-[#f4f4f8] px-[18px] py-[14px] text-[16px] text-black outline-none placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#0a6af7]/30"
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(formatPriceInputOnChange(e.target.value))}
        />
        <div className="relative w-[108px] shrink-0">
          <select
            className="h-full w-full appearance-none rounded-[14px] bg-[#f4f4f8] py-[14px] pl-[18px] pr-[34px] text-[16px] font-semibold text-black outline-none focus:ring-2 focus:ring-[#0a6af7]/30"
            defaultValue="sum"
            aria-label={t("businessForms.currencyAria")}
          >
            <option value="sum">{t("businessForms.currencySum")}</option>
          </select>
          <span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[#6b7280]">
            <ChevronDownIcon />
          </span>
        </div>
      </div>
      <FieldError show={error} />
    </div>
  );
}

function PhotoUploadField({
  label,
  photo,
  onPhotoChange,
}: {
  label: string;
  photo: string | null;
  onPhotoChange: (photo: string | null) => void;
}) {
  const { t } = useTranslation();
  const photoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[15px] font-semibold">{label}</span>
      <input
        ref={photoRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = await readImageFile(file);
          if (url) onPhotoChange(url);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => photoRef.current?.click()}
        className="flex h-[160px] flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[16px] bg-[#f4f4f8]"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <PhotoIcon />
            <span className="text-[15px] font-semibold text-[#0a6af7]">
              {t("businessForms.uploadPhoto")}
            </span>
          </>
        )}
      </button>
    </div>
  );
}

function FormModalFooter({
  saveLabel,
  onClose,
  onSave,
  saveDisabled,
}: {
  saveLabel: string;
  onClose: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-[28px] flex gap-[12px]">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-[14px] bg-[#f4f4f8] py-[14px] text-[16px] font-semibold"
      >
        {t("common.back")}
      </button>
      <Button
        text={saveLabel}
        onClick={onSave}
        disabled={saveDisabled}
        className="flex-1 !w-full text-center !px-[20px] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

type FormFieldErrors = {
  name?: boolean;
  price?: boolean;
};

function getFormFieldErrors(form: ServiceFormData): FormFieldErrors {
  return {
    name: !form.name.trim(),
    price: parsePrice(form.price) <= 0,
  };
}

function hasFormFieldErrors(errors: FormFieldErrors): boolean {
  return Boolean(errors.name || errors.price);
}

function FieldError({ show }: { show?: boolean }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <span className="text-[13px] text-[#e53935]">
      {t("businessForms.required")}
    </span>
  );
}

function useRequiredFormSubmit(form: ServiceFormData) {
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

  function validate(): boolean {
    const errors = getFormFieldErrors(form);
    setFieldErrors(errors);
    return !hasFormFieldErrors(errors);
  }

  function clearFieldError(field: keyof FormFieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  return { fieldErrors, validate, clearFieldError };
}

function ProductFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: ServiceFormData) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ServiceFormData>(emptyServiceForm);
  const { fieldErrors, validate, clearFieldError } = useRequiredFormSubmit(form);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-[20px]"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-[900px] overflow-y-auto rounded-[24px] bg-white p-[32px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[28px] font-semibold">
          {t("businessForms.addProductTitle")}
        </h3>
        <p className="mt-[6px] text-[15px] opacity-60">
          {t("businessForms.addProductSubtitle")}
        </p>

        <div className="mt-[28px] grid grid-cols-1 gap-[24px] md:grid-cols-2">
          <div className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">
                {t("businessForms.productName")}
              </span>
              <input
                className={inputClass}
                placeholder={t("businessForms.productNamePlaceholder")}
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name }));
                  if (name.trim()) clearFieldError("name");
                }}
              />
              <FieldError show={fieldErrors.name} />
            </label>

            <PriceField
              label={t("businessForms.price")}
              placeholder={t("businessForms.pricePlaceholder")}
              value={form.price}
              error={fieldErrors.price}
              onChange={(price) => {
                setForm((f) => ({ ...f, price }));
                if (parsePrice(price) > 0) clearFieldError("price");
              }}
            />

            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">
                {t("businessForms.category")}
              </span>
              <CategorySelect
                value={form.category}
                onChange={(category) => setForm((f) => ({ ...f, category }))}
              />
            </label>
          </div>

          <div className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">
                {t("businessForms.description")}
              </span>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                placeholder={t("businessForms.productDescriptionPlaceholder")}
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

            <PhotoUploadField
              label={t("businessForms.photoServiceOrProduct")}
              photo={form.photo}
              onPhotoChange={(photo) => setForm((f) => ({ ...f, photo }))}
            />
          </div>
        </div>

        <FormModalFooter
          saveLabel={t("businessForms.saveServiceOrProduct")}
          onClose={onClose}
          saveDisabled={hasFormFieldErrors(fieldErrors)}
          onSave={() => {
            if (!validate()) return;
            onSave({ ...form, price: String(parsePrice(form.price)) });
          }}
        />
      </div>
    </div>
  );
}

function AddServiceFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: ServiceFormData) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ServiceFormData>(emptyServiceForm);
  const { fieldErrors, validate, clearFieldError } = useRequiredFormSubmit(form);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-[20px]"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-[900px] overflow-y-auto rounded-[24px] bg-white p-[32px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[28px] font-semibold">
          {t("businessForms.addServiceTitle")}
        </h3>
        <p className="mt-[6px] text-[15px] opacity-60">
          {t("businessForms.addServiceSubtitle")}
        </p>

        <div className="mt-[28px] grid grid-cols-1 gap-[24px] md:grid-cols-2">
          <div className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">
                {t("businessForms.serviceName")}
              </span>
              <input
                className={inputClass}
                placeholder={t("businessForms.serviceNamePlaceholder")}
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name }));
                  if (name.trim()) clearFieldError("name");
                }}
              />
              <FieldError show={fieldErrors.name} />
            </label>

            <PriceField
              label={t("businessForms.servicePrice")}
              placeholder={t("businessForms.pricePlaceholder")}
              value={form.price}
              error={fieldErrors.price}
              onChange={(price) => {
                setForm((f) => ({ ...f, price }));
                if (parsePrice(price) > 0) clearFieldError("price");
              }}
            />

            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">
                {t("businessForms.category")}
              </span>
              <CategorySelect
                value={form.category}
                onChange={(category) => setForm((f) => ({ ...f, category }))}
              />
            </label>
          </div>

          <div className="flex flex-col gap-[18px]">
            <label className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-semibold">
                {t("businessForms.serviceDescription")}
              </span>
              <textarea
                className={`${inputClass} min-h-[120px] resize-y`}
                placeholder={t("businessForms.serviceDescriptionPlaceholder")}
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

            <PhotoUploadField
              label={t("businessForms.photo")}
              photo={form.photo}
              onPhotoChange={(photo) => setForm((f) => ({ ...f, photo }))}
            />
          </div>
        </div>

        <FormModalFooter
          saveLabel={t("businessForms.saveService")}
          onClose={onClose}
          saveDisabled={hasFormFieldErrors(fieldErrors)}
          onSave={() => {
            if (!validate()) return;
            onSave({ ...form, price: String(parsePrice(form.price)) });
          }}
        />
      </div>
    </div>
  );
}

export default function BusinessDashboard({
  businessId,
  onClose,
  onEditProfile,
}: Props) {
  const addService = useBusinessStore((s) => s.addService);
  const addProduct = useBusinessStore((s) => s.addProduct);
  const removeService = useBusinessStore((s) => s.removeService);
  const updateService = useBusinessStore((s) => s.updateService);
  const toggleService = useBusinessStore((s) => s.toggleService);
  const updateBookingStatus = useBusinessStore((s) => s.updateBookingStatus);
  const refreshBusinessBookings = useBusinessStore((s) => s.refreshBusinessBookings);
  const businesses = useBusinessStore((s) => s.businesses);
  const { t, locale } = useTranslation();

  const business = useMemo(() => {
    const item = businesses.find((entry) => entry.id === businessId);
    if (!item) return undefined;

    return {
      ...item,
      services: item.services ?? [],
      bookingRequests: item.bookingRequests ?? [],
    };
  }, [businessId, businesses]);

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("services");
  const [showAddService, setShowAddService] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BusinessService | null>(
    null,
  );
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (tab !== "bookings") return;
    void refreshBusinessBookings(businessId);
  }, [tab, businessId, refreshBusinessBookings]);

  if (!mounted || !business) return null;

  const profileImage =
    business.profilePhoto ??
    business.gallery.find(Boolean) ??
    assets.map.photo1;
  const isDataUrl = typeof profileImage === "string";

  function commitPriceEdit(serviceId: string, fallbackPrice: number) {
    const raw = priceEdits[serviceId];
    if (raw === undefined) return;

    const price = parsePrice(raw);
    if (price > 0) {
      updateService(businessId, serviceId, { price });
    }

    setPriceEdits((current) => {
      const next = { ...current };
      delete next[serviceId];
      return next;
    });
  }

  function commitAllPriceEdits() {
    if (!business) return;

    for (const service of business.services) {
      const raw = priceEdits[service.id];
      if (raw === undefined) continue;

      const price = parsePrice(raw);
      if (price > 0) {
        updateService(businessId, service.id, { price });
      }
    }

    setPriceEdits({});
  }

  function handleSaveChanges() {
    commitAllPriceEdits();
    onClose();
  }

  function handlePriceBlur(serviceId: string, fallbackPrice: number) {
    commitPriceEdit(serviceId, fallbackPrice);
  }

  function handlePriceFocus(serviceId: string, currentPrice: number) {
    setPriceEdits((current) => ({
      ...current,
      [serviceId]: current[serviceId] ?? formatPriceInput(currentPrice),
    }));
  }

  function handleAddService(data: ServiceFormData) {
    addService(businessId, {
      name: data.name,
      category: data.category || "Другое",
      price: parsePrice(data.price),
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
      price: parsePrice(data.price),
      description: data.description,
      photo: data.photo,
    });
    setShowAddProduct(false);
  }

  return (
    <>
      <div className="flex min-w-0 w-full flex-col gap-[20px] px-[23px] py-[26px] pb-[40px]">
        <div className="mb-[8px]">
          <h2 className="text-[32px] font-semibold">
            {t("businessDashboard.title")}
          </h2>
          <div className="mt-[16px] flex gap-[32px] border-b border-[#ececf2]">
            <button
              type="button"
              onClick={() => setTab("services")}
              className={`pb-[12px] text-[16px] font-semibold transition ${tab === "services"
                  ? "border-b-2 border-[#0a6af7] text-[#0a6af7]"
                  : "opacity-60"
                }`}
            >
              {t("businessDashboard.tabServices")}
            </button>
            <button
              type="button"
              onClick={() => setTab("bookings")}
              className={`pb-[12px] text-[16px] font-semibold transition ${tab === "bookings"
                  ? "border-b-2 border-[#0a6af7] text-[#0a6af7]"
                  : "opacity-60"
                }`}
            >
              {t("businessDashboard.tabBookings")}
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
                      {t("businessDashboard.reviewsCount")}
                    </p>
                    <p className="mt-[6px] flex items-center gap-[6px] text-[15px] opacity-75">
                      <Image
                        src={assets.map.geoMark}
                        alt=""
                        width={14}
                        height={14}
                      />
                      {business.address || t("business.defaultAddress")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-[10px]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-[12px] border border-[#e0e0e8] px-[20px] py-[10px] text-[15px] font-semibold"
                  >
                    {t("common.back")}
                  </button>
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="rounded-[12px] border border-[#e0e0e8] px-[20px] py-[10px] text-[15px] font-semibold"
                  >
                    {t("businessDashboard.editProfile")}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#ececf2] bg-white p-[28px]">
              <div className="mb-[20px] flex items-start justify-between gap-[16px]">
                <div>
                  <h3 className="text-[22px] font-semibold">
                    {t("businessDashboard.servicesTitle")}
                  </h3>
                  <p className="mt-[6px] text-[15px] opacity-60">
                    {t("businessDashboard.servicesSubtitle")}
                  </p>
                </div>
                <Button
                  text={t("business.addProduct")}
                  onClick={() => setShowAddProduct(true)}
                  className="!px-[24px] py-[12px] text-[15px]"
                />
              </div>

              <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-[#ececf2] text-[13px] opacity-60">
                      <th className="pb-[12px] pr-[12px] font-semibold">
                        {t("businessDashboard.colName")}
                      </th>
                      <th className="pb-[12px] pr-[12px] font-semibold">
                        {t("businessDashboard.colCategory")}
                      </th>
                      <th className="pb-[12px] pr-[12px] font-semibold">
                        {t("businessDashboard.colPrice")}
                      </th>
                      <th className="pb-[12px] pr-[12px] font-semibold">
                        {t("businessDashboard.colDescription")}
                      </th>
                      <th className="pb-[12px] pr-[12px] font-semibold">
                        {t("businessDashboard.colPhoto")}
                      </th>
                      <th className="pb-[12px] pr-[12px] font-semibold">
                        {t("businessDashboard.colStatus")}
                      </th>
                      <th className="pb-[12px] font-semibold">
                        {t("businessDashboard.colAction")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {business.services.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-[24px] text-center text-[15px] opacity-60"
                        >
                          {t("businessDashboard.emptyServices")}
                        </td>
                      </tr>
                    )}
                    {business.services.map((service) => (
                      <tr
                        key={service.id}
                        className="border-b border-[#f4f4f8] last:border-0"
                      >
                        <td className="py-[14px] pr-[12px] font-semibold">
                          {service.name}
                        </td>
                        <td className="py-[14px] pr-[12px]">
                          {translateLabel(
                            t,
                            service.category,
                            SERVICE_CATEGORY_KEYS,
                          )}
                        </td>
                        <td className="py-[14px] pr-[12px]">
                          <input
                            type="text"
                            className="w-[130px] rounded-[10px] bg-[#f4f4f8] px-[10px] py-[8px] text-[14px] text-black outline-none focus:ring-2 focus:ring-[#0a6af7]/30"
                            inputMode="numeric"
                            autoComplete="off"
                            aria-label={t("businessDashboard.priceAria", {
                              name: service.name,
                            })}
                            value={
                              priceEdits[service.id] ??
                              formatPriceInput(service.price)
                            }
                            onFocus={() =>
                              handlePriceFocus(service.id, service.price)
                            }
                            onChange={(e) =>
                              setPriceEdits((current) => ({
                                ...current,
                                [service.id]: formatPriceInputOnChange(
                                  e.target.value,
                                ),
                              }))
                            }
                            onBlur={() =>
                              handlePriceBlur(service.id, service.price)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                              }
                            }}
                          />
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
                        <td className="py-[14px]">
                          <button
                            type="button"
                            aria-label={t("businessDashboard.deleteAria", {
                              name: service.name,
                            })}
                            className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#fde8e8] transition hover:bg-[#f9d4d4]"
                            onClick={() => setDeleteTarget(service)}
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="flex gap-[16px] pb-[20px] ">
              <Button
                text={t("business.addService")}
                onClick={() => setShowAddService(true)}
                className="flex-1 !w-full text-center !px-[20px] text-[17px]"
              />
              <Button
                text={t("business.saveChanges")}
                onClick={handleSaveChanges}
                className="flex-1 !w-full text-center !px-[20px] text-[17px]"
              />
            </div>
          </>
        )}

        {tab === "bookings" && (
          <section className="rounded-[24px] border border-[#ececf2] bg-white p-[28px]">
            <div className="mb-[24px] flex items-center justify-between">
              <h3 className="text-[22px] font-semibold">
                {t("businessDashboard.bookingsTitle")}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-[12px] border border-[#e0e0e8] px-[20px] py-[10px] text-[15px] font-semibold"
              >
                {t("common.back")}
              </button>
            </div>

            <div className="flex flex-col gap-[14px]">
              {business.bookingRequests.length === 0 && (
                <p className="py-[24px] text-center text-[15px] opacity-60">
                  {t("businessDashboard.emptyBookings")}
                </p>
              )}
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
                      {t("businessDashboard.bookingPrice", {
                        price: formatPrice(booking.price, locale),
                      })}
                    </span>
                  </div>

                  {booking.status === "pending" ? (
                    <div className="flex gap-[10px]">
                      <Button
                        text={t("business.acceptBooking")}
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
                        {t("business.cancelBooking")}
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`rounded-[12px] px-[20px] py-[10px] text-[14px] font-semibold ${booking.status === "accepted" || booking.status === "waiting"
                          ? "bg-[#e8f8ee] text-[#1a9b4a]"
                          : "bg-[#fde8e8] text-[#e53935]"
                        }`}
                    >
                      {booking.status === "accepted" || booking.status === "waiting"
                        ? t("business.accepted")
                        : t("business.cancelled")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showAddService && (
        <AddServiceFormModal
          onClose={() => setShowAddService(false)}
          onSave={handleAddService}
        />
      )}

      {showAddProduct && (
        <ProductFormModal
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
    </>
  );
}
