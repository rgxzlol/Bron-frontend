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

async function proxyRequest(request: NextRequest) {
  const apiPath = request.nextUrl.pathname.replace(/^\/backend\/?/, "");
  const targetUrl = `${REMOTE_API_URL}/${apiPath}${request.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");

  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

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

  if (looksLikeHtml(text, upstreamType)) {
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
