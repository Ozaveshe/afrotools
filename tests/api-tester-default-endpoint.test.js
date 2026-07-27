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
assert.match(html, /contains:\s*'operational'/);
assert.match(html, /jsonpath:\s*'\$\.status'/);
assert.match(html, /same-origin AfroTools status endpoint/);
assert.doesNotMatch(html, /jsonplaceholder\.typicode\.com|id:\s*'jsonplaceholder'/i);

console.log('api tester default endpoint tests passed');
