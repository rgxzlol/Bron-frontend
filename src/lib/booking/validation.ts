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

const UZBEK_PHONE_PATTERN = /^\+998 \d{2} \d{3} \d{2} \d{2}$/;

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
  const trimmed = phone.trim();

  if (!trimmed) {
    return "phoneRequired";
  }

  if (!UZBEK_PHONE_PATTERN.test(trimmed)) {
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
  phone: string,
  email: string,
): BookingFormErrorCodes {
  const errors: BookingFormErrorCodes = {
    name: validateBookingName(name),
    phone: validateBookingPhone(phone),
    email: validateBookingEmail(email),
  };

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
