const { createClient } = require("@supabase/supabase-js");
const Pricing = require("../../assets/js/lib/fp-material-pricing.js");

const SUPABASE_URL = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || "https://jbmhfpkzbgyeodsqhprx.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DATA_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY_DATA || process.env.SUPABASE_ANON_KEY;

let supabase;

function getSupabase() {
  if (!SUPABASE_KEY) return null;
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabase;
}

function getCorsHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const isAllowed =
    origin === "https://afrotools.com" ||
    origin === "https://www.afrotools.com" ||
    origin.endsWith(".netlify.app") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://afrotools.com",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
}

exports.handler = async function (event) {
  const headers = getCorsHeaders(event);

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const items = Array.isArray(payload.items) ? payload.items.slice(0, 80) : [];
  const context = payload.context || {};
  if (!items.length) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "No BOQ items provided" }) };
  }

  try {
    const records = await fetchAfroPriceRecords(items, context);
    const results = items.map((item) => Pricing.getMaterialPrice({
      ...context,
      ...item,
      country: item.country || context.country,
      city: item.city || context.city,
      stateOrRegion: item.stateOrRegion || context.stateOrRegion
    }, { records }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        source: records.length ? "afro-prices-supabase" : "afro-prices-fallback",
        fallbackUsed: results.some((result) => result.fallbackUsed),
        results
      })
    };
  } catch (error) {
    console.error("floor-planner-material-prices error:", error);
    const results = items.map((item) => Pricing.getMaterialPrice({ ...context, ...item }));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        source: "afro-prices-fallback",
        fallbackUsed: true,
        warning: "Afro Prices lookup failed; fallback estimates were labelled in the BOQ.",
        results
      })
    };
  }
};

async function fetchAfroPriceRecords(items, context) {
  const sb = getSupabase();
  if (!sb) return [];

  const country = Pricing.normalizeCountry(context.country || items[0]?.country || "NG");
  const terms = Array.from(new Set(items.map((item) => item.materialName || item.name || "").filter(Boolean))).slice(0, 30);
  const records = [];

  for (const term of terms) {
    const clean = sanitizeTerm(term);
    if (!clean) continue;

    const { data: products, error: productError } = await sb
      .from("products")
      .select("id, name, brand, category, subcategory, specs")
      .or(`name.ilike.%${clean}%,description.ilike.%${clean}%,subcategory.ilike.%${clean}%`)
      .limit(10);

    if (productError || !products || !products.length) continue;
    const productIds = products.map((product) => product.id);

    const [listingsResult, communityResult, historyResult] = await Promise.all([
      sb.from("price_listings")
        .select("product_id, country_code, source_name, source_type, price, currency_code, last_verified, verified_by")
        .in("product_id", productIds)
        .eq("country_code", country)
        .order("last_verified", { ascending: false, nullsFirst: false })
        .limit(20),
      sb.from("community_prices")
        .select("product_id, product_name, country_code, city, market_name, price, currency_code, status, created_at")
        .in("product_id", productIds)
        .eq("country_code", country)
        .in("status", ["verified"])
        .order("created_at", { ascending: false })
        .limit(20),
      sb.from("price_history")
        .select("product_id, country_code, source_name, price, currency_code, recorded_at")
        .in("product_id", productIds)
        .eq("country_code", country)
        .order("recorded_at", { ascending: false })
        .limit(20)
    ]);

    const productById = Object.fromEntries(products.map((product) => [product.id, product]));
    (listingsResult.data || []).forEach((row) => {
      const product = productById[row.product_id] || {};
      records.push({
        materialName: product.name || term,
        name: product.name || term,
        specification: specificationFor(product, row),
        unit: unitForProduct(product),
        unitPrice: Number(row.price),
        currency: row.currency_code,
        country,
        sourceType: row.last_verified ? "verified_supplier" : "country_average",
        sourceName: row.source_name || "Afro Prices listing",
        verifiedDate: row.last_verified,
        confidenceScore: row.last_verified ? undefined : 0.48
      });
    });
    (communityResult.data || []).forEach((row) => {
      records.push({
        materialName: row.product_name || term,
        name: row.product_name || term,
        specification: term,
        unit: "pieces",
        unitPrice: Number(row.price),
        currency: row.currency_code,
        country,
        city: row.city || "",
        sourceType: row.city && context.city && row.city.toLowerCase() === String(context.city).toLowerCase() ? "regional_average" : "country_average",
        sourceName: row.market_name || "Verified community Afro Prices",
        verifiedDate: row.created_at,
        confidenceScore: 0.55
      });
    });
    (historyResult.data || []).forEach((row) => {
      const product = productById[row.product_id] || {};
      records.push({
        materialName: product.name || term,
        name: product.name || term,
        specification: specificationFor(product, row),
        unit: unitForProduct(product),
        unitPrice: Number(row.price),
        currency: row.currency_code,
        country,
        sourceType: "country_average",
        sourceName: row.source_name || "Afro Prices history",
        verifiedDate: row.recorded_at,
        confidenceScore: 0.5
      });
    });
  }

  return records;
}

function sanitizeTerm(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9\s\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function specificationFor(product) {
  const specs = product && product.specs && typeof product.specs === "object" ? product.specs : {};
  return specs.specification || specs.size || specs.unit || product.subcategory || product.name || "";
}

function unitForProduct(product) {
  const text = `${product?.name || ""} ${JSON.stringify(product?.specs || {})}`.toLowerCase();
  if (/50kg|bag/.test(text)) return "bags";
  if (/sheet/.test(text)) return "sheets";
  if (/m2|sqm|square/.test(text)) return "m2";
  if (/metre|meter|length/.test(text)) return "m";
  if (/trip/.test(text)) return "trips";
  if (/m3|cubic/.test(text)) return "m3";
  return "pieces";
}
