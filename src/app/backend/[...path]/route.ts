import { NextRequest, NextResponse } from "next/server";
import { REMOTE_API_URL } from "@/config/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function looksLikeHtml(text: string, contentType: string | null) {
  const type = contentType?.toLowerCase() ?? "";
  if (type.includes("text/html")) return true;

  const trimmed = text.trimStart().slice(0, 32).toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

function looksLikeNonJsonPayload(text: string, contentType: string | null) {
  if (looksLikeHtml(text, contentType)) return true;

  const type = contentType?.toLowerCase() ?? "";
  if (
    type.includes("text/css") ||
    type.includes("text/javascript") ||
    type.includes("application/javascript") ||
    type.includes("image/") ||
    type.includes("font/")
  ) {
    return true;
  }

  const trimmed = text.trimStart();
  if (!trimmed) return false;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return false;
  if (/^redirecting\b/i.test(trimmed)) return true;
  if (trimmed.startsWith(".") || trimmed.startsWith("@")) return true;

  return false;
}

async function readProxyBody(request: NextRequest): Promise<{
  body?: BodyInit;
  contentType: string | null;
}> {
  const contentType = request.headers.get("content-type");
  if (["GET", "HEAD"].includes(request.method)) {
    return { contentType };
  }

  // Never decode multipart/binary uploads as text — that corrupts files and
  // makes the upstream API return HTML/CSS error pages.
  if (contentType?.toLowerCase().includes("multipart/form-data")) {
    const body = await request.arrayBuffer();
    return { body, contentType };
  }

  if (
    contentType?.toLowerCase().includes("application/octet-stream") ||
    contentType?.toLowerCase().startsWith("image/")
  ) {
    const body = await request.arrayBuffer();
    return { body, contentType };
  }

  const body = await request.arrayBuffer();
  return { body, contentType };
}

async function proxyRequest(request: NextRequest) {
  const apiPath = request.nextUrl.pathname
    .replace(/^\/backend\/?/, "")
    .replace(/\/+$/, "");
  const targetUrl = `${REMOTE_API_URL}/${apiPath}${request.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");

  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  const { body, contentType } = await readProxyBody(request);
  if (contentType) headers.set("Content-Type", contentType);

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "follow",
    });
  } catch {
    return NextResponse.json(
      { detail: "Failed to connect to the API server" },
      { status: 502 },
    );
  }

  const text = await response.text();
  const upstreamType = response.headers.get("content-type");

  if (looksLikeNonJsonPayload(text, upstreamType)) {
    return NextResponse.json(
      {
        detail: `Upstream API returned HTML instead of JSON (${response.status}). Check that the remote API is running.`,
      },
      { status: response.status === 404 ? 502 : response.status },
    );
  }

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": upstreamType ?? "application/json",
    },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
