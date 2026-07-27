'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('live-closure category surfaces opt into targeted dark-mode ownership', () => {
  assert.match(read('mining/index.html'), /<body class="mining-ui-refresh top-level-page-ui-refresh">/);
  assert.match(read('tools/mining-royalty/index.html'), /<body class="mining-ui-refresh top-level-page-ui-refresh">/);
  assert.match(read('sports/index.html'), /<body class="sports-ui-refresh top-level-page-ui-refresh">/);

  const darkCss = read('assets/css/theme-dark.css');
  const darkMin = read('assets/css/theme-dark.min.css');
  for (const selector of ['body.mining-ui-refresh', 'body.sports-ui-refresh', 'body.energy-focus']) {
    assert.ok(darkCss.includes(selector), `${selector} must have readable-source dark ownership`);
    assert.ok(darkMin.includes(selector), `${selector} must be present in the served minified stylesheet`);
  }
});

test('custom Zakat shell loads the shared manual/system theme controller', () => {
  const html = read('tools/zakat-calculator/index.html');
  assert.match(html, /<script src="\/assets\/js\/lib\/dark-mode\.js" defer><\/script>/);
  assert.ok(
    html.indexOf('/assets/js/lib/dark-mode.js') < html.indexOf('/assets/js/lazy-analytics.js'),
    'theme control should initialize before deferred analytics'
  );
});
