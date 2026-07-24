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
  const requestedFreshness = parseInt(params.freshness_days, 10);
  const freshnessDays = [90, 180, 365].includes(requestedFreshness) ? requestedFreshness : 365;
  const asOf = new Date();
  const freshAfter = new Date(asOf.getTime() - freshnessDays * 86400000).toISOString();

  const safeFields = 'country_code,city,observed_at,role_title,role_category,industry,experience_level,company_size,sector,compensation_period,source_type,confidence_score,verified_at';
  let reportsPath = 'salary_reports?select=' + safeFields + '&is_public=eq.true&verification_state=eq.verified&review_status=eq.approved&confidence_score=gte.0.6&observed_at=gte.' + encodeURIComponent(freshAfter) + '&order=observed_at.desc&limit=' + limit;
  if (country) reportsPath += '&country_code=eq.' + encodeURIComponent(country);
  if (city) reportsPath += '&city=eq.' + encodeURIComponent(city);
  if (roleCategory) reportsPath += '&role_category=eq.' + encodeURIComponent(roleCategory);
  if (experienceLevel) reportsPath += '&experience_level=eq.' + encodeURIComponent(experienceLevel);

  const reports = await queryRows(reportsPath);

  return jsonResponse(200, {
    ok: true,
    count: Array.isArray(reports) ? reports.length : 0,
    filters: {
      country: country || null,
      city: city || null,
      role_category: roleCategory || null,
      experience_level: experienceLevel || null,
      freshness_days: freshnessDays
    },
    as_of: asOf.toISOString(),
    freshness_days: freshnessDays,
    privacy: 'Public approved metadata only. User ids, proof URLs, photos, payloads, contribution ids and salary amounts are withheld.',
    reports: Array.isArray(reports) ? reports : [],
    amounts_withheld: true,
    amount_note: 'Salary amounts are withheld because the current report schema does not preserve a required row-level currency code.',
    benchmarks: [],
    benchmarks_withheld: true,
    benchmark_note: 'Aggregated benchmark rows are withheld until row-level provenance and collection-method metadata are available.'
  }, {
    ...headers,
    'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800'
  });
};
