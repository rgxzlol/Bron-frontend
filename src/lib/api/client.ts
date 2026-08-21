import { getApiBaseUrl } from "@/config/api";
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

type RequestOptions = {
  method?: string;
  body?: unknown;
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
    throw new ApiError(
      status,
      preview.includes("<!DOCTYPE") || preview.includes("<html")
        ? `Server returned HTML instead of JSON (${status}). Check the API proxy / upstream.`
        : `Server returned an invalid response (${status}): ${preview}`,
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

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, auth = false, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const authToken = token ?? (auth ? getAuthToken() : null);
  if (auth && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "Failed to connect to the server. Check your internet connection and try again.",
    );
  }

  const text = await response.text();
  const data = parseResponseBody(text, response.status, response.headers.get("content-type"));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractErrorMessage(data, response.statusText || "Request failed"),
      data,
    );
  }

  return data as T;
}
