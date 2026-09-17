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
  type?: "text" | "tel";
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
    "w-full min-w-0 bg-transparent px-3 py-3 text-[15px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-4 sm:text-[16px]";

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className={`text-[14px] font-semibold ${
          error ? "text-[#e02424]" : "text-[var(--text-secondary)]"
        }`}
      >
        {label}
        {required ? (
          <span className={error ? "text-[#e02424]" : "text-[var(--accent-fg)]"}> *</span>
        ) : null}
      </label>
      <div
        className={`relative flex items-center rounded-[14px] border bg-[var(--bg-surface-muted)] transition-all focus-within:bg-[var(--bg-surface)] ${
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

  function handleLocationChange({
    address,
    lat,
    lng,
  }: {
    address: string;
    lat: number | null;
    lng: number | null;
  }) {
    setForm((current) => ({
      ...current,
      location: address,
      latitude: lat,
      longitude: lng,
    }));
    setFieldErrors((current) => ({ ...current, location: undefined }));
    setSubmitError(null);
  }

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

    if (Object.keys(errors).length > 0) {
      const { phone: phoneError, ...visibleErrors } = errors;
      setFieldErrors(visibleErrors);
      if (phoneError) {
        setSubmitError(phoneError);
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const latitude = form.latitude;
      const longitude = form.longitude;

      if (latitude == null || longitude == null) {
        setFieldErrors({
          location: t("businessApplication.errors.locationCoordsRequired"),
        });
        return;
      }

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
      <section className="mx-auto w-full min-w-0 max-w-[720px] rounded-[16px] bg-white px-4 py-6 sm:rounded-[20px] sm:px-6 sm:py-8 md:rounded-[24px] md:px-10 md:py-10">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8">
          <h1 className="text-[22px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[26px] md:text-[32px]">
            {t("businessApplication.title")}
          </h1>
          <p className="text-[14px] font-semibold text-[var(--text-secondary)] sm:text-[15px]">
            {t("businessApplication.subtitle")}
          </p>
        </div>

        <form
          data-testid="business-application-form"
          className="flex flex-col gap-5 sm:gap-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <ApplicationField
            id="company-name"
            label={t("businessApplication.companyName")}
            value={form.companyName}
            onChange={(value) => updateField("companyName", value)}
            error={fieldErrors.companyName}
            required
            disabled={locked}
            placeholder={t("businessApplication.companyNamePlaceholder")}
          />

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

          <ApplicationField
            id="website"
            label={t("businessApplication.website")}
            value={form.website}
            onChange={(value) => updateField("website", value)}
            error={fieldErrors.website}
            required
            disabled={locked}
            placeholder={t("businessApplication.websitePlaceholder")}
          />

          <ApplicationField
            id="social-telegram"
            label={t("businessApplication.socialTelegram")}
            value={form.socialTelegram}
            onChange={(value) => updateField("socialTelegram", value)}
            error={fieldErrors.socialTelegram}
            required
            disabled={locked}
            placeholder={t("businessApplication.socialTelegramPlaceholder")}
          />

          <ApplicationField
            id="social-instagram"
            label={t("businessApplication.socialInstagram")}
            value={form.socialInstagram}
            onChange={(value) => updateField("socialInstagram", value)}
            error={fieldErrors.socialInstagram}
            required
            disabled={locked}
            placeholder={t("businessApplication.socialInstagramPlaceholder")}
          />

          <div className="flex flex-col gap-2">
            <label
              htmlFor="description"
              className={`text-[14px] font-semibold ${
                fieldErrors.description ? "text-[#e02424]" : "text-[var(--text-secondary)]"
              }`}
            >
              {t("businessApplication.description")}
              <span
                className={fieldErrors.description ? "text-[#e02424]" : "text-[var(--accent-fg)]"}
              >
                {" "}
                *
              </span>
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

          <div className="flex flex-col gap-2">
            <label
              htmlFor="comments"
              className={`text-[14px] font-semibold ${
                fieldErrors.comments ? "text-[#e02424]" : "text-[var(--text-secondary)]"
              }`}
            >
              {t("businessApplication.comments")}
              <span
                className={fieldErrors.comments ? "text-[#e02424]" : "text-[var(--accent-fg)]"}
              >
                {" "}
                *
              </span>
            </label>
            <div
              className={`relative rounded-[14px] border bg-[var(--bg-surface-muted)] transition-all focus-within:bg-[var(--bg-surface)] ${
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
                placeholder={t("businessApplication.commentsPlaceholder")}
                aria-invalid={fieldErrors.comments ? true : undefined}
                aria-describedby={
                  fieldErrors.comments ? "comments-error" : "comments-counter"
                }
                className="w-full min-w-0 resize-none bg-transparent px-3 py-3 text-[15px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-4 sm:text-[16px]"
                onChange={(event) =>
                  updateField(
                    "comments",
                    clampBusinessApplicationComments(event.target.value),
                  )
                }
              />
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              {fieldErrors.comments ? (
                <p
                  id="comments-error"
                  role="alert"
                  className="text-[13px] font-semibold text-[#e02424]"
                >
                  {fieldErrors.comments}
                </p>
              ) : (
                <span />
              )}
              <p
                id="comments-counter"
                className={`shrink-0 text-[12px] font-semibold ${
                  form.comments.length >= BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH
                    ? "text-[#e02424]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {form.comments.length}/{BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH}
              </p>
            </div>
          </div>

          {submitError ? (
            <p role="alert" className="text-[13px] font-semibold text-[#e02424]">
              {submitError}
            </p>
          ) : null}

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
            className="mt-2 w-full max-w-none !whitespace-normal px-6 text-center sm:w-fit sm:!whitespace-nowrap sm:px-[52px]"
          />
        </form>
      </section>

      <BusinessApplicationReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
      />
    </>
  );
}
