import { REMOTE_API_URL } from "@/config/api";

const MEDIA_ORIGIN = REMOTE_API_URL.replace(/\/api\/?$/, "");

export function resolveMediaUrl(
  value?: string | null,
): string | null {
  if (!value?.trim()) return null;

  const url = value.trim();

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    return `${MEDIA_ORIGIN}${url}`;
  }

  return `${MEDIA_ORIGIN}/${url.replace(/^\/+/, "")}`;
}
