'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const analyticsOwner = require('../scripts/inject-analytics-loader');
const engine = require('../assets/js/engines/inflation-scenario.js');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const scope = JSON.parse(read('data/localization/sw-finance-inflation-scope.json'));
const owners = JSON.parse(read('data/localization/sw-finance-remainder-native-owners.json'));
const owner = owners.rows.find((row) => row.englishId === 'inflation-calc');
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function inputs(html) {
  return [...html.matchAll(/<input\b[^>]*\bid="([^"]+)"[^>]*>/gi)].map((match) => {
    const tag = match[0];
    const attr = (name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] ?? null;
    return { id:match[1], type:attr('type'), min:attr('min'), max:attr('max'), step:attr('step'), value:attr('value'), maxlength:attr('maxlength'), required:/\brequired\b/i.test(tag) };
  });
}

test('scope owns exactly inflation-calc and excludes every adjacent lane', () => {
  assert.equal(scope.baseSha, '8354e321ff34caf60a33a3393cd0dcddfb00c023');
  assert.deepEqual(scope.ownedRows.map((row) => row.englishId), ['inflation-calc']);
  assert.deepEqual(scope.excludedSeparateCandidateIds, ['savings-goal', 'car-loan', 'bank-charges', 'compound-interest', 'investment-return']);
  assert.equal(scope.excludedPayeRepairIds.length, 26);
  assert.equal(new Set(scope.excludedPayeRepairIds).size, 26);
  assert.deepEqual(scope.excludedCategories, ['hr-payroll', 'personal-finance', 'vat']);
});

test('owner binds native page to the exact DOM-free English engine and four exports', () => {
  assert.ok(owner);
  assert.equal(owner.engineOwner, 'assets/js/engines/inflation-scenario.js');
  assert.equal(owner.controllerOwner, 'assets/js/pages/inflation-scenario-vip.js');
  assert.deepEqual(owner.advertisedNativeFormats, ['clipboard-text', 'csv', 'json', 'pdf']);
  assert.equal(owner.sharedAiRoutingOwner, 'coordinator');
  for (const file of [owner.sourceOwner, owner.engineOwner, owner.controllerOwner]) assert.equal(fs.existsSync(path.join(root, file)), true, file);
});

test('shared engine proves exact, deflation, fractional-period and evidence boundaries', () => {
  const standard = engine.calculate({ currency:'KES', amount:1000, annualRate:10, years:2, sourceLabel:'KNBS CPI Julai 2026', sourceDate:'2026-07-20' }, '2026-08-02');
  assert.equal(standard.ok, true);
  assert.ok(Math.abs(standard.priceEquivalent - 1210) < 1e-9);
  assert.ok(Math.abs(standard.purchasingPower - 826.4462809917354) < 1e-9);
  assert.ok(Math.abs(standard.requiredIncrease - 210) < 1e-9);
  assert.equal(standard.timeline.length, 3);
  const deflation = engine.calculate({ currency:'KES', amount:1000, annualRate:-10, years:1, sourceLabel:'Official release', sourceDate:'2026-07-20' }, '2026-08-02');
  assert.equal(deflation.ok, true);
  assert.ok(Math.abs(deflation.priceEquivalent - 900) < 1e-9);
  assert.ok(Math.abs(deflation.purchasingPower - 1111.111111111111) < 1e-9);
  const fractional = engine.calculate({ currency:'KES', amount:1000, annualRate:10, years:1.5, sourceLabel:'Official release', sourceDate:'2026-07-20' }, '2026-08-02');
  assert.equal(fractional.timeline.at(-1).year, 1.5);
  assert.equal(engine.calculate({ currency:'KES', amount:1000, annualRate:10, years:2, sourceLabel:'Source', sourceDate:'2025-01-01' }, '2026-08-02').error, 'invalid_evidence');
  assert.equal(engine.calculate({ currency:'KES', amount:1000, annualRate:-100, years:2, sourceLabel:'Source', sourceDate:'2026-07-20' }, '2026-08-02').error, 'invalid_rate');
});

test('Swahili preserves every English input constraint and default', () => {
  assert.deepEqual(inputs(read(owner.localeOwners.sw)), inputs(read(owner.localeOwners.en)));
});

test('all locale consumers use current engine, controller and stylesheet hashes', () => {
  const controllerHash = crypto.createHash('md5').update(read(owner.controllerOwner)).digest('hex').slice(0, 8);
  const cssHash = crypto.createHash('md5').update(read('assets/css/inflation-scenario-vip.css')).digest('hex').slice(0, 8);
  assert.equal(controllerHash, '49d1794c');
  assert.equal(cssHash, '7a7ed40f');
  for (const file of Object.values(owner.localeOwners)) {
    const html = read(file);
    assert.match(html, /\/assets\/js\/engines\/inflation-scenario\.js\?v=b1de5b24/);
    assert.match(html, new RegExp(`/assets/js/pages/inflation-scenario-vip\\.js\\?v=${controllerHash}`));
    assert.match(html, new RegExp(`/assets/css/inflation-scenario-vip\\.css\\?v=${cssHash}`));
  }
});

