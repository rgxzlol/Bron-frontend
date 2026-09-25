"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/shared/Button";
import { BUSINESS_CATEGORIES } from "@/store/business.store";
import { businessApplicationsApi } from "@/lib/api/businessApplications";
import { BUSINESS_DESCRIPTION_MAX_LENGTH } from "@/lib/business/validation";
import {
  BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH,
  clampBusinessApplicationComments,
  clampBusinessApplicationDescription,
  formatBusinessApplicationPhone,
  formatBusinessApplicationTin,
  getSocialLinkValue,
  normalizeBusinessApplicationWebsite,
  validateBusinessApplication,
  type BusinessApplicationFieldErrors,
  type BusinessApplicationFormData,
} from "@/lib/business/applicationValidation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { translateBusinessCategory } from "@/lib/i18n/labels";
import { useAuthStore } from "@/store/auth.store";
import { useBusinessApplicationApiStore } from "@/store/businessApplicationApi.store";
import { useBusinessStore } from "@/store/business.store";
import { useProfileStore } from "@/store/profile.store";
import AddressAutocomplete from "./AddressAutocomplete";
import { assets } from "@/lib/assets";

type ApplicationFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputMode?: "text" | "tel" | "numeric" | "decimal";
  type?: "text" | "tel" | "email";
};

