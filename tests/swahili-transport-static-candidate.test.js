const assert = require('assert');
const fs = require('fs');
const path = require('path');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');
const acceptance = require('../data/audits/swahili-free-app-acceptance.json');
const { assertLifecycle } = require('./support/swahili-acceptance-lifecycle');

const root = path.join(__dirname, '..');
const inventory = require('../reports/swahili-free-app-parity-inventory.json');
const sourceStatus = require('../data/transport/source-status.json');
const rows = (inventory.rows || inventory.apps || inventory.inventory || [])
  .filter((row) => row.categoryKey === 'transport');
const expectedRoutes = [
  ['car-import-cost', '/sw/zana/gharama-kuagiza-gari/'],
  ['car-price-intelligence', '/sw/zana/bei-na-akili-ya-gari/'],
  ['ride-fare', '/sw/zana/nauli-za-ride-hailing/'],
  ['boda-income', '/sw/zana/mapato-ya-boda-boda/'],
  ['matatu-fare', '/sw/zana/nauli-za-matatu-danfo-trotro/'],
  ['delivery-cost', '/sw/zana/gharama-ya-delivery/'],
  ['car-loan-vs-cash', '/sw/zana/mkopo-wa-gari-dhidi-ya-fedha-taslimu/'],
  ['vehicle-registration', '/sw/zana/usajili-na-nyaraka-za-gari/'],
  ['roadworthiness', '/sw/zana/ukaguzi-wa-roadworthiness/'],
  ['vehicle-depreciation', '/sw/zana/kushuka-thamani-ya-gari/'],
  ['fleet-fuel', '/sw/zana/gharama-mafuta-ya-fleet/'],
  ['last-mile-delivery', '/sw/zana/gharama-last-mile-delivery/'],
  ['parking-fee', '/sw/zana/ada-za-maegesho/'],
  ['route-cost', '/sw/zana/gharama-njia-za-logistics/'],
  ['toll-calc', '/sw/zana/ada-za-toll/'],
  ['truck-load', '/sw/zana/kupakia-lori/'],
  ['vehicle-operating-cost', '/sw/zana/gharama-uendeshaji-gari/'],
  ['vehicle-tracker-roi', '/sw/zana/faida-ya-tracker-ya-gari/']
];
const expectedIds = expectedRoutes.map(([id]) => id);

assert.strictEqual(rows.length, 18, 'Transport inventory remains exactly 18 English free apps');
assert.deepStrictEqual(rows.map((row) => row.englishId), expectedIds, 'Transport inventory order and ownership stay exact');
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: expectedRoutes.map(([id, swahiliRoute]) => ({ id, swahiliRoute })) });

const html = fs.readFileSync(path.join(root, 'sw/zana/gharama-kuagiza-gari/index.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'assets/js/pages/swahili-car-import-cost.js'), 'utf8');
assert.match(html, /<html\b[^>]*\blang=["']sw["'][^>]*>/i, 'candidate declares Swahili');
assert.match(html, /data-sw-transport-parity="car-import-cost"/, 'candidate declares exact English owner');
assert.match(html, /id="carImportApp"/, 'candidate mounts the production car-import application');
assert.match(html, /\/assets\/js\/lib\/car-import-cost-engine\.js/, 'candidate reuses the shared DOM-free engine');
assert.match(html, /\/assets\/js\/car-import-cost\.js/, 'candidate reuses the English production controller');
assert.match(html, /\/assets\/js\/car-import-cost-enhancements\.js/, 'candidate preserves production exports and reset behavior');
assert.match(html, /\/assets\/js\/pages\/swahili-car-import-cost\.js/, 'candidate loads the scoped Swahili presentation boundary');
assert.doesNotMatch(html, /function\s+swtCalc|onclick="swtCalc/, 'generic one-formula Swahili shell is retired');
assert.match(html, /rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/gharama-kuagiza-gari\/"/, 'canonical is route-correct');
assert.match(html, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/car-import-cost\/"/, 'English reciprocal target is declared');
assert.match(html, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/cout-importation-voiture\/"/, 'French peer is declared');
assert.match(html, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/gharama-kuagiza-gari\/"/, 'Swahili self-reference is declared');
assert.match(html, /assets\/img\/tools\/car-import-cost\.webp/, 'canonical artwork is used in metadata and page content');
assert.match(html, /data-transport-source-review="2026-08-03"/, 'visible source-review boundary is dated');

assert.match(runtime, /Storage\.prototype\.setItem/, 'last-input persistence is explicitly bounded');
assert.match(runtime, /carImportCostLastInput/, 'sensitive route-state key is removed and blocked');
assert.match(runtime, /event\.stopImmediatePropagation\(\)/, 'invalid and network-capable actions are intercepted before production handlers');
assert.match(runtime, /#carImportAskAi/, 'AI action is converted to deterministic local advice');
assert.match(runtime, /location\.origin \+ route/, 'sharing is route-only');
assert.match(runtime, /clearResult/, 'stale or invalid outputs are cleared');
assert.match(runtime, /input\[type="number"\]/, 'numeric inputs receive non-negative constraints');

const sourceRows = new Map((sourceStatus.tools || []).map((tool) => [tool.id, tool]));
expectedIds.forEach((id) => assert.ok(sourceRows.has(id), `${id} is governed by the Transport source ledger`));
assert.strictEqual(sourceRows.get('car-import-cost').status, 'changed', 'candidate remains visibly review-gated after source changes');

expectedIds.forEach((id) => {
  assert.ok(
    fs.existsSync(path.join(root, `assets/img/tools/${id}.webp`))
      || fs.existsSync(path.join(root, `assets/img/tools/${id}.svg`)),
    `${id} has canonical artwork`
  );
});

console.log('swahili-transport-static-candidate.test.js passed');
