import { formatUzbekPhoneInput, isValidUzbekPhone } from "@/lib/auth/validation";
import { isValidEmailAddress } from "@/lib/email/validation";

export type BookingFieldErrorCode =
  | "nameRequired"
  | "nameInvalid"
  | "phoneRequired"
  | "phoneInvalid"
  | "emailInvalid";

export type BookingFormErrorCodes = {
  name?: BookingFieldErrorCode;
  phone?: BookingFieldErrorCode;
  email?: BookingFieldErrorCode;
};

export type BookingFormErrors = {
  name?: string;
  phone?: string;
  email?: string;
};

export function validateBookingName(name: string): BookingFieldErrorCode | undefined {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return "nameRequired";
  }

  if (!/^[\p{L}][\p{L}\s'-]*$/u.test(trimmed)) {
    return "nameInvalid";
  }

  return undefined;
}

export function validateBookingPhone(phone: string): BookingFieldErrorCode | undefined {
  const formatted = formatUzbekPhoneInput(phone);

  if (!formatted) {
    return "phoneRequired";
  }

  if (!isValidUzbekPhone(formatted) && !isValidUzbekPhone(phone)) {
    return "phoneInvalid";
  }

  return undefined;
}

export function validateBookingEmail(email: string): BookingFieldErrorCode | undefined {
  const trimmed = email.trim();

  if (!trimmed) {
    return undefined;
  }

  if (!isValidEmailAddress(trimmed)) {
    return "emailInvalid";
  }

  return undefined;
}

export function validateBookingForm(
  name: string,
  email: string,
  /** When set, validate the account phone silently (field is not shown in the form). */
  accountPhone?: string,
): BookingFormErrorCodes {
  const errors: BookingFormErrorCodes = {
    name: validateBookingName(name),
    email: validateBookingEmail(email),
  };

  if (accountPhone !== undefined) {
    errors.phone = validateBookingPhone(accountPhone);
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value != null),
  ) as BookingFormErrorCodes;
}

export const BOOKING_ERROR_MESSAGE_KEYS = {
  nameRequired: "booking.errorName",
  nameInvalid: "booking.errorNameInvalid",
  phoneRequired: "booking.errorPhoneRequired",
  phoneInvalid: "booking.errorPhone",
  emailInvalid: "booking.errorEmail",
} as const satisfies Record<BookingFieldErrorCode, string>;
