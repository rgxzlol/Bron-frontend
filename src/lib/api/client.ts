import { getApiBaseUrl, isCrossOriginApiRequest } from "@/config/api";
import { getAuthToken } from "./token";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.data || typeof error.data !== "object") {
    return {};
  }

  const detail = (error.data as { detail?: unknown }).detail;
  if (!Array.isArray(detail)) return {};

  return detail.reduce<Record<string, string>>((errors, issue) => {
    if (!issue || typeof issue !== "object") return errors;
    const { loc, msg } = issue as { loc?: unknown; msg?: unknown };
    if (!Array.isArray(loc) || typeof msg !== "string") return errors;
    const field = loc[loc.length - 1];
    if (typeof field === "string") errors[field] = msg;
    return errors;
  }, {});
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  token?: string | null;
};

type UploadOptions = {
  method?: "POST" | "PUT" | "PATCH";
  auth?: boolean;
  token?: string | null;
};

function normalizeApiPath(path: string) {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  const [pathname, ...searchParts] = withLeadingSlash.split("?");
  const normalizedPathname =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const search = searchParts.join("?");

  return search ? `${normalizedPathname}?${search}` : normalizedPathname;
}

function buildUrl(path: string) {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const normalizedPath = normalizeApiPath(path);
  return `${base}${normalizedPath}`;
}

function parseResponseBody(text: string, status: number, contentType: string | null): unknown {
  if (!text) return null;

  const isJson =
    contentType?.includes("application/json") ||
    text.trim().startsWith("{") ||
    text.trim().startsWith("[");

  if (!isJson) {
    const preview = text.replace(/\s+/g, " ").slice(0, 120);
    if (process.env.NODE_ENV !== "production") {
      console.warn(`API вернул не-JSON (${status}):`, preview);
    }
    throw new ApiError(
      status,
      "Сервер временно недоступен. Попробуйте позже.",
      text,
    );
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(status, "Failed to parse JSON response from server", text);
  }
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const record = data as Record<string, unknown>;

  if (typeof record.detail === "string") return record.detail;
  if (Array.isArray(record.detail) && record.detail.length > 0) {
    const first = record.detail[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "msg" in first) {
      return String((first as { msg: unknown }).msg);
    }
  }
  if (typeof record.message === "string") return record.message;

  for (const value of Object.values(record)) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }

  return fallback;
}

async function executeRequest<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const requestUrl = buildUrl(path);
  const crossOrigin = isCrossOriginApiRequest(requestUrl);

  try {
    let response: Response;

    try {
      response = await fetch(requestUrl, {
        ...init,
        cache: "no-store",
        mode: crossOrigin ? "cors" : "same-origin",
        credentials: crossOrigin ? "omit" : "same-origin",
      });
    } catch {
      throw new ApiError(
        0,
        "Не удалось подключиться к серверу. Проверьте интернет и попробуйте снова.",
      );
    }

    const text = await response.text();
    const data = parseResponseBody(text, response.status, response.headers.get("content-type"));

    if (!response.ok) {
      throw new ApiError(
        response.status,
        extractErrorMessage(data, response.statusText || "Ошибка запроса"),
        data,
      );
    }

    return data as T;
  } catch (error) {
    throw error;
  }
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, auth = false, token }: RequestOptions = {},
): Promise<T> {
  const authToken = token ?? (auth ? getAuthToken() : null);
  if (auth && !authToken) {
    throw new ApiError(401, "Требуется авторизация");
  }
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return executeRequest<T>(
    path,
    {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
  );
}

export async function apiUploadRequest<T>(
  path: string,
  formData: FormData,
  { method = "POST", auth = false, token }: UploadOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const authToken = token ?? (auth ? getAuthToken() : null);
  if (auth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return executeRequest<T>(
    path,
    {
      method,
      headers,
      body: formData,
    },
  );
}
