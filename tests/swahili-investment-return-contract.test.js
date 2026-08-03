'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const analyticsOwner = require('../scripts/inject-analytics-loader');
const engine = require('../engines/src/investment-return-engine.js');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const scope = JSON.parse(read('data/localization/sw-finance-investment-return-scope.json'));
const owners = JSON.parse(read('data/localization/sw-finance-remainder-native-owners.json'));
const owner = owners.rows.find((row) => row.englishId === 'investment-return');
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function close(actual, expected, label, tolerance = 0.01) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

function controls(html) {
  return [...html.matchAll(/<(input|select)\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?<\/select>)?/gi)].map((match) => {
    const tag = match[0];
    const attr = (name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] ?? null;
    return {
      tag: match[1].toLowerCase(), id: match[2], type: attr('type'), min: attr('min'), max: attr('max'),
      step: attr('step'), value: attr('value'), inputmode: attr('inputmode'), required: /\brequired\b/i.test(tag),
      options: [...tag.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map((option) => {
        const value = option[1].match(/\bvalue="([^"]+)"/i)?.[1] ?? null;
        const code = option[1].match(/\bdata-code="([^"]+)"/i)?.[1] ?? null;
        return { value, code, selected: /\bselected\b/i.test(option[1]) };
      })
    };
  });
}

test('bounded scope owns exactly investment-return without lane overlap', () => {
  assert.equal(scope.baseSha, '0f6990118d9ac8b9dcde446a6ede10a017b9a2db');
  assert.deepEqual(scope.ownedRows.map((row) => row.englishId), ['investment-return']);
  assert.equal(scope.ownedRows[0].categoryKey, 'financial');
  assert.equal(scope.excludedPayeRepairIds.length, 26);
  assert.equal(new Set(scope.excludedPayeRepairIds).size, 26);
  assert.ok(scope.excludedAcceptedFinanceIds.includes('crypto-address'));
  assert.deepEqual(scope.excludedSeparateCandidateIds, ['compound-interest', 'savings-goal', 'car-loan', 'bank-charges']);
  assert.deepEqual(scope.excludedCategories, ['hr-payroll', 'personal-finance', 'vat']);
});

