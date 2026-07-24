"use strict";

const EXPECTED_PROJECT_URL = "https://zpclagtgczsygrgztlts.supabase.co";
const EXPECTED_PROJECT_REF = "zpclagtgczsygrgztlts";
const ALLOWED_QUERY = new Set(["country","sector","risk","maxBudget","search","sort","page"]);
const SECTORS = new Set(["transportation","agriculture","food","technology","retail","fintech","construction","health","education","energy","fashion","tourism","media","manufacturing","services","mining","beauty","logistics","waste","telecom"]);
const RISKS = new Set(["low","medium","high"]);
const ORDERS = {
  breakeven:"breakeven_months_min.asc.nullslast",
  cost:"startup_cost_min.asc.nullslast",
  revenue:"monthly_revenue_max.desc.nullslast",
  newest:"created_at.desc.nullslast"
};
const PUBLIC_FIELDS = ["id","name","country_code","country_name","sector","risk","currency","description","why_africa","revenue_model","risks","best_cities","startup_cost_min","startup_cost_max","monthly_revenue_min","monthly_revenue_max","breakeven_months_min","breakeven_months_max","created_at"];

function cleanEnv(value) {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");
}
function headers() {
  return {
    "Content-Type":"application/json; charset=utf-8",
    "Access-Control-Allow-Headers":"Content-Type",
    "Access-Control-Allow-Methods":"GET, OPTIONS",
    "Cache-Control":"no-store, max-age=0",
    "X-Content-Type-Options":"nosniff"
  };
}
function response(statusCode, body) {
  return { statusCode, headers:headers(), body:body == null ? "" : JSON.stringify(body) };
}
function finite(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1000000000000000 ? number : NaN;
}
function validAnonKey(value) {
  try {
    const parts = String(value || "").split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return payload && payload.ref === EXPECTED_PROJECT_REF && payload.role === "anon";
  } catch (_) {
    return false;
  }
}
function buildUpstreamUrl(params) {
  const query = [`select=${PUBLIC_FIELDS.join(",")}`];
  if (params.country) query.push(`country_code=eq.${encodeURIComponent(params.country)}`);
  if (params.sector) query.push(`sector=eq.${encodeURIComponent(params.sector)}`);
  if (params.risk) query.push(`risk=eq.${encodeURIComponent(params.risk)}`);
  if (params.maxBudget != null) query.push(`startup_cost_min=lte.${encodeURIComponent(params.maxBudget)}`);
  if (params.search) query.push(`name=ilike.${encodeURIComponent(`*${params.search}*`)}`);
  query.push(`order=${encodeURIComponent(ORDERS[params.sort] || ORDERS.breakeven)}`);
  query.push("limit=24");
  query.push(`offset=${encodeURIComponent((params.page - 1) * 24)}`);
  return `${EXPECTED_PROJECT_URL}/rest/v1/business_ideas?${query.join("&")}`;
}
function publicRow(row) {
  const source = row && typeof row === "object" ? row : {};
  const output = {};
  PUBLIC_FIELDS.forEach(field => { output[field] = source[field] == null ? null : source[field]; });
  return output;
}
function parseParams(event) {
  const raw = event.queryStringParameters || {};
  if (Object.keys(raw).some(key => !ALLOWED_QUERY.has(key))) return { error:"unsupported_query" };
  const country = String(raw.country || "").trim().toUpperCase();
  const sector = String(raw.sector || "").trim().toLowerCase();
  const risk = String(raw.risk || "").trim().toLowerCase();
  const sort = String(raw.sort || "breakeven").trim().toLowerCase();
  const search = String(raw.search || "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  const budget = finite(raw.maxBudget);
  const page = Number(raw.page || 1);
  if (country && !/^[A-Z]{2}$/.test(country)) return { error:"invalid_country" };
  if (sector && !SECTORS.has(sector)) return { error:"invalid_sector" };
  if (risk && !RISKS.has(risk)) return { error:"invalid_risk" };
  if (!ORDERS[sort] || search.length > 100 || Number.isNaN(budget) || !Number.isInteger(page) || page < 1 || page > 1000) return { error:"invalid_query" };
  return { country, sector, risk, sort, search, maxBudget:budget, page };
}
function createHandler(options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || global.fetch;
  const timeoutMs = Math.max(100, Math.min(Number(options.timeoutMs) || 8000, 15000));
  return async function handler(event = {}) {
    if (event.httpMethod === "OPTIONS") return response(204, null);
    if (event.httpMethod !== "GET") return response(405, { error:"method_not_allowed" });
    if (event.body) return response(400, { error:"request_body_not_allowed" });

    const configuredUrl = cleanEnv(env.SUPABASE_AUTH_URL || env.SUPABASE_URL) || EXPECTED_PROJECT_URL;
    if (configuredUrl !== EXPECTED_PROJECT_URL) return response(503, { error:"project_configuration_mismatch" });
    const anonKey = cleanEnv(env.SUPABASE_ANON_KEY_AUTH || env.SUPABASE_ANON_KEY);
    if (!validAnonKey(anonKey) || typeof fetchImpl !== "function") return response(503, { error:"evidence_service_not_configured" });

    const params = parseParams(event);
    if (params.error) return response(400, { error:params.error });
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const upstream = await fetchImpl(buildUpstreamUrl(params), {
        method:"GET",
        headers:{ apikey:anonKey, Authorization:`Bearer ${anonKey}`, Prefer:"count=exact", Accept:"application/json" },
        signal:controller.signal
      });
      if (!upstream || !upstream.ok) return response(502, { error:"evidence_service_unavailable" });
      const rows = await upstream.json();
      if (!Array.isArray(rows) || rows.length > 24) return response(502, { error:"invalid_evidence_response" });
      const range = upstream.headers && upstream.headers.get ? upstream.headers.get("content-range") : "";
      const match = /\/(\d+)$/.exec(range || "");
      return response(200, { rows:rows.map(publicRow), reportedTotal:match ? Number(match[1]) : null });
    } catch (_) {
      return response(timedOut ? 504 : 502, { error:timedOut ? "evidence_service_timeout" : "evidence_service_unavailable" });
    } finally {
      clearTimeout(timer);
    }
  };
}

exports.createHandler = createHandler;
exports.buildUpstreamUrl = buildUpstreamUrl;
exports.validAnonKey = validAnonKey;
exports.publicRow = publicRow;
exports.handler = event => createHandler()(event);
