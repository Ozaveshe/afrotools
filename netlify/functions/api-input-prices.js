// netlify/functions/api-input-prices.js
// GET /api/input-prices?country=NG&type=fertilizer
// GET /api/input-prices?country=NG   → all types for that country
// GET /api/input-prices              → all rows
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const { getAllowedOrigin } = require('./utils/cors');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=7200, stale-while-revalidate=14400',
  };

  const p = event.queryStringParameters || {};
  let url = SUPABASE_URL + '/rest/v1/input_prices?select=*&order=country_name.asc,input_type.asc,input_name.asc';
  if (p.country) url += '&country_code=eq.' + encodeURIComponent(p.country.toUpperCase());
  if (p.type)    url += '&input_type=eq.'    + encodeURIComponent(p.type.toLowerCase());

  try {
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
    const data = res.ok ? await res.json() : [];
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ ok: true, count: data.length, inputs: data }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
