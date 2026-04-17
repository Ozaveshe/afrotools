const { validateApiKey } = require('./_shared/api-auth');
const { buildHeaders, jsonResponse, queryRows } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  const headers = buildHeaders(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' }, headers);

  const auth = await validateApiKey(event, 'salary-intelligence');
  if (auth.error) return jsonResponse(auth.status || 401, { error: auth.error }, headers);

  const params = event.queryStringParameters || {};
  const country = (params.country || '').toUpperCase();
  const city = params.city || '';
  const roleCategory = params.role_category || '';
  const experienceLevel = params.experience_level || '';
  const limit = Math.min(parseInt(params.limit, 10) || 40, 100);

  let reportsPath = 'salary_reports?select=*&is_public=eq.true&order=observed_at.desc&limit=' + limit;
  if (country) reportsPath += '&country_code=eq.' + encodeURIComponent(country);
  if (city) reportsPath += '&city=eq.' + encodeURIComponent(city);
  if (roleCategory) reportsPath += '&role_category=eq.' + encodeURIComponent(roleCategory);
  if (experienceLevel) reportsPath += '&experience_level=eq.' + encodeURIComponent(experienceLevel);

  let benchmarksPath = 'salary_benchmarks?select=*&order=updated_at.desc&limit=20';
  if (country) benchmarksPath += '&country_code=eq.' + encodeURIComponent(country);
  if (roleCategory) benchmarksPath += '&role_category=eq.' + encodeURIComponent(roleCategory);
  if (experienceLevel) benchmarksPath += '&experience_level=eq.' + encodeURIComponent(experienceLevel);

  const [reports, benchmarks] = await Promise.all([
    queryRows(reportsPath),
    queryRows(benchmarksPath)
  ]);

  return jsonResponse(200, {
    ok: true,
    count: Array.isArray(reports) ? reports.length : 0,
    filters: {
      country: country || null,
      city: city || null,
      role_category: roleCategory || null,
      experience_level: experienceLevel || null
    },
    reports: Array.isArray(reports) ? reports : [],
    benchmarks: Array.isArray(benchmarks) ? benchmarks : []
  }, {
    ...headers,
    'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800'
  });
};
