import {
  REGISTER_PHONE_PATTERN,
  formatUzbekPhoneInput,
} from "@/lib/auth/validation";
import {
  BUSINESS_DESCRIPTION_MAX_LENGTH,
  clampBusinessDescription,
} from "@/lib/business/validation";

export const BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH = 500;

export type BusinessApplicationFieldErrors = {
  companyName?: string;
  tin?: string;
  sphere?: string;
  location?: string;
  phone?: string;
  description?: string;
  website?: string;
  socialTelegram?: string;
  socialInstagram?: string;
  comments?: string;
};

export type BusinessApplicationFormData = {
  companyName: string;
  tin: string;
  sphere: string;
  location: string;
  phone: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  website: string;
  socialTelegram: string;
  socialInstagram: string;
  comments: string;
};

const COMPANY_NAME_PATTERN = /^[\p{L}\p{N}\s'-]+$/u;
const INVALID_SYMBOLS_PATTERN = /[<>{}[\]\\|`~!@#$%^&*()+=;:"?/]/;
const TIN_PATTERN = /^\d{9}$/;
const WEBSITE_PATTERN =
  /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i;
export type BusinessApplicationValidationMessages = {
  companyNameRequired: string;
  companyNameInvalid: string;
  tinRequired: string;
  tinInvalid: string;
  sphereRequired: string;
  locationRequired: string;
  locationInvalid: string;
  phoneRequired: string;
  phoneInvalid: string;
  descriptionRequired: string;
  descriptionLimitReached: string;
  locationCoordsRequired: string;
  websiteRequired: string;
  websiteInvalid: string;
  socialTelegramRequired: string;
  socialInstagramRequired: string;
  commentsRequired: string;
  commentsLimitReached: string;
};

export function validateBusinessApplication(
  data: BusinessApplicationFormData,
  messages: BusinessApplicationValidationMessages,
): BusinessApplicationFieldErrors {
  const errors: BusinessApplicationFieldErrors = {};

  const companyName = data.companyName.trim();
  if (!companyName) {
    errors.companyName = messages.companyNameRequired;
  } else if (!COMPANY_NAME_PATTERN.test(companyName)) {
    errors.companyName = messages.companyNameInvalid;
  }

  const tin = data.tin.trim();
  if (!tin) {
    errors.tin = messages.tinRequired;
  } else if (!TIN_PATTERN.test(tin)) {
    errors.tin = messages.tinInvalid;
  }

  const sphere = data.sphere.trim();
  if (!sphere) {
    errors.sphere = messages.sphereRequired;
  }

  const location = data.location.trim();
  if (!location) {
    errors.location = messages.locationRequired;
  } else if (INVALID_SYMBOLS_PATTERN.test(location)) {
    errors.location = messages.locationInvalid;
  } else if (data.latitude == null || data.longitude == null) {
    errors.location = messages.locationCoordsRequired;
  }

  const phone = data.phone.trim();
  if (!phone) {
    errors.phone = messages.phoneRequired;
  } else if (!REGISTER_PHONE_PATTERN.test(phone)) {
    errors.phone = messages.phoneInvalid;
  }

  const description = data.description.trim();
  if (!description) {
    errors.description = messages.descriptionRequired;
  } else if (description.length > BUSINESS_DESCRIPTION_MAX_LENGTH) {
    errors.description = messages.descriptionLimitReached;
  }

  const website = data.website.trim();
  if (!website) {
    errors.website = messages.websiteRequired;
  } else if (!WEBSITE_PATTERN.test(website)) {
    errors.website = messages.websiteInvalid;
  }

  if (!data.socialTelegram.trim()) {
    errors.socialTelegram = messages.socialTelegramRequired;
  }

  if (!data.socialInstagram.trim()) {
    errors.socialInstagram = messages.socialInstagramRequired;
  }

  const comments = data.comments.trim();
  if (!comments) {
    errors.comments = messages.commentsRequired;
  } else if (comments.length > BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH) {
    errors.comments = messages.commentsLimitReached;
  }

  return errors;
}

export function clampBusinessApplicationDescription(value: string) {
  return clampBusinessDescription(value);
}

export function clampBusinessApplicationComments(value: string) {
  return value.slice(0, BUSINESS_APPLICATION_COMMENTS_MAX_LENGTH);
}

export function formatBusinessApplicationPhone(value: string) {
  return formatUzbekPhoneInput(value);
}

export function formatBusinessApplicationTin(value: string) {
  return value.replace(/\D/g, "").slice(0, 9);
}

export function normalizeBusinessApplicationWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function getSocialLinkValue(
  links: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = links?.[key];
  return typeof value === "string" ? value : "";
}
