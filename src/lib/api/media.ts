import { REMOTE_API_URL } from "@/config/api";

const MEDIA_ORIGIN = REMOTE_API_URL.replace(/\/api\/?$/, "");
const MAX_API_IMAGE_SIZE = 5 * 1024 * 1024;
const API_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function assertApiImage(image: File | Blob) {
  if (!API_IMAGE_TYPES.has(image.type.toLowerCase())) {
    throw new Error("Изображение должно быть в формате JPEG, PNG или WEBP.");
  }

  if (image.size > MAX_API_IMAGE_SIZE) {
    throw new Error("Размер изображения не должен превышать 5 МБ.");
  }
}

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
