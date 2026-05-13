const assert = require('assert');
const apiTax = require('../netlify/functions/api-tax');
const engines = require('../netlify/functions/_engines');

async function main() {
  assert.ok(engines.get('NG'), 'Nigeria PAYE engine should load through netlify/functions/_engines');

  const response = await apiTax.handler({
    httpMethod: 'GET',
    path: '/api/v1/tax/nigeria/paye',
    headers: { 'x-api-key': 'afro_test_tax_route_smoke' },
    queryStringParameters: { grossAnnual: '7200000' }
  });

  assert.strictEqual(response.statusCode, 200, response.body);
  const body = JSON.parse(response.body);
  assert.strictEqual(body.status, 'success');
  assert.ok(body.result && Number.isFinite(body.result.netAnnual), 'PAYE route should return computed numbers');
  assert.ok(body.tax && Number.isFinite(body.tax.netTax), 'PAYE route should return tax numbers');

  console.log('API tax routing smoke passed.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