function ApplicationField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  disabled,
  placeholder,
  inputMode = "text",
  type = "text",
}: ApplicationFieldProps) {
  const inputClassName =
    "w-full min-w-0 bg-transparent px-3 py-3 text-[20px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-semibold placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-6 sm:py-4";

  return (
    <div className="flex flex-col gap-[12px]">
      <label
        htmlFor={id}
        className={`text-[20px] font-semibold ${
          error ? "text-[#e02424]" : "text-[var(--text-secondary)]"
        }`}
      >
        {label}
        {required ? (
          <span className={error ? "text-[#e02424]" : "text-[var(--accent-fg)]"}> *</span>
        ) : null}
      </label>
      <div
        className={`relative flex items-center rounded-[14px] border bg-white transition-all ${
          error
            ? "border-[#e02424] focus-within:border-[#e02424]"
            : "border-transparent focus-within:border-[#0a6af7]"
        }`}
      >
        <input
          id={id}
          name={id}
          type={type}
          inputMode={inputMode}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputClassName}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[13px] font-semibold text-[#e02424]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function BusinessApplicationReviewModal({ isOpen, onClose }: ReviewModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-application-review-title"
        data-testid="business-application-review-modal"
        className="w-full max-w-[420px] rounded-[20px] bg-white px-4 py-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:rounded-[24px] sm:px-6 sm:py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#eef4ff] text-[var(--accent-fg)]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 8v5l3 2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <h2
          id="business-application-review-title"
          className="text-[20px] font-semibold text-[var(--text-primary)] sm:text-[22px]"
        >
          {t("businessApplication.reviewTitle")}
        </h2>
        <p className="mt-3 text-[15px] font-semibold text-[var(--text-secondary)]">
          {t("businessApplication.reviewMessage")}
        </p>
        <Button
          text={t("businessApplication.reviewClose")}
          onClick={onClose}
          className="mx-auto mt-6"
        />
      </div>
    </div>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ADDED: static "contact info" block for the right column of the mockup.
// Purely presentational — edit the phone/email/social values below as needed.
// ─────────────────────────────────────────────────────────────────────────
type ContactRowProps = {
  icon: React.ReactNode;
  label: string;
};

function ContactRow({ icon, label }: ContactRowProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {/* icon "button" background — forced white per the mockup */}
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white text-[var(--text-primary)]">
        {icon}
      </div>
      <span className="text-[20px] font-semibold text-[var(--text-primary)]">{label}</span>
    </div>
  );
}

// ADDED: the "Bron" wordmark, assembled from the saved SVG pieces —
// Btop + Bbottom stacked tightly form the stylized "B", then the
// r / o / n letter SVGs sit next to it. If there's a visible seam or gap
// between Btop and Bbottom, tweak the `-mt-[2px]` below (depends on each
// SVG's internal viewBox/padding).
// ADDED: static SVG/image imports (e.g. via Next.js) come through as an
// object like { src, width, height }, not a plain URL string — passing that
// object straight into a plain <img src={...}> both fails to render and
// trips a TS type warning (img's src wants a string). This normalizes
// either shape into a usable string.
function iconSrc(icon: unknown): string {
  if (typeof icon === "string") return icon;
  if (icon && typeof icon === "object" && "src" in icon) {
    return (icon as { src: string }).src;
  }
  return "";
}

function BronLogo() {
  return (
    <div className="flex items-end gap-1" role="img" aria-label="Bron">
      <div className="flex w-full flex-col">
        <img src={iconSrc(assets.bussines.btop)} alt="" className="w-[87px]" />
        <img src={iconSrc(assets.bussines.bbottom)} alt="" className="-mt-[26px] w-[95px]" />
      </div>
      <img src={iconSrc(assets.bussines.r)} alt="" className="h-[82px] w-auto" />
      <img src={iconSrc(assets.bussines.o)} alt="" className="h-[82px] w-auto" />
      <img src={iconSrc(assets.bussines.n)} alt="" className="h-[82px] w-auto" />
    </div>
  );
}

function BusinessApplicationContactInfo() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 pt-[100px] pb-[50px] sm:px-10">
      <div className="flex h-[64px] items-center justify-center">
        <BronLogo />
      </div>

      <h2 className="text-center text-[22px] mt-[80px] font-semibold text-[var(--text-primary)] sm:text-[32px]">
        {t("businessApplication.contactInfoTitle")}
      </h2>

      <div className="grid w-full grid-cols-2 gap-x-6 gap-y-8">
        <ContactRow
          label="+998 99 999 99 99"
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.7c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.2 1.1L6.6 10.8Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <ContactRow
          label="support@bron.uz"
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <ContactRow
          label="@Bron_Support"
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="17" cy="7" r="1" fill="currentColor" />
            </svg>
          }
        />
        <ContactRow
          label="@Bron_Support"
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="m3 11 18-8-6 18-4.5-7L3 11Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>

      <div className="flex w-full mt-auto items-center gap-3 rounded-[16px] border border-[#0A6AF7] bg-[var(--bg-surface)] px-4 py-3">
        <svg
          width="24"
          height="28"
          viewBox="0 0 24 28"
          fill="none"
          aria-hidden
          className="shrink-0 text-[var(--accent-fg)] ml-[8px] mr-[16px] "
        >
          <path
            d="M12 2 21 6v7c0 6-4 10.4-9 13-5-2.6-9-7-9-13V6l9-4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 14.2 11 16.7l4.5-5.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-left">
          <p className="text-[19px] font-semibold text-[var(--accent-fg)]">
            {t("businessApplication.dataProtectedTitle")}
          </p>
          <p className=" text-[15px] font-medium text-[var(--text-secondary)]">
            {t("businessApplication.dataProtectedDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}
// ───────────────────────────── END ADDED BLOCK ─────────────────────────────

const EMPTY_FORM: BusinessApplicationFormData = {
  companyName: "",
  tin: "",
  sphere: "",
  location: "",
  phone: "",
  description: "",
  latitude: null,
  longitude: null,
  website: "",
  socialTelegram: "",
  socialInstagram: "",
  comments: "",
};

export default function BusinessApplicationForm() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const profilePhone = useProfileStore((state) => state.phone);
  const application = useBusinessApplicationApiStore((state) => state.application);
  const status = useBusinessApplicationApiStore((state) => state.status);
  const fetchApplication = useBusinessApplicationApiStore(
    (state) => state.fetchApplication,
  );
  const fetchBusinessesFromApi = useBusinessStore((state) => state.fetchBusinessesFromApi);

  const [form, setForm] = useState<BusinessApplicationFormData>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<BusinessApplicationFieldErrors>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const locked = status === "pending";

  // ADDED: "Email" is on the mockup but doesn't exist in BusinessApplicationFormData /
  // the backend payload yet, so it's tracked as its own local field for now.
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!application) return;

    setForm({
      companyName: application.company_name,
      tin: application.tin?.trim() ?? "",
      sphere: application.sphere,
      location: application.location,
      phone: application.phone || formatBusinessApplicationPhone(profilePhone ?? ""),
      description: application.description?.trim() ?? "",
      latitude:
        application.latitude != null && Number.isFinite(application.latitude)
          ? application.latitude
          : null,
      longitude:
        application.longitude != null && Number.isFinite(application.longitude)
          ? application.longitude
          : null,
      website: application.website?.trim() ?? "",
      socialTelegram: getSocialLinkValue(application.social_links, "telegram"),
      socialInstagram: getSocialLinkValue(application.social_links, "instagram"),
      comments: application.comments?.trim() ?? "",
    });
  }, [application, profilePhone]);

  useEffect(() => {
    if (application) return;
    const phone = formatBusinessApplicationPhone(profilePhone ?? "");
    if (!phone) return;
    setForm((current) =>
      current.phone ? current : { ...current, phone },
    );
  }, [application, profilePhone]);

  function updateField<K extends keyof BusinessApplicationFormData>(
    key: K,
    value: BusinessApplicationFormData[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(null);
  }

  // COMMENTED OUT: only used by the AddressAutocomplete field below, which is
  // hidden to match the mockup. Kept so it's a one-line change to bring back.
  // function handleLocationChange({
  //   address,
  //   lat,
  //   lng,
  // }: {
  //   address: string;
  //   lat: number | null;
  //   lng: number | null;
  // }) {
  //   setForm((current) => ({
  //     ...current,
  //     location: address,
  //     latitude: lat,
  //     longitude: lng,
  //   }));
  //   setFieldErrors((current) => ({ ...current, location: undefined }));
  //   setSubmitError(null);
  // }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (locked || isSubmitting) return;

    const accountPhone = formatBusinessApplicationPhone(
      form.phone || profilePhone || "",
    );
    const formWithPhone = { ...form, phone: accountPhone };

    const errors = validateBusinessApplication(formWithPhone, {
      companyNameRequired: t("businessApplication.errors.companyNameRequired"),
      companyNameInvalid: t("businessApplication.errors.companyNameInvalid"),
      tinRequired: t("businessApplication.errors.tinRequired"),
      tinInvalid: t("businessApplication.errors.tinInvalid"),
      sphereRequired: t("businessApplication.errors.sphereRequired"),
      locationRequired: t("businessApplication.errors.locationRequired"),
      locationInvalid: t("businessApplication.errors.locationInvalid"),
      phoneRequired: t("businessApplication.errors.phoneRequired"),
      phoneInvalid: t("businessApplication.errors.phoneInvalid"),
      descriptionRequired: t("businessApplication.errors.descriptionRequired"),
      descriptionLimitReached: t("businessApplication.errors.descriptionLimitReached", {
        max: BUSINESS_DESCRIPTION_MAX_LENGTH,
      }),
      locationCoordsRequired: t("businessApplication.errors.locationCoordsRequired"),
      websiteRequired: t("businessApplication.errors.websiteRequired"),
      websiteInvalid: t("businessApplication.errors.websiteInvalid"),
      socialTelegramRequired: t("businessApplication.errors.socialTelegramRequired"),
      socialInstagramRequired: t("businessApplication.errors.socialInstagramRequired"),
      commentsRequired: t("businessApplication.errors.commentsRequired"),
      commentsLimitReached: t("businessApplication.errors.commentsLimitReached", {
        max: BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH,
      }),
    });

    // ADDED: fields hidden per the mockup (tin, sphere, location, website,
    // description, socialInstagram) shouldn't silently block submission with
    // no visible error message, so their errors are dropped here. Remove this
    // filter once those fields come back into the visible form, or once the
    // backend/API contract is updated to match the simplified mockup fields.
    const HIDDEN_FIELD_KEYS: (keyof BusinessApplicationFieldErrors)[] = [
      "tin",
      "sphere",
      "location",
      "website",
      "description",
      "socialInstagram",
    ];
    const visibleErrors = { ...errors };
    HIDDEN_FIELD_KEYS.forEach((key) => {
      delete visibleErrors[key];
    });

    // ADDED: simple local required-check for the new Email field.
    const nextEmailError = email.trim() ? undefined : t("businessApplication.errors.emailRequired");
    setEmailError(nextEmailError);

    if (Object.keys(visibleErrors).length > 0 || nextEmailError) {
      const { phone: phoneError, ...displayableErrors } = visibleErrors;
      setFieldErrors(displayableErrors);
      if (phoneError) {
        setSubmitError(phoneError);
      }
      return;
    }

    const latitude = form.latitude;
    const longitude = form.longitude;
    if (latitude == null || longitude == null) {
      setSubmitError(t("businessApplication.errors.locationCoordsRequired"));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await businessApplicationsApi.create(
        {
          company_name: form.companyName.trim(),
          tin: form.tin.trim(),
          sphere: form.sphere.trim(),
          location: form.location.trim(),
          phone: formWithPhone.phone.trim(),
          description: form.description.trim(),
          latitude,
          longitude,
          website: normalizeBusinessApplicationWebsite(form.website),
          social_links: {
            telegram: form.socialTelegram.trim(),
            instagram: form.socialInstagram.trim(),
          },
          comments: form.comments.trim(),
        },
        token ?? undefined,
      );

      if (!result) {
        setSubmitError(t("businessApplication.submitError"));
        return;
      }

      await Promise.all([fetchApplication(), fetchBusinessesFromApi()]);
      setShowReviewModal(true);
    } catch {
      setSubmitError(t("businessApplication.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* ============================================================
          ADDED: two-column card layout to match the mockup — left is
          the (trimmed) form, right is the new BusinessApplicationContactInfo
          block. Everything from here to the matching END ADDED marker
          below replaces the old single-column <section>.
          ============================================================ */}
      {/* Card background is #F9F9FD (matches the mockup); every input,
          textarea and the round contact icons above are forced to white
          so they stand out against it. */}
      <div className="mx-auto grid w-full min-w-0 grid-cols-1 overflow-hidden rounded-[20px] border border-[#0a6af7]/25 bg-[#F9F9FD] shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[24px] md:grid-cols-[1.1fr_16px_1fr]">
        <section className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
          <div className="mb-6 flex flex-col gap-2 text-center sm:mb-8">
            <h1 className="text-[32px] font-semibold leading-tight text-[var(--text-primary)]">
              {t("businessApplication.title")}
            </h1>
          </div>

          <form
            data-testid="business-application-form"
            className="flex flex-col gap-5 sm:gap-6"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* KEPT (relabeled per mockup: "Полное имя") */}
            <ApplicationField
              id="company-name"
              label={t("businessApplication.fullName")}
              value={form.companyName}
              onChange={(value) => updateField("companyName", value)}
              error={fieldErrors.companyName}
              required
              disabled={locked}
              placeholder={t("businessApplication.fullNamePlaceholder")}
            />

            {/* COMMENTED OUT: TIN field — not in the mockup */}
            {/*
            <ApplicationField
              id="tin"
              label={t("businessApplication.tin")}
              value={form.tin}
              onChange={(value) => updateField("tin", formatBusinessApplicationTin(value))}
              error={fieldErrors.tin}
              required
              disabled={locked}
              placeholder={t("businessApplication.tinPlaceholder")}
              inputMode="numeric"
            />
            */}

            {/* KEPT */}
            <ApplicationField
              id="phone"
              label={t("businessApplication.phone")}
              value={form.phone}
              onChange={(value) => updateField("phone", value)}
              error={fieldErrors.phone}
              required
              disabled={locked}
              placeholder="+998 99 999 99 99"
              inputMode="tel"
              type="tel"
            />

            {/* ADDED: Email field — not part of BusinessApplicationFormData yet,
                tracked locally (see the `email`/`setEmail` state above). */}
            <ApplicationField
              id="email"
              label={t("businessApplication.email")}
              value={email}
              onChange={(value) => {
                setEmail(value);
                setEmailError(undefined);
                setSubmitError(null);
              }}
              error={emailError}
              disabled={locked}
              placeholder="@Bron_Suport"
              type="email"
            />

            {/* COMMENTED OUT: sphere/category select — not in the mockup */}
            {/*
            <div className="flex flex-col gap-2">
              <label
                htmlFor="sphere"
                className={`text-[14px] font-semibold ${
                  fieldErrors.sphere ? "text-[#e02424]" : "text-[var(--text-secondary)]"
                }`}
              >
                {t("businessApplication.sphere")}
                <span
                  className={fieldErrors.sphere ? "text-[#e02424]" : "text-[var(--accent-fg)]"}
                >
                  {" "}
                  *
                </span>
              </label>
              <div
                className={`relative flex items-center rounded-[14px] border bg-[var(--bg-surface-muted)] transition-all focus-within:bg-[var(--bg-surface)] ${
                  fieldErrors.sphere
                    ? "border-[#e02424] focus-within:border-[#e02424]"
                    : "border-transparent focus-within:border-[#0a6af7]"
                }`}
              >
                <select
                  id="sphere"
                  name="sphere"
                  value={form.sphere}
                  disabled={locked}
                  aria-invalid={fieldErrors.sphere ? true : undefined}
                  aria-describedby={fieldErrors.sphere ? "sphere-error" : undefined}
                  className="w-full min-w-0 appearance-none bg-transparent px-3 py-3 pr-10 text-[15px] font-semibold text-[var(--text-primary)] outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-4 sm:text-[16px]"
                  onChange={(event) => updateField("sphere", event.target.value)}
                >
                  <option value="">{t("businessApplication.spherePlaceholder")}</option>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {translateBusinessCategory(t, category)}
                    </option>
                  ))}
                </select>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  className="pointer-events-none absolute right-4 text-[var(--text-secondary)]"
                  aria-hidden
                >
                  <path
                    d="M1 1l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {fieldErrors.sphere ? (
                <p
                  id="sphere-error"
                  role="alert"
                  className="text-[13px] font-semibold text-[#e02424]"
                >
                  {fieldErrors.sphere}
                </p>
              ) : null}
            </div>
            */}

            {/* COMMENTED OUT: address / AddressAutocomplete field — not in the mockup */}
            {/*
            <div className="flex flex-col gap-2">
              <label
                htmlFor="location"
                className={`text-[14px] font-semibold ${
                  fieldErrors.location ? "text-[#e02424]" : "text-[var(--text-secondary)]"
                }`}
              >
                {t("businessApplication.location")}
                <span
                  className={fieldErrors.location ? "text-[#e02424]" : "text-[var(--accent-fg)]"}
                >
                  {" "}
                  *
                </span>
              </label>
              <div
                className={`min-w-0 rounded-[14px] border bg-[var(--bg-surface-muted)] transition-all focus-within:bg-[var(--bg-surface)] ${
                  fieldErrors.location
                    ? "border-[#e02424] focus-within:border-[#e02424]"
                    : "border-transparent focus-within:border-[#0a6af7]"
                }`}
              >
                <AddressAutocomplete
                  value={form.location}
                  coordsSelected={form.latitude != null && form.longitude != null}
                  hasError={!!fieldErrors.location}
                  errorMessage={fieldErrors.location}
                  inputTestId="business-application-location-input"
                  disabled={locked}
                  placeholder={t("businessApplication.locationPlaceholder")}
                  inputClassName="w-full min-w-0 rounded-[14px] bg-transparent px-3 py-3 text-[15px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-4 sm:text-[16px]"
                  onChange={handleLocationChange}
                />
              </div>
            </div>
            */}

            {/* COMMENTED OUT: website field — not in the mockup */}
            {/*
            <ApplicationField
              id="website"
              label={t("businessApplication.website")}
              value={form.website}
              onChange={(value) => updateField("website", value)}
              error={fieldErrors.website}
              disabled={locked}
              placeholder={t("businessApplication.websitePlaceholder")}
            />
            */}

            {/* KEPT, but merged: mockup has a single "Instagram / Telegram"
                field, so it's mapped onto the existing `socialTelegram`
                state. `socialInstagram` is commented out below. */}
            <ApplicationField
              id="social-telegram"
              label={t("businessApplication.socialCombined")}
              value={form.socialTelegram}
              onChange={(value) => updateField("socialTelegram", value)}
              error={fieldErrors.socialTelegram}
              disabled={locked}
              placeholder="@Bron_Suport"
            />

            {/* COMMENTED OUT: separate Instagram field — merged into the
                single "Instagram / Telegram" field above per the mockup */}
            {/*
            <ApplicationField
              id="social-instagram"
              label={t("businessApplication.socialInstagram")}
              value={form.socialInstagram}
              onChange={(value) => updateField("socialInstagram", value)}
              error={fieldErrors.socialInstagram}
              disabled={locked}
              placeholder={t("businessApplication.socialInstagramPlaceholder")}
            />
            */}

            {/* COMMENTED OUT: description field — not in the mockup */}
            {/*
            <div className="flex flex-col gap-2">
              <label
                htmlFor="description"
                className={`text-[14px] font-semibold ${
                  fieldErrors.description ? "text-[#e02424]" : "text-[var(--text-secondary)]"
                }`}
              >
                {t("businessApplication.description")}
              </label>
              <div
                className={`relative rounded-[14px] border bg-[var(--bg-surface-muted)] transition-all focus-within:bg-[var(--bg-surface)] ${
                  fieldErrors.description
                    ? "border-[#e02424] focus-within:border-[#e02424]"
                    : "border-transparent focus-within:border-[#0a6af7]"
                }`}
              >
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  disabled={locked}
                  rows={4}
                  maxLength={BUSINESS_DESCRIPTION_MAX_LENGTH}
                  placeholder={t("businessApplication.descriptionPlaceholder")}
                  aria-invalid={fieldErrors.description ? true : undefined}
                  aria-describedby={
                    fieldErrors.description ? "description-error" : "description-counter"
                  }
                  className="w-full min-w-0 resize-none bg-transparent px-3 py-3 text-[15px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-4 sm:text-[16px]"
                  onChange={(event) =>
                    updateField(
                      "description",
                      clampBusinessApplicationDescription(event.target.value),
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                {fieldErrors.description ? (
                  <p
                    id="description-error"
                    role="alert"
                    className="text-[13px] font-semibold text-[#e02424]"
                  >
                    {fieldErrors.description}
                  </p>
                ) : (
                  <span />
                )}
                <p
                  id="description-counter"
                  className={`shrink-0 text-[12px] font-semibold ${
                    form.description.length >= BUSINESS_DESCRIPTION_MAX_LENGTH
                      ? "text-[#e02424]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {form.description.length}/{BUSINESS_DESCRIPTION_MAX_LENGTH}
                </p>
              </div>
            </div>
            */}

            {/* KEPT (relabeled per mockup: "Оставить комментарий") */}
            <div className="flex flex-col gap-[12px]">
              <label
                htmlFor="comments"
                className={`text-[20px] font-semibold ${
                  fieldErrors.comments ? "text-[#e02424]" : "text-[var(--text-secondary)]"
                }`}
              >
                {t("businessApplication.leaveComment")}
              </label>
              <div
                className={`relative rounded-[14px] border bg-white transition-all ${
                  fieldErrors.comments
                    ? "border-[#e02424] focus-within:border-[#e02424]"
                    : "border-transparent focus-within:border-[#0a6af7]"
                }`}
              >
                <textarea
                  id="comments"
                  name="comments"
                  value={form.comments}
                  disabled={locked}
                  rows={3}
                  maxLength={BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH}
                  placeholder="@Bron_Suport"
                  aria-invalid={fieldErrors.comments ? true : undefined}
                  aria-describedby={
                    fieldErrors.comments ? "comments-error" : "comments-counter"
                  }
                  className="w-full min-w-0 resize-none bg-transparent px-3 py-3 pb-8 text-[20px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-semibold placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-4 sm:pb-8"
                  onChange={(event) =>
                    updateField(
                      "comments",
                      clampBusinessApplicationComments(event.target.value),
                    )
                  }
                />
                {/* MOVED: counter now sits inside the box, bottom-right, per mockup
                    (was previously below the box in its own row) */}
                <p
                  id="comments-counter"
                  className={`pointer-events-none absolute bottom-[6px] right-[10px] shrink-0 text-[18px] font-semibold ${
                    form.comments.length >= BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH
                      ? "text-[#e02424]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {form.comments.length}/{BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH}
                </p>
              </div>
              {fieldErrors.comments ? (
                <p
                  id="comments-error"
                  role="alert"
                  className="text-[13px] font-semibold text-[#e02424]"
                >
                  {fieldErrors.comments}
                </p>
              ) : null}
            </div>

            {submitError ? (
              <p role="alert" className="text-[20px] font-semibold text-[#e02424]">
                {submitError}
              </p>
            ) : null}

            {/* KEPT, restyled to the full-width rounded blue button from the mockup */}
            <Button
              type="submit"
              text={
                locked
                  ? t("businessApplication.submitted")
                  : isSubmitting
                    ? t("businessApplication.submitting")
                    : t("businessApplication.submit")
              }
              disabled={locked || isSubmitting}
              data-testid="business-application-submit"
              className="mt-2 w-full !whitespace-normal rounded-[19px] !bg-[#0a6af7] text-center text-[20px] font-semibold text-white sm:text-[20px]"
            />
          </form>
        </section>

        {/* ADDED: 16px white divider bar between the two columns, per spec.
            Hidden on mobile where the columns stack vertically instead — a
            thin top border stands in for the separator there. */}
        <div className="my-[50px] hidden bg-white md:block" aria-hidden />

        {/* ADDED: right column, replaces nothing — brand-new in this layout */}
        <aside className="border-t border-[#eef1f7] md:border-t-0">
          <BusinessApplicationContactInfo />
        </aside>
      </div>
      {/* ───────────────────────────── END ADDED BLOCK ───────────────────────────── */}

      <BusinessApplicationReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
      />
    </>
  );
}