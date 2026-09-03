import { getUzbekPhoneLocalDigits } from "@/lib/auth/validation";

export const SYNTHETIC_EMAIL_DOMAIN = "bron.app";

function toAsciiSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0400-\u04ff]/g, "")
    .slice(0, 24);
}

/** Unique synthetic email for OAuth/phone-only registration flows. */
export function buildSyntheticEmail(username: string, phone: string) {
  const phoneDigits = getUzbekPhoneLocalDigits(phone) || phone.replace(/\D/g, "").slice(-9);
  const slug = toAsciiSlug(username) || "user";

  return `${slug}.${phoneDigits || "000000000"}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** Placeholder emails used only for API registration — not shown to users. */
export function isSyntheticEmail(email: string | null | undefined) {
  const trimmed = email?.trim().toLowerCase() ?? "";
  if (!trimmed) return false;
  return trimmed.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`);
}

/** Real user-facing email, or empty when the stored value is a synthetic placeholder. */
export function toUserFacingEmail(email: string | null | undefined) {
  const trimmed = email?.trim() ?? "";
  return isSyntheticEmail(trimmed) ? "" : trimmed;
}
