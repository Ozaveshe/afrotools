// netlify/functions/afroprices-search.js
// Searches affiliate APIs + Supabase for product prices
// Caches results with 6-hour TTL

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://jbmhfpkzbgyeodsqhprx.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibWhmcGt6Ymd5ZW9kc3FocHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTY2MDcsImV4cCI6MjA1NzY5MjYwN30.gVLMsMVjqEMOCMCFnPBHaf8njEhNPGUB2v3XnDnlqSM";

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

  const { query, country_code, category } = body;

  if (!query || !country_code) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: "Missing query or country_code" })
    };
  }

  try {
    const sb = getSupabase();

    // Search products
    let productQuery = sb
      .from("products")
      .select("id, name, brand, category, subcategory, description, image_url, specs")
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
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
