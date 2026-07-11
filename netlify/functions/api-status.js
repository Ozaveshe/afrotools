const contract = require('../../data/api-public-contract.json');
const { getAllowedOrigin } = require('./utils/cors');

const CORS = {
  'Access-Control-Allow-Origin': 'https://afrotools.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=60, s-maxage=300'
};

function json(statusCode, body) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}

exports.handler = async function (event) {
  CORS['Access-Control-Allow-Origin'] = getAllowedOrigin(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  return json(200, {
    status: 'operational',
    api: contract.api_name,
    current_version: contract.current_version,
    base_url: contract.canonical_base_url,
    free_tier: contract.free_tier,
    sandbox: contract.sandbox_tier,
    service_integrations: contract.service_integrations,
    endpoints: contract.endpoints,
    deprecation_policy: contract.deprecation_policy,
    changelog_url: contract.changelog_url,
    checked_at: new Date().toISOString()
  });
};
