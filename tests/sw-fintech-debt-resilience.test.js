'use strict';

const assert = require('assert');
const fs = require('fs');
const childProcess = require('child_process');

const inventory = JSON.parse(fs.readFileSync('reports/swahili-free-app-parity-inventory.json', 'utf8'));
const ledger = JSON.parse(fs.readFileSync('data/audits/swahili-free-app-acceptance.json', 'utf8'));
const excludedTrade = new Set(['proforma-invoice','packing-list','bol-generator','customs-time','shipping-weight','cross-border-data']);
const scope = new Set(['small-business','fintech','transport','trade']);
const scoped = inventory.rows.filter((row) => scope.has(row.categoryKey));
assert.strictEqual(scoped.length, 99);
assert.strictEqual(scoped.filter((row) => excludedTrade.has(row.englishId)).length, 6);
assert.strictEqual(scoped.filter((row) => !excludedTrade.has(row.englishId)).length, 93);

const apps = [
  ['emergency-fund', 'sw/zana/mfuko-wa-dharura/index.html', 'emergency-fund.js'],
  ['debt-snowball', 'sw/zana/mpango-wa-kulipa-madeni/index.html', 'debt-snowball.js'],
  ['loan-consolidation', 'sw/zana/unganisha-mikopo/index.html', 'loan-consolidation.js']
];
for (const [id, file, controller] of apps) {
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('scripts/build-sw-fintech-debt-resilience.js'));
  assert(html.includes(`/assets/js/pages/fintech-shared-controllers/${controller}`));
  assert(html.includes(`data-ai-candidate-tool-id="${id}"`));
  assert(html.includes(`href="/sw/ai/?tool=${id}"`));
  assert(html.includes('Udhamini au ushirika'));
  assert(html.includes('Hakuna data inayotumwa kwa seva'));
  assert(!/<iframe\b/i.test(html));
  assert(!/English fallback|tumia zana ya Kiingereza/i.test(html));
  assert(!/(Pakua|Download|CSV|PDF|Nakili)/i.test(html), `${id} must not advertise an unproved export`);
  assert(!ledger.entries.some((entry) => entry.englishId === id && entry.status === 'accepted'), `${id} must remain fail-closed centrally`);
}

childProcess.execFileSync(process.execPath, ['scripts/build-sw-fintech-debt-resilience.js'], {stdio:'inherit'});
console.log('Swahili Fintech debt-resilience family: 99/6/93 inventory and 3/3 route contracts passed');
