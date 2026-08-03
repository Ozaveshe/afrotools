'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const analyticsOwner = require('../scripts/inject-analytics-loader');
const engine = require('../engines/src/investment-return-engine.js');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const scope = JSON.parse(read('data/localization/sw-finance-compound-interest-scope.json'));
const owners = JSON.parse(read('data/localization/sw-finance-remainder-native-owners.json'));
const owner = owners.rows.find((row) => row.englishId === 'compound-interest');
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function close(actual, expected, label, tolerance = 0.01) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

function controls(html) {
  return [...html.matchAll(/<(input|select)\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?<\/select>)?/gi)].map((match) => {
    const tag = match[0];
    const attr = (name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] ?? null;
    return {
      tag: match[1].toLowerCase(),
      id: match[2],
      type: attr('type'), min: attr('min'), max: attr('max'), step: attr('step'),
      value: attr('value'), required: /\brequired\b/i.test(tag),
      options: [...tag.matchAll(/<option\b([^>]*)value="([^"]+)"[^>]*>/gi)]
        .map((option) => ({ value: option[2], selected: /\bselected\b/i.test(option[1]) }))
    };
  });
}

test('bounded scope owns exactly compound-interest without lane overlap', () => {
  assert.equal(scope.baseSha, '0f6990118d9ac8b9dcde446a6ede10a017b9a2db');
  assert.deepEqual(scope.ownedRows.map((row) => row.englishId), ['compound-interest']);
  assert.equal(scope.ownedRows[0].categoryKey, 'financial');
  assert.equal(scope.excludedPayeRepairIds.length, 26);
  assert.equal(new Set(scope.excludedPayeRepairIds).size, 26);
  assert.ok(scope.excludedAcceptedFinanceIds.includes('crypto-address'));
  assert.deepEqual(scope.excludedSeparateThreeAppCandidateIds, ['savings-goal', 'car-loan', 'bank-charges']);
  assert.deepEqual(scope.excludedCategories, ['hr-payroll', 'personal-finance', 'vat']);
});

test('native owner names maintained source, shared engine, controller and exact exports', () => {
  assert.ok(owner);
  assert.equal(owner.acceptanceStatus, 'accepted');
  assert.deepEqual(owner.advertisedNativeFormats, ['txt', 'pdf']);
  assert.equal(owner.sharedAiRoutingOwner, 'coordinator');
  for (const file of [owner.sourceOwner, owner.engineOwner, owner.runtimeEngine, owner.controllerOwner]) {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  }
  const policy = JSON.parse(read('data/registry/locale-coverage-policy.json'));
  const localeOverride = policy.overrides.find((entry) => entry.route === owner.swahiliRoute);
  assert.equal(localeOverride?.state, 'native');
  assert.equal(localeOverride?.equivalentRoute, owner.englishRoute);
  assert.equal(localeOverride?.engineLocaleNeutral, true);
});

test('shared engine gives exact valid, zero-rate, timing and invalid oracles', () => {
  const standard = engine.project({
    initialInvestment: 100000, monthlyContribution: 10000, annualRatePercent: 8,
    years: 5, compoundsPerYear: 12, contributionTiming: 'end', inflationRatePercent: 0
  });
  close(standard.finalValue, 883753.1332825755, 'five-year balance', 1e-8);
  close(standard.totalContributed, 700000, 'five-year contributions');
  close(standard.projectedGain, 183753.13328257552, 'five-year interest', 1e-8);
  const zero = engine.project({
    initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 0,
    years: 1, compoundsPerYear: 12, contributionTiming: 'end', inflationRatePercent: 0
  });
  close(zero.finalValue, 2200, 'zero-rate balance');
  close(zero.projectedGain, 0, 'zero-rate interest');
  const beginning = engine.project({
    initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 12,
    years: 1, compoundsPerYear: 12, contributionTiming: 'beginning', inflationRatePercent: 0
  });
  const end = engine.project({
    initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 12,
    years: 1, compoundsPerYear: 12, contributionTiming: 'end', inflationRatePercent: 0
  });
  assert.ok(beginning.finalValue > end.finalValue);
  assert.throws(() => engine.project({ initialInvestment: -1, monthlyContribution: 0, annualRatePercent: 8, years: 1 }), /zero or greater/);
});

