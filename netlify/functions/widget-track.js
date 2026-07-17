/**
 * AfroTools — Embeddable widget impression beacon
 *
 * Served at /widgets/track.gif (see _redirects). The embed loader
 * (widgets/embed.js) fires an <img> beacon on every widget load:
 *
 *   https://afrotools.com/widgets/track.gif?w=<widgetId>&r=<referrer>&t=<ts>
 *
 * The request is a cross-origin image load from third-party host pages, so
 * CORS does not apply — we only need to return a valid 1x1 GIF quickly.
 * Impression counts are recorded best-effort into Netlify Blobs and are never
 * allowed to delay or fail the image response.
 *
 * Admin read:
 *   GET /widgets/track.gif?summary=YYYY-MM-DD   (header: x-admin-secret)
 *   -> { date, totals: { widgetId: count }, generatedAt }
 */

const { getStore } = require('@netlify/blobs');

// 1x1 transparent GIF (43 bytes)
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

const PIXEL_HEADERS = {
  'Content-Type': 'image/gif',
  'Content-Length': String(PIXEL.length),
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Access-Control-Allow-Origin': '*',
  'Timing-Allow-Origin': '*',
};

function pixelResponse() {
  return {
    statusCode: 200,
    headers: PIXEL_HEADERS,
    body: PIXEL.toString('base64'),
    isBase64Encoded: true,
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Keep widget ids to a safe, bounded shape.
function cleanWidgetId(raw) {
  var id = String(raw || '').trim().toLowerCase();
  if (!id) return null;
  if (id.length > 64) id = id.slice(0, 64);
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) return null;
  return id;
}

function refHost(raw) {
  if (!raw) return 'direct';
  try {
    var h = new URL(String(raw)).hostname.replace(/^www\./, '');
    return h ? h.slice(0, 80) : 'direct';
  } catch (e) {
    return 'unknown';
  }
}

// Best-effort per-widget-per-day increment. Blobs has no atomic add, so a
// read-modify-write may undercount slightly under heavy concurrency — that is
// acceptable for impression analytics.
async function record(widgetId, host) {
  try {
    var store = getStore('widget-analytics');
    var key = 'daily/' + today() + '/' + widgetId;
    var current = null;
    try {
      current = await store.get(key, { type: 'json' });
    } catch (e) {
      current = null;
    }
    if (!current || typeof current !== 'object') {
      current = { widgetId: widgetId, count: 0, refs: {} };
    }
    current.count = (Number(current.count) || 0) + 1;
    if (host) {
      var refs = current.refs || {};
      // Cap the referrer map so a single hot widget cannot grow unbounded.
      if (refs[host] || Object.keys(refs).length < 200) {
        refs[host] = (Number(refs[host]) || 0) + 1;
      }
      current.refs = refs;
    }
    current.updatedAt = new Date().toISOString();
    await store.setJSON(key, current);
  } catch (e) {
    // Analytics must never break the beacon.
  }
}

async function summarize(date) {
  var store = getStore('widget-analytics');
  var prefix = 'daily/' + date + '/';
  var totals = {};
  var listed = await store.list({ prefix: prefix });
  var blobs = (listed && listed.blobs) || [];
  for (var i = 0; i < blobs.length; i++) {
    var rec = null;
    try {
      rec = await store.get(blobs[i].key, { type: 'json' });
    } catch (e) {
      rec = null;
    }
    if (rec && rec.widgetId) totals[rec.widgetId] = Number(rec.count) || 0;
  }
  return { date: date, widgets: Object.keys(totals).length, totals: totals, generatedAt: new Date().toISOString() };
}

exports.handler = async function (event) {
  var params = event.queryStringParameters || {};

  // --- Admin summary read ---
  if (params.summary) {
    var headers = event.headers || {};
    var secret = headers['x-admin-secret'] || headers['X-Admin-Secret'];
    var expected = process.env.ADMIN_SECRET;
    if (!expected || secret !== expected) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }
    var date = /^\d{4}-\d{2}-\d{2}$/.test(params.summary) ? params.summary : today();
    try {
      var data = await summarize(date);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(data),
      };
    } catch (e) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: 'summary_failed', message: e.message }),
      };
    }
  }

  // --- Impression beacon (always returns the pixel) ---
  var widgetId = cleanWidgetId(params.w);
  if (widgetId) {
    var host = refHost(params.r);
    // Await so the write completes within the invocation, but never throw.
    await record(widgetId, host);
  }
  return pixelResponse();
};
