// netlify/functions/api-wages.js
// GET /api/wages?country=NG   → single country
// GET /api/wages              → all 54 countries
const { getAllowedOrigin } = require('./utils/cors');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=172800', // 24h — wages change annually
  };

  const country = event.queryStringParameters && event.queryStringParameters.country;
  let url = SUPABASE_URL + '/rest/v1/minimum_wages?select=*&order=country_name.asc';
  if (country) url += '&country_code=eq.' + encodeURIComponent(country.toUpperCase());

  try {
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
    const data = res.ok ? await res.json() : [];
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ ok: true, count: data.length, wages: data }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
