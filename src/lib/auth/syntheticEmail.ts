import { getUzbekPhoneLocalDigits } from "@/lib/auth/validation";

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

  return `${slug}.${phoneDigits || "000000000"}@bron.app`;
}
