import apiAuth from "./_shared/api-auth.js";
import careerEngine from "./_shared/career-engine.js";
import cors from "./utils/cors.js";

const { validateApiKey } = apiAuth;
const { compareOffers, checkJobScam } = careerEngine;
const { getAllowedOrigin } = cors;

function eventFromRequest(request, context) {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  if (context?.ip && !headers["x-forwarded-for"]) {
    headers["x-forwarded-for"] = context.ip;
  }
  return {
    headers,
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
  };
}

function headersFor(event, extra = {}) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(event),
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extra,
  };
}

function json(event, status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: headersFor(event, extra),
  });
}

function operationFromUrl(request) {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "");
  if (pathname.endsWith("/career/offer-compare")) return "offer-compare";
  if (pathname.endsWith("/career/job-scam-check")) return "job-scam-check";
  return null;
}

export default async function handler(request, context) {
  const event = eventFromRequest(request, context);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: headersFor(event) });
  }
  if (request.method !== "POST") {
    return json(event, 405, { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, { Allow: "POST, OPTIONS" });
  }
  const operation = operationFromUrl(request);
  if (!operation) return json(event, 404, { error: "Unknown career endpoint", code: "NOT_FOUND" });

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 120000) return json(event, 413, { error: "Request is too large", code: "PAYLOAD_TOO_LARGE" });
  const auth = await validateApiKey(event, "career:" + operation);
  if (auth.error) return json(event, auth.status || 401, { error: auth.error, code: "API_ACCESS_DENIED" });

  let raw;
  try {
    raw = await request.text();
    if (raw.length > 120000) return json(event, 413, { error: "Request is too large", code: "PAYLOAD_TOO_LARGE" });
    raw = JSON.parse(raw);
  } catch (_) {
    return json(event, 400, { error: "Invalid JSON body", code: "INVALID_JSON" });
  }

  try {
    const startedAt = Date.now();
    const result = operation === "offer-compare" ? compareOffers(raw) : checkJobScam(raw);
    return json(event, 200, {
      status: "success",
      result,
      _meta: {
        api: "AfroTools Career",
        version: "v1",
        operation,
        response_time_ms: Date.now() - startedAt,
        data_policy: "request-scoped calculation; input is not intentionally retained",
        network_fetch_performed: false,
        docs: "https://afrotools.com/docs/api/career",
      },
    });
  } catch (error) {
    return json(event, 400, {
      error: error instanceof Error ? error.message : "Invalid career calculation input",
      code: "INVALID_INPUT",
    });
  }
}

export const config = {
  method: ["POST", "OPTIONS"],
};
