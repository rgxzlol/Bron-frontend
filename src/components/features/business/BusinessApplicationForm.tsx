"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/shared/Button";
import { BUSINESS_CATEGORIES } from "@/store/business.store";
import { useBusinessApplicationStore } from "@/store/businessApplication.store";
import {
  formatBusinessApplicationPhone,
  validateBusinessApplication,
  type BusinessApplicationFieldErrors,
  type BusinessApplicationFormData,
} from "@/lib/business/applicationValidation";
import { useTranslation } from "@/lib/i18n/useTranslation";

type ApplicationFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputMode?: "text" | "tel";
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
          <span className={error ? "text-[#e02424]" : "text-[#0a6af7]"}> *</span>
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
          className="w-full bg-transparent px-4 py-4 text-[16px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-70"
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
        className="w-full max-w-[420px] rounded-[24px] bg-white px-6 py-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#eef4ff] text-[#0a6af7]">
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
          className="text-[22px] font-semibold text-[var(--text-primary)]"
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
  sphere: "",
  location: "",
  phone: "",
};

export default function BusinessApplicationForm() {
  const { t } = useTranslation();
  const submission = useBusinessApplicationStore((state) => state.submission);
  const status = useBusinessApplicationStore((state) => state.status);
  const isSubmitting = useBusinessApplicationStore((state) => state.isSubmitting);
  const submitApplication = useBusinessApplicationStore((state) => state.submitApplication);

  const [form, setForm] = useState<BusinessApplicationFormData>(
    submission ?? EMPTY_FORM,
  );
  const [fieldErrors, setFieldErrors] = useState<BusinessApplicationFieldErrors>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const locked = status === "pending";

  useEffect(() => {
    if (submission) {
      setForm(submission);
    }
  }, [submission]);

  function updateField<K extends keyof BusinessApplicationFormData>(
    key: K,
    value: BusinessApplicationFormData[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (locked || isSubmitting) return;

    const errors = validateBusinessApplication(form, {
      companyNameRequired: t("businessApplication.errors.companyNameRequired"),
      companyNameInvalid: t("businessApplication.errors.companyNameInvalid"),
      sphereRequired: t("businessApplication.errors.sphereRequired"),
      locationRequired: t("businessApplication.errors.locationRequired"),
      locationInvalid: t("businessApplication.errors.locationInvalid"),
      phoneRequired: t("businessApplication.errors.phoneRequired"),
      phoneInvalid: t("businessApplication.errors.phoneInvalid"),
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    void submitApplication({
      companyName: form.companyName.trim(),
      sphere: form.sphere.trim(),
      location: form.location.trim(),
      phone: form.phone.trim(),
    })
      .then(() => {
        setShowReviewModal(true);
      })
      .catch(() => undefined);
  }

  return (
    <>
      <section className="mx-auto w-full max-w-[720px] rounded-[24px] bg-white px-6 py-8 md:px-10 md:py-10">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] md:text-[32px]">
            {t("businessApplication.title")}
          </h1>
          <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
            {t("businessApplication.subtitle")}
          </p>
        </div>

        <form
          data-testid="business-application-form"
          className="flex flex-col gap-6"
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

          <div className="flex flex-col gap-2">
            <label
              htmlFor="sphere"
              className={`text-[14px] font-semibold ${
                fieldErrors.sphere ? "text-[#e02424]" : "text-[var(--text-secondary)]"
              }`}
            >
              {t("businessApplication.sphere")}
              <span
                className={fieldErrors.sphere ? "text-[#e02424]" : "text-[#0a6af7]"}
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
                className="w-full appearance-none bg-transparent px-4 py-4 pr-10 text-[16px] font-semibold text-[var(--text-primary)] outline-none disabled:cursor-not-allowed disabled:opacity-70"
                onChange={(event) => updateField("sphere", event.target.value)}
              >
                <option value="">{t("businessApplication.spherePlaceholder")}</option>
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
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

          <ApplicationField
            id="location"
            label={t("businessApplication.location")}
            value={form.location}
            onChange={(value) => updateField("location", value)}
            error={fieldErrors.location}
            required
            disabled={locked}
            placeholder={t("businessApplication.locationPlaceholder")}
          />

          <ApplicationField
            id="phone"
            label={t("businessApplication.phone")}
            value={form.phone}
            onChange={(value) => updateField("phone", formatBusinessApplicationPhone(value))}
            error={fieldErrors.phone}
            required
            disabled={locked}
            placeholder={t("businessApplication.phonePlaceholder")}
            type="tel"
            inputMode="tel"
          />

          <Button
            type="submit"
            text={
              locked
                ? t("businessApplication.submitted")
                : t("businessApplication.submit")
            }
            disabled={locked || isSubmitting}
            data-testid="business-application-submit"
            className="mt-2 w-full max-w-none text-center md:w-fit"
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