test('Swahili preserves every English input and option contract', () => {
  assert.deepEqual(controls(read(owner.localeOwners.sw)), controls(read(owner.localeOwners.en)));
});

test('all locale owners load the same current engine and controller', () => {
  const expectedHash = crypto.createHash('md5').update(read(owner.controllerOwner)).digest('hex').slice(0, 8);
  assert.equal(expectedHash, '03268917');
  const consumers = execFileSync('git', ['grep', '-l', '/assets/js/pages/compound-interest-vip.js?v=', '--', '*.html'], { cwd: root, encoding: 'utf8' })
    .trim().split(/\r?\n/).map((file) => file.replace(/\\/g, '/')).sort();
  assert.deepEqual(consumers, Object.values(owner.localeOwners).sort());
  for (const file of consumers) {
    const html = read(file);
    assert.match(html, /\/engines\/investment-return-engine\.js\?v=4d9af4f6/);
    assert.match(html, new RegExp(`/assets/js/pages/compound-interest-vip\\.js\\?v=${expectedHash}`));
  }
  const french = read(owner.localeOwners.fr);
  assert.match(french, /id="ciTxt"[^>]*data-no-pdf-gate="true"/);
  assert.match(french, /id="ciPdf"[^>]*data-no-pdf-gate="true"/);
});

test('native page has Swahili product, validation, source, privacy and export states', () => {
  const html = read(owner.localeOwners.sw);
  assert.match(html, /<html[^>]+lang="sw"/);
  assert.match(html, /Kokotoa makadirio/);
  assert.match(html, /Pakua mapitio ya TXT/);
  assert.match(html, /Pakua mapitio ya PDF/);
  assert.match(html, /Investor\.gov/);
  assert.match(html, /23 Julai 2026/);
  assert.match(html, /Taarifa za kifedha unazoingiza hazihifadhiwi wala kutumwa kwa huduma ya AI/);
  assert.doesNotMatch(html, /Fungua zana kamili ya Kiingereza|Hali ya lugha|sw-wave-|<iframe/i);
  assert.doesNotMatch(html, /Ãƒ|Ã‚|Ã¢(?:â‚¬|â‚¬â„¢|â‚¬Â¦)|ï¿½/);
});

test('controller clears stale or invalid output and every export fails closed', () => {
  const js = read(owner.controllerOwner);
  assert.match(js, /function clearResult\(message\)/);
  assert.match(js, /displayCurrency:currency\.value/);
  assert.match(js, /function markStale\(\) \{ if\(result&&signature\(\)!==resultSignature\)clearResult\(t\.stale\); \}/);
  assert.match(js, /form\.addEventListener\('input',markStale\)/);
  assert.match(js, /form\.addEventListener\('change',markStale\)/);
  assert.match(js, /catch \(error\) \{\s*clearResult\(t\.invalid\)/);
  assert.equal((js.match(/if\(!result\)/g) || []).length, 1);
  assert.match(js, /if\(!result\|\|!window\.jspdf\|\|!window\.jspdf\.jsPDF\)/);
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|insertAdjacentHTML/);
});

test('reciprocal canonical and hreflang metadata is exact on EN, FR and SW', () => {
  for (const [locale, file] of Object.entries(owner.localeOwners)) {
    const html = read(file);
    assert.match(html, new RegExp(`<link\\b(?=[^>]*rel="canonical")[^>]*href="https://afrotools\\.com${escapeRegex(owner.reciprocalRoutes[locale])}"`, 'i'));
    for (const [language, route] of Object.entries(owner.reciprocalRoutes)) {
      assert.match(html, new RegExp(`<link\\b(?=[^>]*rel="alternate")(?=[^>]*hreflang="${escapeRegex(language)}")[^>]*href="https://afrotools\\.com${escapeRegex(route)}"`, 'i'));
    }
  }
});

