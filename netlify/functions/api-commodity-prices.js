// netlify/functions/api-commodity-prices.js
// GET /api/commodity-prices?commodity=maize   → prices for that commodity
// GET /api/commodity-prices                    → all rows + benchmarks
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const { getAllowedOrigin } = require('./utils/cors');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
  };

  const commodity = event.queryStringParameters && event.queryStringParameters.commodity;
  let url = SUPABASE_URL + '/rest/v1/commodity_prices?select=*&order=country_name.asc';
  if (commodity) url += '&commodity=eq.' + encodeURIComponent(commodity);

  try {
    const [pricesRes, benchRes] = await Promise.all([
      fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } }),
      fetch(SUPABASE_URL + '/rest/v1/commodity_benchmarks?select=*', {
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
      })
    ]);

    const prices     = pricesRes.ok     ? await pricesRes.json()  : [];
    const benchmarks = benchRes.ok      ? await benchRes.json()   : [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        lastUpdated: prices.length ? prices.reduce((a, b) => a.updated_at > b.updated_at ? a : b).updated_at : null,
        prices,
        benchmarks,
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
