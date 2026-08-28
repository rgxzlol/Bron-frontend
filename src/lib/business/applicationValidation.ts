import {
  REGISTER_PHONE_PATTERN,
  formatUzbekPhoneInput,
} from "@/lib/auth/validation";

export type BusinessApplicationFieldErrors = {
  companyName?: string;
  sphere?: string;
  location?: string;
  phone?: string;
};

export type BusinessApplicationFormData = {
  companyName: string;
  sphere: string;
  location: string;
  phone: string;
};

const COMPANY_NAME_PATTERN = /^[\p{L}\p{N}\s'-]+$/u;
const INVALID_SYMBOLS_PATTERN = /[<>{}[\]\\|`~!@#$%^&*()+=;:"?/]/;

export type BusinessApplicationValidationMessages = {
  companyNameRequired: string;
  companyNameInvalid: string;
  sphereRequired: string;
  locationRequired: string;
  locationInvalid: string;
  phoneRequired: string;
  phoneInvalid: string;
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

  const sphere = data.sphere.trim();
  if (!sphere) {
    errors.sphere = messages.sphereRequired;
  }

  const location = data.location.trim();
  if (!location) {
    errors.location = messages.locationRequired;
  } else if (INVALID_SYMBOLS_PATTERN.test(location)) {
    errors.location = messages.locationInvalid;
  }

  const phone = data.phone.trim();
  if (!phone) {
    errors.phone = messages.phoneRequired;
  } else if (!REGISTER_PHONE_PATTERN.test(phone)) {
    errors.phone = messages.phoneInvalid;
  }

  return errors;
}

export function formatBusinessApplicationPhone(value: string) {
  return formatUzbekPhoneInput(value);
}