test('discovery, SEO, schema, artwork and route-only AI context are source-owned', () => {
  const registry = read(owner.discoveryOwner.file);
  const row = registry.split(/\r?\n/).find((line) => line.includes(`id: "${owner.discoveryOwner.id}"`));
  assert.ok(row);
  assert.match(row, /sourceId: "compound-interest"/);
  assert.match(row, /category: "financial"/);
  assert.match(row, /revenue: "Free"/);
  assert.equal((registry.match(new RegExp(`id: "${escapeRegex(owner.discoveryOwner.id)}"`, 'g')) || []).length, 1);
  const sw = read(owner.localeOwners.sw);
  assert.match(sw, /<link rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/riba-ya-mchanganyiko\/">/);
  assert.match(sw, /property="og:image" content="https:\/\/afrotools\.com\/assets\/img\/tools\/compound-interest\.webp"/);
  assert.match(sw, /"@type":"WebApplication"/);
  assert.match(sw, /"@type":"FAQPage"/);
  assert.equal(fs.existsSync(path.join(root, 'assets/img/tools/compound-interest.webp')), true);
  const aiContext = JSON.parse(read(owner.aiContextOwner));
  assert.equal(aiContext.toolKey, 'compound-interest');
  assert.match(aiContext.staticText, /browser-local calculator/);
  assert.match(aiContext.staticText, /accepts no AI prefill and sends no amounts/);
});

test('analytics loader is canonical, consent-aware and owner-idempotent', () => {
  const html = read(owner.localeOwners.sw);
  const tag = analyticsOwner.canonicalLoaderTag();
  assert.ok(html.includes(tag));
  assert.ok(html.indexOf('/assets/js/components/analytics-consent-v2.js') < html.indexOf('/assets/js/lazy-analytics.js'));
  assert.equal(analyticsOwner.loaderMatches(html).length, 1);
  assert.equal(analyticsOwner.loaderSource(analyticsOwner.loaderMatches(html)[0][0]), analyticsOwner.loaderSource(tag));
  const first = analyticsOwner.normalizeLoaderInHtml(html, tag);
  const second = analyticsOwner.normalizeLoaderInHtml(first.html, tag);
  assert.equal(first.html, html);
  assert.equal(second.html, first.html);
});

test('gap generator preserves the accepted native source owner idempotently', () => {
  const before = read(owner.sourceOwner);
  const output = execFileSync('node', ['scripts/generate-sw-tool-gap-pages.js', '--slugs=compound-interest'], { cwd: root, encoding: 'utf8' });
  assert.match(output, /1 accepted native owners preserved/);
  assert.equal(read(owner.sourceOwner), before);
});

test('receipt accepts only the route proven by this candidate', () => {
  const receipt = JSON.parse(read('reports/swahili-finance-compound-interest-receipt.json'));
  assert.deepEqual(receipt.totals, { scoped: 1, accepted: 1, blocked: 0 });
  assert.deepEqual(receipt.acceptedRows.map((row) => row.englishId), ['compound-interest']);
  assert.equal(Object.hasOwn(receipt, 'blockedEnglishIds'), false);
  assert.equal(receipt.remainingUnprovedFinanceIds.length, 96);
  assert.equal(new Set(receipt.remainingUnprovedFinanceIds).size, 96);
  assert.equal(receipt.remainingUnprovedFinanceIds.includes('compound-interest'), false);
  for (const id of scope.excludedPayeRepairIds) assert.equal(receipt.remainingUnprovedFinanceIds.includes(id), false, id);
});
