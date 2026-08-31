const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** Real domains that are one character away from popular providers. */
const VALID_NEAR_MISS_DOMAINS = new Set([
  "mail.com",
  "email.com",
  "game.com",
  "games.com",
]);

const KNOWN_INVALID_DOMAINS = new Set([
  "gmoil.com",
  "gmial.com",
  "gmal.com",
  "gnail.com",
  "gamil.com",
  "gmali.com",
  "gmaill.com",
  "gmai.com",
  "gmil.com",
  "gmsil.com",
  "gmqil.com",
  "gmail.co",
  "gmail.cm",
  "gmail.con",
  "gmail.om",
  "gmail.coom",
  "gmail.comm",
  "gmailcom.com",
  "googlemail.co",
  "yaho.com",
  "yahooo.com",
  "yaoo.com",
  "yhoo.com",
  "yahho.com",
  "hotmial.com",
  "hotmal.com",
  "hotmil.com",
  "hotmali.com",
  "outlok.com",
  "outllok.com",
  "outlook.co",
  "mai.ru",
  "mal.ru",
  "yandx.ru",
]);

const POPULAR_EMAIL_HOSTS = [
  { label: "gmail", tlds: ["com"] },
  { label: "googlemail", tlds: ["com"] },
  { label: "yahoo", tlds: ["com"] },
  { label: "hotmail", tlds: ["com"] },
  { label: "outlook", tlds: ["com"] },
  { label: "icloud", tlds: ["com"] },
  { label: "mail", tlds: ["ru"] },
  { label: "yandex", tlds: ["ru", "com"] },
  { label: "bk", tlds: ["ru"] },
  { label: "inbox", tlds: ["ru"] },
  { label: "list", tlds: ["ru"] },
  { label: "rambler", tlds: ["ru"] },
] as const;

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function parseEmailDomain(email: string): string | null {
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === email.length - 1) {
    return null;
  }

  return email.slice(atIndex + 1).toLowerCase();
}

function isTypoDomain(domain: string): boolean {
  if (VALID_NEAR_MISS_DOMAINS.has(domain)) {
    return false;
  }

  if (KNOWN_INVALID_DOMAINS.has(domain)) {
    return true;
  }

  const parts = domain.split(".").filter(Boolean);
  if (parts.length < 2) {
    return true;
  }

  const tld = parts[parts.length - 1];
  const label = parts[parts.length - 2];

  if (!/^[a-z0-9-]+$/i.test(label) || !/^[a-z]{2,}$/i.test(tld)) {
    return true;
  }

  for (const host of POPULAR_EMAIL_HOSTS) {
    if (label === host.label && (host.tlds as readonly string[]).includes(tld)) {
      return false;
    }
  }

  for (const host of POPULAR_EMAIL_HOSTS) {
    if (!(host.tlds as readonly string[]).includes(tld)) continue;
    if (levenshtein(label, host.label) === 1) {
      return true;
    }
  }

  return false;
}

export function isValidEmailAddress(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) {
    return false;
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return false;
  }

  const domain = parseEmailDomain(trimmed);
  if (!domain || domain.includes("..") || domain.startsWith(".") || domain.endsWith(".")) {
    return false;
  }

  return !isTypoDomain(domain);
}
