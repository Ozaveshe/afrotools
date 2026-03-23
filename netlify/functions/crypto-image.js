/**
 * Crypto Coin Image Proxy
 *
 * Proxies CoinGecko coin images to avoid 503 hotlink blocking.
 * GET /.netlify/functions/crypto-image?url=https://coin-images.coingecko.com/...
 *
 * Caches aggressively (7 days) since coin logos rarely change.
 */

const ALLOWED_HOSTS = [
  'coin-images.coingecko.com',
  'assets.coingecko.com',
];

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  const imageUrl = (event.queryStringParameters || {}).url;
  if (!imageUrl) {
    return { statusCode: 400, headers: corsHeaders(), body: 'Missing url parameter' };
  }

  // Validate URL is from allowed hosts only
  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: 'Invalid URL' };
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return { statusCode: 403, headers: corsHeaders(), body: 'Host not allowed' };
  }

  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'AfroTools/1.0',
        'Accept': 'image/*',
      },
    });

    if (!res.ok) {
      return { statusCode: res.status, headers: corsHeaders(), body: `Upstream error: ${res.status}` };
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/png';

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800', // 7 days
      },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 502, headers: corsHeaders(), body: `Proxy error: ${err.message}` };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}