test('native page has complete Swahili UI, source freshness, privacy and export labels', () => {
  const html = read(owner.localeOwners.sw);
  assert.match(html, /<html[^>]+lang="sw"/);
  assert.match(html, /Kokotoa hali/);
  assert.match(html, /Pakua CSV/);
  assert.match(html, /Pakua JSON/);
  assert.match(html, /Pakua PDF/);
  assert.match(html, /Benki ya Dunia/);
  assert.match(html, /22 Julai 2026/);
  assert.match(html, /Hakuna taarifa inayohifadhiwa/);
  for (const phrase of ['Calculate scenario', 'Copy this private', 'Build one sourced', 'Evidence checklist', 'Your entered-rate scenario', 'Official context', 'Privacy boundary']) {
    assert.doesNotMatch(html, new RegExp(escapeRegex(phrase), 'i'));
  }
  assert.doesNotMatch(html, /Fungua zana kamili ya Kiingereza|Hali ya lugha|sw-wave-|<iframe/i);
  assert.doesNotMatch(html, /ÃƒÆ’|Ãƒâ€š|ÃƒÂ¢(?:Ã¢â€šÂ¬|Ã¢â€šÂ¬Ã¢â€žÂ¢|Ã¢â€šÂ¬Ã‚Â¦)|Ã¯Â¿Â½/);
});

test('controller clears stale and invalid output and guards every native export', () => {
  const js = read(owner.controllerOwner);
  assert.match(js, /function isCurrent\(\)/);
  assert.match(js, /function clear\(message, errorMessage\)/);
  assert.match(js, /form\.addEventListener\('input', markStale\)/);
  assert.match(js, /form\.addEventListener\('change', markStale\)/);
  assert.match(js, /if \(!out\.ok\) \{ clear\('', invalidMessage\(out\.error\)\); return; \}/);
  assert.equal((js.match(/if \(!isCurrent\(\)\) return;/g) || []).length, 4);
  assert.match(js, /csvFile:'hali-ya-mfumuko-wa-bei\.csv'/);
  assert.match(js, /jsonFile:'hali-ya-mfumuko-wa-bei\.json'/);
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|insertAdjacentHTML|console\./);
});

test('reciprocal canonical and hreflang are exact on EN, FR and SW', () => {
  for (const [locale, file] of Object.entries(owner.localeOwners)) {
    const html = read(file);
    assert.match(html, new RegExp(`<link\\b(?=[^>]*rel="canonical")[^>]*href="https://afrotools\\.com${escapeRegex(owner.reciprocalRoutes[locale])}"`, 'i'));
    for (const [language, route] of Object.entries(owner.reciprocalRoutes)) {
      assert.match(html, new RegExp(`<link\\b(?=[^>]*rel="alternate")(?=[^>]*hreflang="${escapeRegex(language)}")[^>]*href="https://afrotools\\.com${escapeRegex(route)}"`, 'i'));
    }
  }
});

test('discovery, schema, artwork and route-only AI context are source-owned', () => {
  const registry = read(owner.discoveryOwner.file);
  const rows = registry.split(/\r?\n/).filter((line) => line.includes(`id: '${owner.discoveryOwner.id}'`));
  assert.equal(rows.length, 1);
  assert.match(rows[0], /sourceId: 'inflation-calc'/);
  assert.match(rows[0], /category: 'financial'/);
  const sw = read(owner.localeOwners.sw);
  assert.match(sw, /"@type":"WebApplication"/);
  assert.match(sw, /"@type":"FAQPage"/);
  assert.match(sw, /property="og:image" content="https:\/\/afrotools\.com\/assets\/img\/tools\/inflation-calc\.webp"/);
  assert.equal(fs.existsSync(path.join(root, 'assets/img/tools/inflation-calc.webp')), true);
  const context = JSON.parse(read(owner.aiContextOwner));
  assert.equal(context.toolKey, 'inflation-calc');
  assert.match(context.staticText, /never send financial values to AI/i);
  assert.equal(context.sourceBindings[0].enginePath, owner.engineOwner);
});

test('analytics loader is canonical, consent-aware and idempotent', () => {
  const html = read(owner.localeOwners.sw);
  const tag = analyticsOwner.canonicalLoaderTag();
  assert.equal(analyticsOwner.loaderMatches(html).length, 1);
  assert.equal(analyticsOwner.loaderSource(analyticsOwner.loaderMatches(html)[0][0]), analyticsOwner.loaderSource(tag));
  const first = analyticsOwner.normalizeLoaderInHtml(html, tag);
  const second = analyticsOwner.normalizeLoaderInHtml(first.html, tag);
  assert.equal(first.html, html);
  assert.equal(second.html, first.html);
});

test('receipt accepts only inflation-calc and leaves 94 no-overlap Finance IDs unproved', () => {
  const receipt = JSON.parse(read('reports/swahili-finance-inflation-receipt.json'));
  assert.deepEqual(receipt.totals, { scoped:1, accepted:1, blocked:0 });
  assert.deepEqual(receipt.acceptedRows.map((row) => row.englishId), ['inflation-calc']);
  assert.equal(receipt.remainingUnprovedFinanceIds.length, 94);
  assert.equal(new Set(receipt.remainingUnprovedFinanceIds).size, 94);
  for (const id of ['inflation-calc', ...scope.excludedPayeRepairIds, ...scope.excludedSeparateCandidateIds]) assert.equal(receipt.remainingUnprovedFinanceIds.includes(id), false, id);
});
