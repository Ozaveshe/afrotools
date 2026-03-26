// netlify/functions/api-coffee-prices.js
// GET /api/coffee-prices?country=ET   → grades for that country
// GET /api/coffee-prices              → all rows
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
  };

  const country = event.queryStringParameters && event.queryStringParameters.country;
  let url = SUPABASE_URL + '/rest/v1/coffee_prices?select=*&order=country_name.asc,grade.asc';
  if (country) url += '&country_code=eq.' + encodeURIComponent(country.toUpperCase());

  try {
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
    const data = res.ok ? await res.json() : [];
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ ok: true, count: data.length, prices: data }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
