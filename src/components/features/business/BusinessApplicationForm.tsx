"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/shared/Button";
import { ApiError, getApiFieldErrors } from "@/lib/api/client";
import { businessApplicationsApi } from "@/lib/api/businessApplications";
import {
  BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH,
  clampBusinessApplicationComments,
  formatBusinessApplicationPhone,
} from "@/lib/business/applicationValidation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";
import { useProfileStore } from "@/store/profile.store";
import { assets } from "@/lib/assets";
import { supportContacts } from "@/data/support";

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
  maxLength?: number;
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
  maxLength,
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
        className={`relative flex items-center rounded-[14px] border bg-[var(--bg-form-input)] transition-all ${
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
          maxLength={maxLength}
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
  if (!isOpen || typeof document === "undefined") return null;

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
        className="w-full max-w-[420px] rounded-[20px] bg-[var(--bg-surface)] px-4 py-6 text-center shadow-[var(--shadow-modal)] sm:rounded-[24px] sm:px-6 sm:py-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[var(--bg-active-soft)] text-[var(--accent-fg)]">
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
  href: string;
  external?: boolean;
};

function ContactRow({ icon, label, href, external = false }: ContactRowProps) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-3 text-center transition-opacity hover:opacity-75"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {/* icon "button" background — forced white per the mockup */}
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)]">
        {icon}
      </div>
      <span className="text-[20px] font-semibold text-[var(--text-primary)]">{label}</span>
    </a>
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
  const theme = useProfileStore((state) => state.theme);

  return (
    <div
      className="flex items-end gap-1"
      role="img"
      aria-label="Bron"
      style={{ filter: theme === "dark" ? "brightness(0) invert(1)" : undefined }}
    >
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
          label={supportContacts.phone}
          href={supportContacts.phoneHref}
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
          label={supportContacts.email}
          href={`mailto:${supportContacts.email}`}
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <ContactRow
          label={`@${supportContacts.instagram}`}
          href={supportContacts.instagramHref}
          external
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="17" cy="7" r="1" fill="currentColor" />
            </svg>
          }
        />
        <ContactRow
          label={`@${supportContacts.telegram}`}
          href={supportContacts.telegramHref}
          external
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

type ContactRequestForm = {
  phone: string;
  social: string;
  comment: string;
};

const EMPTY_FORM: ContactRequestForm = {
  phone: "",
  social: "",
  comment: "",
};

export default function BusinessApplicationForm() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);
  const profilePhone = useProfileStore((state) => state.phone);
  const profileFullName = useProfileStore((state) => state.fullName);
  const profileEmail = useProfileStore((state) => state.email);

  const [form, setForm] = useState<ContactRequestForm>(EMPTY_FORM);
  const [ownerName, setOwnerName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    phone?: string;
    social?: string;
    comment?: string;
  }>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [ownerNameError, setOwnerNameError] = useState<string | undefined>(undefined);
  const [previousProfile, setPreviousProfile] = useState<{
    phone: typeof profilePhone;
    fullName: typeof profileFullName;
    email: typeof profileEmail;
  } | null>(null);

  if (
    previousProfile === null ||
    previousProfile.phone !== profilePhone ||
    previousProfile.fullName !== profileFullName ||
    previousProfile.email !== profileEmail
  ) {
    setPreviousProfile({
      phone: profilePhone,
      fullName: profileFullName,
      email: profileEmail,
    });
    if (!ownerName && profileFullName) setOwnerName(profileFullName);
    if (!email && profileEmail) setEmail(profileEmail);
    const phone = formatBusinessApplicationPhone(profilePhone ?? "");
    if (phone && !form.phone) {
      setForm((current) =>
        current.phone ? current : { ...current, phone },
      );
    }
  }

  function updateField<K extends keyof ContactRequestForm>(
    key: K,
    value: ContactRequestForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || hasSubmitted) return;

    const fullName = ownerName.trim();
    const phone = form.phone.trim();
    const phoneDigits = phone.replace(/\D/g, "");
    const isPhoneValid =
      /^\+?[\d\s().-]+$/.test(phone) &&
      phoneDigits.length >= 7 &&
      phoneDigits.length <= 15;
    const nextOwnerNameError = !fullName
      ? t("businessApplication.errors.ownerNameRequired")
      : fullName.length > 150
        ? t("businessApplication.errors.fullNameLimitReached")
        : undefined;
    const nextPhoneError = !phone
      ? t("businessApplication.errors.phoneRequired")
      : isPhoneValid
        ? undefined
        : t("businessApplication.errors.phoneInvalid");
    const nextEmailError = email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? t("businessApplication.errors.emailInvalid")
      : undefined;

    setEmailError(nextEmailError);
    setOwnerNameError(nextOwnerNameError);
    setFieldErrors((current) => ({ ...current, phone: nextPhoneError }));

    if (nextOwnerNameError || nextPhoneError || nextEmailError) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await businessApplicationsApi.createContactRequest(
        {
          full_name: fullName,
          phone,
          ...(email.trim() ? { email: email.trim() } : {}),
          ...(form.social.trim() ? { social: form.social.trim() } : {}),
          ...(form.comment.trim() ? { comment: form.comment.trim() } : {}),
        },
        token,
      );
      setHasSubmitted(true);
      setShowReviewModal(true);
    } catch (error) {
      const apiFieldErrors = getApiFieldErrors(error);
      const mappedErrors = {
        phone: apiFieldErrors.phone,
        social: apiFieldErrors.social,
        comment: apiFieldErrors.comment,
      };
      setFieldErrors(mappedErrors);
      setEmailError(apiFieldErrors.email);
      setOwnerNameError(apiFieldErrors.full_name);
      const hasFieldError =
        Object.values(mappedErrors).some(Boolean) ||
        Boolean(apiFieldErrors.email) ||
        Boolean(apiFieldErrors.full_name);
      setSubmitError(
        error instanceof ApiError && error.status === 429
          ? t("businessApplication.errors.rateLimit")
          : hasFieldError
            ? null
            : error instanceof Error
              ? error.message
              : t("businessApplication.submitError"),
      );
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
      <div className="mx-auto grid w-full min-w-0 grid-cols-1 overflow-hidden rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-block)] shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[24px] md:grid-cols-[1.1fr_16px_1fr]">
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
            <ApplicationField
              id="owner-name"
              label={t("businessApplication.fullName")}
              value={ownerName}
              onChange={(value) => {
                setOwnerName(value);
                setOwnerNameError(undefined);
                setSubmitError(null);
              }}
              error={ownerNameError}
              required
              disabled={isSubmitting || hasSubmitted}
              maxLength={150}
              placeholder={t("businessApplication.fullNamePlaceholder")}
            />

            {/* KEPT */}
            <ApplicationField
              id="phone"
              label={t("businessApplication.phone")}
              value={form.phone}
              onChange={(value) => updateField("phone", value)}
              error={fieldErrors.phone}
              required
              disabled={isSubmitting || hasSubmitted}
              placeholder="+998 99 999 99 99"
              inputMode="tel"
              type="tel"
            />

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
              disabled={isSubmitting || hasSubmitted}
              maxLength={254}
              placeholder="name@example.com"
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

            <ApplicationField
              id="social-combined"
              label={t("businessApplication.socialCombined")}
              value={form.social}
              onChange={(value) => updateField("social", value)}
              error={fieldErrors.social}
              disabled={isSubmitting || hasSubmitted}
              placeholder={t("businessApplication.socialTelegramPlaceholder")}
            />

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
                  fieldErrors.comment ? "text-[#e02424]" : "text-[var(--text-secondary)]"
                }`}
              >
                {t("businessApplication.leaveComment")}
              </label>
              <div
                className={`relative rounded-[14px] border bg-[var(--bg-form-input)] transition-all ${
                  fieldErrors.comment
                    ? "border-[#e02424] focus-within:border-[#e02424]"
                    : "border-transparent focus-within:border-[#0a6af7]"
                }`}
              >
                <textarea
                  id="comments"
                  name="comments"
                  value={form.comment}
                  disabled={isSubmitting || hasSubmitted}
                  rows={3}
                  maxLength={BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH}
                  placeholder="@Bron_Suport"
                  aria-invalid={fieldErrors.comment ? true : undefined}
                  aria-describedby={
                    fieldErrors.comment ? "comments-error" : "comments-counter"
                  }
                  className="w-full min-w-0 resize-none bg-transparent px-3 py-3 pb-8 text-[20px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-semibold placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-4 sm:pb-8"
                  onChange={(event) =>
                    updateField(
                      "comment",
                      clampBusinessApplicationComments(event.target.value),
                    )
                  }
                />
                {/* MOVED: counter now sits inside the box, bottom-right, per mockup
                    (was previously below the box in its own row) */}
                <p
                  id="comments-counter"
                  className={`pointer-events-none absolute bottom-[6px] right-[10px] shrink-0 text-[18px] font-semibold ${
                    form.comment.length >= BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH
                      ? "text-[#e02424]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {form.comment.length}/{BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH}
                </p>
              </div>
              {fieldErrors.comment ? (
                <p
                  id="comments-error"
                  role="alert"
                  className="text-[13px] font-semibold text-[#e02424]"
                >
                  {fieldErrors.comment}
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
                hasSubmitted
                  ? t("businessApplication.submitted")
                  : isSubmitting
                    ? t("businessApplication.submitting")
                    : t("businessApplication.submit")
              }
              disabled={hasSubmitted || isSubmitting}
              data-testid="business-application-submit"
              className="mt-2 w-full !whitespace-normal rounded-[19px] !bg-[#0a6af7] text-center text-[20px] font-semibold text-white sm:text-[20px]"
            />
          </form>
        </section>

        {/* ADDED: 16px white divider bar between the two columns, per spec.
            Hidden on mobile where the columns stack vertically instead — a
            thin top border stands in for the separator there. */}
        <div className="my-[50px] hidden bg-[var(--bg-surface-muted)] md:block" aria-hidden />

        {/* ADDED: right column, replaces nothing — brand-new in this layout */}
        <aside className="border-t border-[var(--border-default)] md:border-t-0">
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