// netlify/functions/afroprices-submit.js
// Community price submission endpoint
// Rate limited: 5 submissions per day per IP

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL || "https://zpclagtgczsygrgztlts.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY_DATA || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_ANON_KEY) console.warn('[afroprices-submit] Missing SUPABASE_ANON_KEY_DATA env var');

let supabase;
function getSupabase() {
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabase;
}

// In-memory rate limiter (per instance)
// LIMITATION: This object resets on each cold start / new Lambda instance.
// Rate limits are per-instance, not global. For persistent rate limiting,
// migrate to Netlify Blobs or an external store (e.g. Supabase).
const rateLimits = {};
const RATE_LIMIT = 5;

function checkRateLimit(ip) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `submit_${ip}_${today}`;
  if (!rateLimits[key]) rateLimits[key] = 0;
  if (rateLimits[key] >= RATE_LIMIT) return false;
  rateLimits[key]++;
  return true;
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

  // Rate limiting
  const ip = (event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown").split(",")[0].trim();
  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429, headers,
      body: JSON.stringify({ success: false, error: "You've reached your daily submission limit (5/day). Try again tomorrow." })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: "Invalid JSON" }) }; }

  const { product_name, product_id, country_code, city, market_name, price, currency_code, photo_url } = body;

  // Validate required fields
  if (!product_name || !country_code || !price || !currency_code) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ success: false, error: "Missing required fields: product_name, country_code, price, currency_code" })
    };
  }

  // Validate price
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return {
      statusCode: 400, headers,
      body: JSON.stringify({ success: false, error: "Invalid price" })
    };
  }

  try {
    const sb = getSupabase();

    // Determine auto-approval status
    let status = "pending";

    // If we have a product_id, check against known average price
    if (product_id) {
      const { data: avgData } = await sb
        .from("price_listings")
        .select("price")
        .eq("product_id", product_id)
        .eq("country_code", country_code);

      if (avgData && avgData.length > 0) {
        const avg = avgData.reduce((sum, l) => sum + l.price, 0) / avgData.length;
        const ratio = numPrice / avg;
        if (ratio >= 0.7 && ratio <= 1.3) {
          status = "verified"; // Within 30% of average — auto-approve
        } else if (ratio < 0.2 || ratio > 2.0) {
          status = "flagged"; // Suspiciously different
        }
      }
    }

    const { data, error } = await sb.from("community_prices").insert({
      product_name,
      product_id: product_id || null,
      country_code,
      city: city || null,
      market_name: market_name || null,
      price: numPrice,
      currency_code,
      submitted_by: ip,
      photo_url: photo_url || null,
      status,
      upvotes: 0,
      downvotes: 0
    }).select();

    if (error) {
      console.error("AfroPrices submit error:", error);
      return {
        statusCode: 500, headers,
        body: JSON.stringify({ success: false, error: "Failed to save submission" })
      };
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true,
        status,
        message: status === "verified"
          ? "Your price has been verified and published. Thank you!"
          : "Your price has been submitted and is awaiting verification. Thank you!",
        id: data?.[0]?.id
      })
    };
  } catch (err) {
    console.error("AfroPrices submit error:", err);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ success: false, error: "Server error" })
    };
  }
};
