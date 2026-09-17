export const SEARCH_QUERY_MAX_LENGTH = 100;

const UNSAFE_SEARCH_PATTERN = /[<>`$;{}\\]|(?:javascript:|data:)/gi;

export function sanitizeSearchQuery(value: string) {
  return value.replace(UNSAFE_SEARCH_PATTERN, "").slice(0, SEARCH_QUERY_MAX_LENGTH);
}

export function normalizeSearchQuery(value: string) {
  return sanitizeSearchQuery(value).trim();
}

export function isSearchQuerySubmittable(value: string) {
  return normalizeSearchQuery(value).length > 0;
}
