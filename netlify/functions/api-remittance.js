// netlify/functions/api-remittance.js
// GET /api/remittance?send=US&receive=NG   → all providers for corridor
// GET /api/remittance?provider=Wise        → all corridors for provider
// GET /api/remittance                      → all active rows
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const { getAllowedOrigin } = require('./utils/cors');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
  };

  const p = event.queryStringParameters || {};
  let url = SUPABASE_URL + '/rest/v1/remittance_providers?select=*&active=eq.true&order=provider.asc,send_country.asc,receive_country.asc';
  if (p.send)     url += '&send_country=eq.'    + encodeURIComponent(p.send.toUpperCase());
  if (p.receive)  url += '&receive_country=eq.' + encodeURIComponent(p.receive.toUpperCase());
  if (p.provider) url += '&provider=eq.'        + encodeURIComponent(p.provider);

  try {
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } });
    const data = res.ok ? await res.json() : [];
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ ok: true, count: data.length, providers: data }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
