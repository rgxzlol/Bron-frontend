import { getApiBaseUrl, isCrossOriginApiRequest } from "@/config/api";
import { getAuthToken } from "./token";

const DEMO_TOKEN = "demo-token";

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

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  token?: string | null;
  /** Skip demo fallback — use for endpoints where local persistence is the source of truth. */
  skipDemo?: boolean;
};

type UploadOptions = {
  method?: "POST" | "PUT" | "PATCH";
  auth?: boolean;
  token?: string | null;
};

function buildUrl(path: string) {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
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

/** Бэкенд недоступен (сетевая ошибка или заглушка хостинга вместо API). */
function isBackendUnavailable(error: unknown): error is ApiError {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 0 || error.status === 502) return true;
  if (typeof error.data === "string" && error.data.trimStart().startsWith("<")) {
    return true;
  }
  if (error.data && typeof error.data === "object") {
    const detail = (error.data as { detail?: unknown }).detail;
    if (
      typeof detail === "string" &&
      detail.includes("Upstream API returned HTML instead of JSON")
    ) {
      return true;
    }
  }
  return false;
}

async function tryDemoResponse<T>(
  path: string,
  method: string,
  body: unknown,
  token?: string | null,
): Promise<T | null> {
  const { getDemoResponse } = await import("./demo");
  const demo = getDemoResponse(path, method, body);
  if (demo === undefined) return null;

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[demo] Демо-ответ для ${method} ${path}`);
  }

  return demo as T;
}

async function resolveDemoResponse<T>(
  path: string,
  method: string,
  body: unknown,
  token?: string | null,
): Promise<T | null> {
  if (token === DEMO_TOKEN) {
    return tryDemoResponse<T>(path, method, body, token);
  }

  return null;
}

async function handleDemoFallback<T>(
  path: string,
  method: string,
  body: unknown,
  error: unknown,
): Promise<T | null> {
  if (!isBackendUnavailable(error)) {
    throw error;
  }

  const { getDemoResponse } = await import("./demo");
  const demo = getDemoResponse(path, method, body);
  if (demo !== undefined) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[demo] Бэкенд недоступен — демо-ответ для ${method} ${path}`);
    }
    return demo as T;
  }

  throw error;
}

async function executeRequest<T>(
  path: string,
  init: RequestInit,
  bodyForDemo?: unknown,
  skipDemo = false,
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
    if (
      !skipDemo &&
      process.env.NODE_ENV !== "production" &&
      path.replace(/^\//, "") === "auth/login" &&
      (init.method ?? "GET").toUpperCase() === "POST"
    ) {
      const demoLogin = await tryDemoResponse<T>(path, init.method ?? "POST", bodyForDemo);
      if (demoLogin !== null) return demoLogin;
    }

    if (!skipDemo) {
      const demo = await handleDemoFallback<T>(path, init.method ?? "GET", bodyForDemo, error);
      if (demo !== null) return demo;
    }
    throw error;
  }
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, auth = false, token, skipDemo = false }: RequestOptions = {},
): Promise<T> {
  const authToken = token ?? (auth ? getAuthToken() : null);
  if (!skipDemo) {
    const demo = await resolveDemoResponse<T>(path, method, body, authToken);
    if (demo !== null) return demo;
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
    body,
    skipDemo,
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
    Object.fromEntries(formData.entries()),
  );
}
