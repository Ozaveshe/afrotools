'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { digestHtmlFormulaSource } = require('../scripts/lib/calculation-quality');

// Each of these assets was traced in the original failed formula records.
// Formula registry hashes and golden fixtures stay unchanged.
const reviewed = [
  'calculator.min.css', 'paye-tool.css', 'country-tax-page-ui-refresh.css',
  'theme-dark.min.css', 'burundi-vat-vip.css', 'cbk-rates-vip.css',
  'cnps-guide-vip.css', 'cnps-guide-workspace.css', 'hr-payroll.css',
  'hr-payroll-focus.css', 'hr-payroll-ui-refinement.css', 'print.css',
  'french-finance-mobile-fixes.css', 'etims-guide-vip.css', 'ghana-vat-vip.css',
  'guinea-vat-vip.css', 'sars-efiling-vip.css', 'sudan-vat-vip.css',
  'togo-vat-vip.css', 'tunisia-vat-vip.css', 'transfer-pricing-vip.css',
  'paye-calculation-sync.css', 'za-gepf-vip.css', 'za-gepf-sw.css',
  'za-transfer-duty-vip.css', 'za-transfer-duty-sw.css',
  'zambia-vat-vip.css', 'zimbabwe-vat-vip.css',
];

function page(asset, version = '11111111', rate = '0.15') {
  return '<html><body><script>const rate = ' + rate + ';\n' +
    'function calculate(amount) { return amount * rate; }\n' +
    'const printable = \'<link rel="stylesheet" href="/assets/css/' +
    asset + '?v=' + version + '"><input id="salary"><script src="/engine.js"><\\/script>\';\n' +
    '</script></body></html>';
}

for (const asset of reviewed) {
  test(asset + ' cache keys preserve frozen formulas without masking workflow changes', () => {
    const original = page(asset);
    const digest = digestHtmlFormulaSource(original);
    assert.equal(digestHtmlFormulaSource(page(asset, '22222222')), digest);
    for (const changed of [
      page(asset, '11111111', '0.16'),
      original.replace(asset, 'other-' + asset),
      original.replace('?v=', '?preview=1&v='),
      original.replace('11111111', '111111111'),
      original.replace('11111111', 'not-a-version'),
      original.replace('id="salary"', 'id="income"'),
      original.replace('/engine.js', '/other-engine.js'),
      original.replace('amount * rate', 'amount + rate'),
    ]) assert.notEqual(digestHtmlFormulaSource(changed), digest);
  });
}

test('unreviewed stylesheet cache keys remain protected', () => {
  assert.notEqual(digestHtmlFormulaSource(page('unreviewed.css', '11111111')),
    digestHtmlFormulaSource(page('unreviewed.css', '22222222')));
});
