const { validateApiKey } = require('./_shared/api-auth');
const { buildHeaders, jsonResponse, queryRows } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  const headers = buildHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' }, headers);

  const auth = await validateApiKey(event, 'staple-baskets');
  if (auth.error) return jsonResponse(auth.status || 401, { error: auth.error }, headers);

  const params = event.queryStringParameters || {};
  const country = (params.country || '').toUpperCase();
  const city = params.city || '';
  const limit = Math.min(parseInt(params.limit, 10) || 30, 80);

  let snapshotsPath = 'market_basket_snapshots?select=*&is_public=eq.true&order=observed_at.desc&limit=' + limit;
  if (country) snapshotsPath += '&country_code=eq.' + encodeURIComponent(country);
  if (city) snapshotsPath += '&city=eq.' + encodeURIComponent(city);

  let pricesPath = 'community_prices?select=*&status=eq.confirmed&order=created_at.desc&limit=' + limit;
  if (country) pricesPath += '&country_code=eq.' + encodeURIComponent(country);
  if (city) pricesPath += '&city=eq.' + encodeURIComponent(city);

  let templatesPath = 'market_basket_templates?select=*&order=updated_at.desc&limit=20';
  if (country) templatesPath += '&country_code=eq.' + encodeURIComponent(country);
  if (city) templatesPath += '&city=eq.' + encodeURIComponent(city);

  const [snapshots, recentPrices, templates] = await Promise.all([
    queryRows(snapshotsPath),
    queryRows(pricesPath),
    queryRows(templatesPath)
  ]);

  return jsonResponse(200, {
    ok: true,
    count: Array.isArray(snapshots) ? snapshots.length : 0,
    filters: {
      country: country || null,
      city: city || null
    },
    snapshots: Array.isArray(snapshots) ? snapshots : [],
    recent_prices: Array.isArray(recentPrices) ? recentPrices : [],
    templates: Array.isArray(templates) ? templates : []
  }, {
    ...headers,
    'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800'
  });
};
