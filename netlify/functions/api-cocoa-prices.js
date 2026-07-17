// netlify/functions/api-cocoa-prices.js
// GET /api/cocoa-prices
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const { getAllowedOrigin } = require('./utils/cors');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
  };

  try {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/cocoa_prices?select=*&order=country_name.asc',
      { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } }
    );
    const data = res.ok ? await res.json() : [];
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ ok: true, count: data.length, prices: data }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
