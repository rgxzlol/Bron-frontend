import {
  hasExcessUzbekPhoneDigits,
  isUzbekPhoneEmpty,
  REGISTER_PHONE_PATTERN,
  validateRegisterName,
} from "@/lib/auth/validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ProfilePersonalField = "fullName" | "phone" | "email";

export type ProfilePersonalErrorCode =
  | "fullNameRequired"
  | "fullNameInvalid"
  | "phoneRequired"
  | "phoneInvalid"
  | "emailRequired"
  | "emailInvalid";

export type ProfilePersonalErrors = Partial<
  Record<ProfilePersonalField, ProfilePersonalErrorCode>
>;

export const PROFILE_ERROR_MESSAGE_KEYS = {
  fullNameRequired: "profile.errorFullNameRequired",
  fullNameInvalid: "profile.errorFullNameInvalid",
  phoneRequired: "profile.errorPhoneRequired",
  phoneInvalid: "profile.errorPhoneInvalid",
  emailRequired: "profile.errorEmailRequired",
  emailInvalid: "profile.errorEmailInvalid",
} as const satisfies Record<ProfilePersonalErrorCode, string>;

export function validateProfilePersonalInfo(
  fullName: string,
  phone: string,
  email: string,
): ProfilePersonalErrors {
  const errors: ProfilePersonalErrors = {};

  const trimmedName = fullName.trim();
  if (!trimmedName) {
    errors.fullName = "fullNameRequired";
  } else if (validateRegisterName(trimmedName)) {
    errors.fullName = "fullNameInvalid";
  }

  const trimmedPhone = phone.trim();
  if (!trimmedPhone || isUzbekPhoneEmpty(trimmedPhone)) {
    errors.phone = "phoneRequired";
  } else if (
    hasExcessUzbekPhoneDigits(trimmedPhone) ||
    !REGISTER_PHONE_PATTERN.test(trimmedPhone)
  ) {
    errors.phone = "phoneInvalid";
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    errors.email = "emailRequired";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "emailInvalid";
  }

  return errors;
}
