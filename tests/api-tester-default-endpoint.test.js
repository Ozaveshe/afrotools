const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/api-tester/index.html'), 'utf8');

assert.match(html, /id="url" value="" data-default-path="\/api\/status"/);
assert.match(html, /var DEFAULT_STATUS_URL = location\.origin \+ '\/api\/status'/);
assert.match(html, /id:\s*'afrotools-status'/);
assert.match(html, /url:\s*DEFAULT_STATUS_URL/);
assert.match(html, /\$\('url'\)\.value = DEFAULT_STATUS_URL/);
assert.match(html, /jsonpath:\s*'\$\.status'/);
assert.match(html, /same-origin AfroTools status endpoint/);
assert.doesNotMatch(html, /jsonplaceholder\.typicode\.com|id:\s*'jsonplaceholder'/i);

async function verifyDefaultStatusContract() {
  const { handler } = require('../netlify/functions/api-status');
  const response = await handler({ httpMethod: 'GET', headers: { origin: 'https://afrotools.com' } }, {});
  assert.strictEqual(response.statusCode, 200);
  const payload = JSON.parse(response.body);
  const visibleDefault = html.match(/id="test-contains"\s+value="([^"]+)"/);
  const presetDefault = html.match(/contains:\s*'([^']+)'/);
  assert.ok(visibleDefault && presetDefault, 'Both visible and preset defaults exist');
  assert.strictEqual(visibleDefault[1], payload.status);
  assert.strictEqual(presetDefault[1], payload.status);
  assert.strictEqual(payload.scope, 'status_endpoint');
  assert.strictEqual(payload.dependency_status, 'not_checked');
  console.log('api tester default endpoint and actual status-handler contract tests passed');
}

verifyDefaultStatusContract().catch(error => { console.error(error); process.exitCode = 1; });