test('native owner names maintained source, shared engine, controller and exact exports', () => {
  assert.ok(owner);
  assert.equal(owner.acceptanceStatus, 'accepted');
  assert.deepEqual(owner.advertisedNativeFormats, ['clipboard-text', 'csv', 'pdf']);
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

test('shared engine gives exact standard, zero-rate, timing, loss and invalid oracles', () => {
  const standard = engine.project({
    initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 12,
    years: 1, compoundsPerYear: 12, contributionTiming: 'end', inflationRatePercent: 6
  });
  close(standard.finalValue, 2395.0753, 'one-year balance', 1e-4);
  close(standard.totalContributed, 2200, 'one-year contributions');
  close(standard.projectedGain, 195.0753, 'one-year gain', 1e-4);
  close(standard.effectiveAnnualRate, Math.pow(1.01, 12) - 1, 'effective return', 1e-10);
  close(standard.realEffectiveAnnualRate, Math.pow(1.01, 12) / 1.06 - 1, 'real return', 1e-10);
  const zero = engine.project({ initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 0, years: 1, compoundsPerYear: 12, contributionTiming: 'end', inflationRatePercent: 0 });
  close(zero.finalValue, 2200, 'zero-rate balance');
  close(zero.projectedGain, 0, 'zero-rate gain');
  const beginning = engine.project({ initialInvestment: 1000, monthlyContribution: 100, annualRatePercent: 12, years: 1, compoundsPerYear: 12, contributionTiming: 'beginning', inflationRatePercent: 0 });
  close(beginning.finalValue, 2407.7578, 'beginning contribution timing', 1e-4);
  const loss = engine.project({ initialInvestment: 1000, monthlyContribution: 0, annualRatePercent: -10, years: 1, compoundsPerYear: 1, contributionTiming: 'end', inflationRatePercent: 0 });
  close(loss.finalValue, 900, 'negative-return balance');
  assert.throws(() => engine.project({ initialInvestment: 0, monthlyContribution: 0, annualRatePercent: 12, years: 1 }), /initial investment or monthly contribution/i);
  assert.throws(() => engine.project({ initialInvestment: 1000, monthlyContribution: 0, annualRatePercent: -100, years: 1 }), /above -100/i);
});

test('Swahili preserves every English input, constraint, default and option key', () => {
  assert.deepEqual(controls(read(owner.localeOwners.sw)), controls(read(owner.localeOwners.en)));
});

test('all locale owners load the same current engine, controller and stylesheet', () => {
  const controllerHash = crypto.createHash('md5').update(read(owner.controllerOwner)).digest('hex').slice(0, 8);
  const cssHash = crypto.createHash('md5').update(read('assets/css/investment-return-vip.css')).digest('hex').slice(0, 8);
  assert.equal(controllerHash, '1b4431e9');
  assert.equal(cssHash, '044ad449');
  for (const file of Object.values(owner.localeOwners)) {
    const html = read(file);
    assert.match(html, /\/engines\/investment-return-engine\.js\?v=4d9af4f6/);
    assert.match(html, new RegExp(`/assets/js/pages/investment-return-vip\\.js\\?v=${controllerHash}`));
    assert.match(html, new RegExp(`/assets/css/investment-return-vip\\.css\\?v=${cssHash}`));
    assert.match(html, /id="ir-final" tabindex="-1"/);
    for (const id of ['ir-copy', 'ir-csv', 'ir-pdf']) assert.match(html, new RegExp(`id="${id}"[^>]*disabled`));
  }
  const french = read(owner.localeOwners.fr);
  for (const id of ['ir-copy', 'ir-csv', 'ir-pdf']) assert.match(french, new RegExp(`id="${id}"[^>]*data-no-pdf-gate="true"`));
});

test('native page has Swahili product, validation, sources, freshness, privacy and exports', () => {
  const html = read(owner.localeOwners.sw);
  assert.match(html, /<html[^>]+lang="sw"/);
  assert.match(html, /Kokotoa makadirio/);
  assert.match(html, /Nakili muhtasari/);
  assert.match(html, /Pakua CSV/);
  assert.match(html, /Pakua PDF/);
  assert.match(html, /Investor\.gov/);
  assert.match(html, /22 Julai 2026/);
  assert.match(html, /Hazihifadhiwi wala kutumwa kwa AI/);
  for (const phrase of ['Calculate projection', 'Copy summary', 'Download CSV', 'Download PDF', 'Build the scenario', 'Final projected value', 'Sources of the method']) {
    assert.doesNotMatch(html, new RegExp(escapeRegex(phrase), 'i'));
  }
  assert.doesNotMatch(html, /Fungua zana kamili ya Kiingereza|Hali ya lugha|sw-wave-|<iframe/i);
  assert.doesNotMatch(html, /ÃƒÆ’|Ãƒâ€š|ÃƒÂ¢(?:Ã¢â€šÂ¬|Ã¢â€šÂ¬Ã¢â€žÂ¢|Ã¢â€šÂ¬Ã‚Â¦)|Ã¯Â¿Â½/);
});

test('controller clears stale or invalid output and every export fails closed', () => {
  const js = read(owner.controllerOwner);
  assert.match(js, /function clearResult\(message\)/);
  assert.match(js, /displayCurrency:currency\.options\[currency\.selectedIndex\]\.dataset\.code/);
  assert.match(js, /function markStale\(\) \{ if \(result && !isCurrent\(\)\) clearResult\(copy\.stale\); \}/);
  assert.match(js, /form\.addEventListener\('input', markStale\)/);
  assert.match(js, /form\.addEventListener\('change', markStale\)/);
  assert.match(js, /catch \(error\) \{\s*clearResult\(copy\.invalid\)/);
  assert.equal((js.match(/if \(!isCurrent\(\)\) return;/g) || []).length, 3);
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|insertAdjacentHTML|console\./);
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
  const rows = registry.split(/\r?\n/).filter((line) => line.includes(`id: '${owner.discoveryOwner.id}'`));
  assert.equal(rows.length, 1);
  assert.match(rows[0], /sourceId: 'investment-return'/);
  assert.match(rows[0], /category: 'financial'/);
  assert.match(rows[0], /revenue: 'Free'/);
  const sw = read(owner.localeOwners.sw);
  assert.match(sw, /<link rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/faida-ya-uwekezaji\/">/);
  assert.match(sw, /property="og:image" content="https:\/\/afrotools\.com\/assets\/img\/tools\/investment-return\.webp"/);
  assert.match(sw, /"@type":"WebApplication"/);
  assert.match(sw, /"@type":"FAQPage"/);
  assert.equal(fs.existsSync(path.join(root, 'assets/img/tools/investment-return.webp')), true);
  const aiContext = JSON.parse(read(owner.aiContextOwner));
  assert.equal(aiContext.toolKey, 'investment-return');
  assert.match(aiContext.staticText, /accepts no AI prefill/i);
  assert.match(aiContext.staticText, /sends no investment amounts or assumptions to AI/i);
});

test('analytics loader is canonical, consent-aware and owner-idempotent', () => {
  const html = read(owner.localeOwners.sw);
  const tag = analyticsOwner.canonicalLoaderTag();
  assert.equal(analyticsOwner.loaderMatches(html).length, 1);
  assert.equal(analyticsOwner.loaderSource(analyticsOwner.loaderMatches(html)[0][0]), analyticsOwner.loaderSource(tag));
  const first = analyticsOwner.normalizeLoaderInHtml(html, tag);
  const second = analyticsOwner.normalizeLoaderInHtml(first.html, tag);
  assert.equal(first.html, html);
  assert.equal(second.html, first.html);
});

test('native page is the explicit maintained owner and is outside the generic gap wave', () => {
  assert.equal(owner.sourceOwner, 'sw/zana/faida-ya-uwekezaji/index.html');
  assert.equal(scope.ownedRows[0].swahiliRoute, '/sw/zana/faida-ya-uwekezaji/');
  assert.doesNotMatch(read('scripts/generate-sw-tool-gap-pages.js'), /investment-return|faida-ya-uwekezaji/);
});

test('receipt accepts only the route proven by this candidate', () => {
  const receipt = JSON.parse(read('reports/swahili-finance-investment-return-receipt.json'));
  assert.deepEqual(receipt.totals, { scoped: 1, accepted: 1, blocked: 0 });
  assert.deepEqual(receipt.acceptedRows.map((row) => row.englishId), ['investment-return']);
  assert.equal(Object.hasOwn(receipt, 'blockedEnglishIds'), false);
  assert.equal(receipt.remainingUnprovedFinanceIds.length, 95);
  assert.equal(new Set(receipt.remainingUnprovedFinanceIds).size, 95);
  assert.equal(receipt.remainingUnprovedFinanceIds.includes('investment-return'), false);
  for (const id of scope.excludedPayeRepairIds) assert.equal(receipt.remainingUnprovedFinanceIds.includes(id), false, id);
});
