const STORAGE_KEY = "bron-service-booking-rules";

type StoredRules = Record<string, string>;

function readRules(): StoredRules {
  if (typeof window === "undefined") return {};

  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, string] =>
        typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

function ruleKey(businessId: string, serviceId: string) {
  return `${businessId}:${serviceId}`;
}

export function getServiceBookingRules(businessId: string, serviceId: string) {
  return readRules()[ruleKey(businessId, serviceId)] ?? "";
}

export function saveServiceBookingRules(
  businessId: string,
  serviceId: string,
  rules: string,
) {
  if (typeof window === "undefined") return;

  const stored = readRules();
  stored[ruleKey(businessId, serviceId)] = rules;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}