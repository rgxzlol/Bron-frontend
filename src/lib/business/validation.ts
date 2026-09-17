import { REGISTER_PHONE_PATTERN } from "@/lib/auth/validation";
import type { BusinessDraft } from "@/store/business.store";

export const BUSINESS_DESCRIPTION_MAX_LENGTH = 180;

export type BusinessFormErrorCode =
  | "nameRequired"
  | "categoryRequired"
  | "phoneRequired"
  | "phoneInvalid"
  | "addressRequired"
  | "addressCoordsRequired"
  | "descriptionRequired"
  | "profilePhotoRequired"
  | "galleryRequired";

export type BusinessFormField =
  | "name"
  | "category"
  | "phone"
  | "address"
  | "description"
  | "profilePhoto"
  | "gallery";

export type BusinessFormErrorCodes = Partial<Record<BusinessFormField, BusinessFormErrorCode>>;

export type BusinessFormErrors = Partial<Record<BusinessFormField, string>>;

export const BUSINESS_ERROR_MESSAGE_KEYS: Record<BusinessFormErrorCode, string> = {
  nameRequired: "businessErrors.nameRequired",
  categoryRequired: "businessErrors.categoryRequired",
  phoneRequired: "businessErrors.phoneRequired",
  phoneInvalid: "businessErrors.phoneInvalid",
  addressRequired: "businessErrors.addressRequired",
  addressCoordsRequired: "businessErrors.addressSelectFromSuggestions",
  descriptionRequired: "businessErrors.descriptionRequired",
  profilePhotoRequired: "businessErrors.profilePhotoRequired",
  galleryRequired: "businessErrors.galleryRequired",
};

export function validateBusinessForm(draft: BusinessDraft): BusinessFormErrorCodes {
  const errors: BusinessFormErrorCodes = {};

  if (!draft.name.trim()) {
    errors.name = "nameRequired";
  }

  if (!draft.category) {
    errors.category = "categoryRequired";
  }

  const phone = draft.phone.trim();
  if (!phone) {
    errors.phone = "phoneRequired";
  } else if (!REGISTER_PHONE_PATTERN.test(phone)) {
    errors.phone = "phoneInvalid";
  }

  if (!draft.address.trim()) {
    errors.address = "addressRequired";
  } else if (draft.lat == null || draft.lng == null) {
    errors.address = "addressCoordsRequired";
  }

  if (!draft.description.trim()) {
    errors.description = "descriptionRequired";
  }

  if (!draft.profilePhoto) {
    errors.profilePhoto = "profilePhotoRequired";
  }

  if (!draft.gallery.some(Boolean)) {
    errors.gallery = "galleryRequired";
  }

  return errors;
}

export function clampBusinessDescription(value: string): string {
  return value.slice(0, BUSINESS_DESCRIPTION_MAX_LENGTH);
}
