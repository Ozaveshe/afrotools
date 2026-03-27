// netlify/functions/conflict-acled.js
// ACLED API proxy + normalize
// Gracefully degrades if ACLED_API_KEY not set or === 'PENDING'
// Called by conflict-sync.js

const ACLED_API_KEY = process.env.ACLED_API_KEY;
const ACLED_EMAIL = process.env.ACLED_EMAIL || 'hello@afrotools.africa';
const ACLED_BASE = 'https://api.acleddata.com/acled/read';

// All African ISO codes (3-letter as ACLED uses)
const ACLED_COUNTRIES = [
  'DZA','AGO','BEN','BWA','BFA','BDI','CMR','CPV','CAF','TCD',
  'COM','COD','COG','DJI','EGY','GNQ','ERI','ETH','GAB','GMB',
  'GHA','GIN','GNB','CIV','KEN','LSO','LBR','LBY','MDG','MWI',
  'MLI','MRT','MUS','MAR','MOZ','NAM','NER','NGA','RWA','STP',
  'SEN','SLE','SOM','ZAF','SSD','SDN','SWZ','TZA','TGO','TUN',
  'UGA','ZMB','ZWE'
].join('|');

// Normalize ACLED event to ac_events schema
function normalizeAcledEvent(raw) {
  return {
    event_date: raw.event_date,
    event_type: normalizeEventType(raw.event_type),
    sub_event_type: raw.sub_event_type || null,
    location: raw.location || null,
    country: raw.country || null,
    lat: raw.latitude ? parseFloat(raw.latitude) : null,
    lng: raw.longitude ? parseFloat(raw.longitude) : null,
    actor1: raw.actor1 || null,
    actor2: raw.actor2 || null,
    fatalities: parseInt(raw.fatalities, 10) || 0,
    notes: raw.notes || null,
    source: raw.source || 'ACLED',
    acled_event_id: String(raw.data_id)
  };
}

function normalizeEventType(type) {
  if (!type) return 'strategic_development';
  var t = type.toLowerCase();
  if (t.includes('battle')) return 'battle';
  if (t.includes('airstrike') || t.includes('air/drone')) return 'airstrike';
  if (t.includes('explosion') || t.includes('remote')) return 'explosion_remote';
  if (t.includes('protest')) return 'protest';
  if (t.includes('riot')) return 'riot';
  if (t.includes('civilian')) return 'violence_against_civilians';
  if (t.includes('agreement') || t.includes('peace')) return 'agreement';
  if (t.includes('displacement')) return 'displacement_event';
  return 'strategic_development';
}

exports.handler = async function (event) {
  var headers = { 'Content-Type': 'application/json' };

  // Check API key
  if (!ACLED_API_KEY || ACLED_API_KEY === 'PENDING' || ACLED_API_KEY === '') {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: 'ACLED_API_KEY not configured',
        message: 'Register at https://acleddata.com/register/ to get an API key. Set ACLED_API_KEY and ACLED_EMAIL in Netlify environment variables.',
        data: []
      })
    };
  }

  var params = event.queryStringParameters || {};
  var daysBack = parseInt(params.days, 10) || 90;
  var fromDate = new Date(Date.now() - daysBack * 24 * 3600 * 1000).toISOString().slice(0,10);

  try {
    var url = `${ACLED_BASE}?key=${ACLED_API_KEY}&email=${ACLED_EMAIL}` +
      `&region=1|2|3|4|5` + // African regions in ACLED
      `&event_date=${fromDate}|${new Date().toISOString().slice(0,10)}` +
      `&event_date_where=BETWEEN` +
      `&fields=data_id|event_date|event_type|sub_event_type|country|location|latitude|longitude|actor1|actor2|fatalities|notes|source` +
      `&limit=1000`;

    var res = await fetch(url);
    if (!res.ok) {
      throw new Error(`ACLED API returned ${res.status}: ${res.statusText}`);
    }

    var json = await res.json();
    var raw = json.data || [];
    var normalized = raw.map(normalizeAcledEvent);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        data: normalized,
        meta: { count: normalized.length, source: 'ACLED', from_date: fromDate }
      })
    };

  } catch (err) {
    console.error('[conflict-acled] Error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'ACLED fetch failed', detail: err.message, data: [] })
    };
  }
};
