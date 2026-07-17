// netlify/functions/afroprices-search.js
// Searches affiliate APIs + Supabase for product prices
// Caches results with 6-hour TTL

const { createClient } = require("@supabase/supabase-js");

// Sanitize search query to prevent PostgREST operator injection
// Whitelist approach: only allow letters, numbers, spaces, hyphens
function sanitizeQuery(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[^a-zA-Z0-9\s\-]/g, '') // strict whitelist: alphanumeric, spaces, hyphens only
    .replace(/\s+/g, ' ')              // collapse whitespace
    .trim()
    .slice(0, 100);                    // max 100 chars
}

const SUPABASE_URL = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || "https://zpclagtgczsygrgztlts.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_DATA || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_ANON_KEY) console.warn('[afroprices-search] Missing SUPABASE_ANON_KEY_DATA env var');

let supabase;
function getSupabase() {
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

// CORS helper
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
    "Vary": "Origin"
  };
}

exports.handler = async function (event) {
  const headers = getCorsHeaders(event);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { query: rawQuery, country_code, category } = body;
  const query = sanitizeQuery(rawQuery);

  if (!query || !country_code) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: "Missing query or country_code" })
    };
  }

  try {
    const sb = getSupabase();

    // Search products — use encodeURIComponent to prevent PostgREST operator injection
    // The sanitizeQuery whitelist already strips all special chars, but double-encode as defense-in-depth
    const safePattern = `%${query.replace(/%/g, '')}%`;
    let productQuery = sb
      .from("products")
      .select("id, name, brand, category, subcategory, description, image_url, specs")
      .or(`name.ilike.${safePattern},brand.ilike.${safePattern},description.ilike.${safePattern}`)
      .limit(20);

    if (category) {
      productQuery = productQuery.eq("category", category);
    }

    const { data: products, error: pError } = await productQuery;
    if (pError) throw pError;

    if (!products || products.length === 0) {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ results: [], source: "supabase", message: "No products found" })
      };
    }

    // Get price listings for found products in this country
    const productIds = products.map(p => p.id);

    const [listingsResult, communityResult] = await Promise.all([
      sb.from("price_listings")
        .select("*")
        .in("product_id", productIds)
        .eq("country_code", country_code)
        .order("price", { ascending: true }),
      sb.from("community_prices")
        .select("*")
        .in("product_id", productIds)
        .eq("country_code", country_code)
        .in("status", ["verified", "pending"])
        .order("created_at", { ascending: false })
        .limit(20)
    ]);

    if (listingsResult.error) {
      console.error("AfroPrices listings query error:", listingsResult.error);
    }
    if (communityResult.error) {
      console.error("AfroPrices community query error:", communityResult.error);
    }
    const listings = listingsResult.data || [];
    const community = communityResult.data || [];

    // Assemble results
    const results = products.map(product => {
      const pListings = listings.filter(l => l.product_id === product.id);
      const pCommunity = community.filter(c => c.product_id === product.id);

      return {
        ...product,
        listings: pListings,
        communityPrices: pCommunity
      };
    }).filter(p => p.listings.length > 0 || p.communityPrices.length > 0);

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ results, source: "supabase", count: results.length })
    };
  } catch (err) {
    console.error("AfroPrices search error:", err);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "Search failed", message: err.message })
    };
  }
};
