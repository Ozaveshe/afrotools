'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const analyticsOwner = require('../scripts/inject-analytics-loader');
const engine = require('../engines/src/forex-profit-statement-engine.js');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const scope = JSON.parse(read('data/localization/sw-finance-forex-profit-scope.json'));
const owners = JSON.parse(read('data/localization/sw-finance-remainder-native-owners.json'));
const owner = owners.rows.find((row) => row.englishId === 'forex-profit');
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function inputs(html) {
  return [...html.matchAll(/<input\b[^>]*\bid="([^"]+)"[^>]*>/gi)].map((match) => {
    const tag = match[0];
    const attr = (name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] ?? null;
    return { id:match[1], type:attr('type'), min:attr('min'), max:attr('max'), step:attr('step'), value:attr('value'), maxlength:attr('maxlength'), required:/\brequired\b/i.test(tag) };
  });
}

test('scope owns exactly forex-profit and excludes every adjacent lane', () => {
  assert.equal(scope.baseSha, '8354e321ff34caf60a33a3393cd0dcddfb00c023');
  assert.deepEqual(scope.ownedRows.map((row) => row.englishId), ['forex-profit']);
  assert.deepEqual(scope.excludedSeparateCandidateIds, ['savings-goal', 'car-loan', 'bank-charges', 'compound-interest', 'investment-return', 'inflation-calc']);
  assert.equal(scope.excludedPayeRepairIds.length, 26);
  assert.equal(new Set(scope.excludedPayeRepairIds).size, 26);
  assert.deepEqual(scope.excludedCategories, ['hr-payroll', 'personal-finance', 'vat']);
});

test('owner binds the native page to the exact source engine, runtime and four exports', () => {
  assert.ok(owner);
  assert.equal(owner.engineOwner, 'engines/src/forex-profit-statement-engine.js');
  assert.equal(owner.runtimeEngine, 'engines/forex-profit-statement-engine.js');
  assert.equal(owner.controllerOwner, 'assets/js/pages/forex-profit-statement.js');
  assert.deepEqual(owner.advertisedNativeFormats, ['clipboard-text', 'csv', 'json', 'pdf']);
  for (const file of [owner.sourceOwner, owner.engineOwner, owner.runtimeEngine, owner.controllerOwner]) assert.equal(fs.existsSync(path.join(root, file)), true, file);
});

test('shared source engine proves buy, sell, loss, break-even, conversion and invalid boundaries', () => {
  const base={baseCurrency:'AAA',quoteCurrency:'BBB',reportingCurrencyUnit:'CCC',direction:'buy',entryPrice:1.2,exitPrice:1.21,baseUnits:10000,pipSize:.0001,quoteToReportingRate:2,transactionCostsQuote:5};
  const buy=engine.calculate(base); assert.ok(Math.abs(buy.grossPnlQuote-100)<1e-9); assert.ok(Math.abs(buy.netPnlQuote-95)<1e-9); assert.ok(Math.abs(buy.netPnlReporting-190)<1e-9); assert.ok(Math.abs(buy.signedPips-100)<1e-9);
  assert.ok(Math.abs(engine.calculate({...base,direction:'sell',exitPrice:1.19}).grossPnlQuote-100)<1e-9);
  assert.ok(Math.abs(engine.calculate({...base,exitPrice:1.19}).netPnlReporting+210)<1e-9);
  assert.equal(engine.calculate({...base,exitPrice:1.2,transactionCostsQuote:0}).netPnlQuote,0);
  assert.ok(Math.abs(engine.calculate({...base,quoteToReportingRate:.5}).netPnlReporting-47.5)<1e-9);
  assert.throws(() => engine.calculate({...base,pipSize:0}), /INVALID_NUMBER/);
  assert.throws(() => engine.calculate({...base,transactionCostsQuote:-1}), /INVALID_NUMBER/);
  assert.throws(() => engine.calculate({...base,baseCurrency:'=BAD'}), /BASE_REQUIRED/);
});

test('Swahili preserves every English input constraint and default', () => {
  assert.deepEqual(inputs(read(owner.localeOwners.sw)), inputs(read(owner.localeOwners.en)));
});

test('all locale consumers use current source-owned engine, controller and stylesheet hashes', () => {
  const controllerHash=crypto.createHash('md5').update(read(owner.controllerOwner)).digest('hex').slice(0,8);
  const cssHash=crypto.createHash('md5').update(read('assets/css/forex-profit-statement.css')).digest('hex').slice(0,8);
  assert.equal(controllerHash, 'fd67eac9'); assert.equal(cssHash, '093bad12');
  for(const file of Object.values(owner.localeOwners)) {
    const html=read(file);
    assert.match(html,/\/engines\/forex-profit-statement-engine\.js\?v=a68a776c/);
    assert.match(html,new RegExp(`/assets/js/pages/forex-profit-statement\\.js\\?v=${controllerHash}`));
    assert.match(html,new RegExp(`/assets/css/forex-profit-statement\\.css\\?v=${cssHash}`));
  }
});

test('native page is Swahili, source-dated, private, accessible and free of the rejected shell language', () => {
  const html=read(owner.localeOwners.sw);
  assert.match(html,/<html\b[^>]*\blang="sw"[^>]*>/); assert.match(html,/22 Julai 2026/); assert.match(html,/Hakuna kutuma kwa AI/); assert.match(html,/Pakua CSV/); assert.match(html,/Pakua JSON/); assert.match(html,/Pakua PDF/);
  for(const phrase of ['Private in your browser','Buy or sell','Local PDF and data exports','Exposure in base','Statement note','Formula and units','Decision boundary','login']) assert.doesNotMatch(html,new RegExp(escapeRegex(phrase),'i'));
  assert.doesNotMatch(html,/Fungua zana kamili ya Kiingereza|Hali ya lugha|sw-wave-|<iframe/i);
  for(const id of ['fx-base','fx-quote','fx-reporting','fx-direction','fx-entry','fx-exit','fx-units','fx-pip','fx-conversion','fx-costs','fx-note']) assert.match(html,new RegExp(`<label\\b[^>]*for="${id}"`));
  assert.match(html,/id="fx-status"[^>]*aria-live="polite"/);
});

test('controller clears stale and invalid output and guards every advertised export', () => {
  const js=read(owner.controllerOwner);
  assert.match(js,/function isCurrent\(\)/); assert.match(js,/function clear\(message, errorMessage\)/); assert.match(js,/form\.addEventListener\('input'/); assert.match(js,/form\.addEventListener\('change'/);
  assert.equal((js.match(/if\(!isCurrent\(\)\)return;/g)||[]).length,4);
  assert.match(js,/files:\['taarifa-ya-forex\.csv','taarifa-ya-forex\.json','taarifa-ya-forex\.pdf'\]/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|sessionStorage|indexedDB|innerHTML|insertAdjacentHTML|console\./);
  assert.equal((js.match(/localStorage\.setItem\(/g)||[]).length,1);
  assert.match(js,/localStorage\.setItem\('afrotools-theme',next\)/);
});

test('canonical and reciprocal hreflang are exact on EN, FR and SW', () => {
  for(const [locale,file] of Object.entries(owner.localeOwners)) {
    const html=read(file);
    assert.match(html,new RegExp(`<link\\b(?=[^>]*rel="canonical")[^>]*href="https://afrotools\\.com${escapeRegex(owner.reciprocalRoutes[locale])}"`,'i'));
    for(const [language,route] of Object.entries(owner.reciprocalRoutes)) assert.match(html,new RegExp(`<link\\b(?=[^>]*rel="alternate")(?=[^>]*hreflang="${escapeRegex(language)}")[^>]*href="https://afrotools\\.com${escapeRegex(route)}"`,'i'));
  }
});

test('discovery, schema, artwork and route-only AI context are source-owned', () => {
  const registry=read(owner.discoveryOwner.file); const rows=registry.split(/\r?\n/).filter((line)=>line.includes(`id: "${owner.discoveryOwner.id}"`)); assert.equal(rows.length,1); assert.match(rows[0],/sourceId: 'forex-profit'/); assert.match(rows[0],/category: "financial"/);
  const sw=read(owner.localeOwners.sw); assert.match(sw,/"@type":"WebApplication"/); assert.match(sw,/"@type":"FAQPage"/); assert.match(sw,/property="og:image" content="https:\/\/afrotools\.com\/assets\/img\/tools\/forex-profit\.webp"/); assert.equal(fs.existsSync(path.join(root,'assets/img/tools/forex-profit.webp')),true);
  const context=JSON.parse(read(owner.aiContextOwner)); assert.equal(context.toolKey,'forex-profit'); assert.match(context.staticText,/sends no financial values.*to AI/i); assert.equal(context.sourceBindings[0].enginePath,owner.engineOwner);
});

test('analytics loader is canonical, consent-aware and idempotent', () => {
  const html=read(owner.localeOwners.sw), tag=analyticsOwner.canonicalLoaderTag(); assert.equal(analyticsOwner.loaderMatches(html).length,1); assert.equal(analyticsOwner.loaderSource(analyticsOwner.loaderMatches(html)[0][0]),analyticsOwner.loaderSource(tag));
  const first=analyticsOwner.normalizeLoaderInHtml(html,tag), second=analyticsOwner.normalizeLoaderInHtml(first.html,tag); assert.equal(first.html,html); assert.equal(second.html,first.html);
});

test('receipt accepts only forex-profit and leaves 93 no-overlap Finance IDs unproved', () => {
  const receipt=JSON.parse(read('reports/swahili-finance-forex-profit-receipt.json')); assert.deepEqual(receipt.totals,{scoped:1,accepted:1,blocked:0}); assert.deepEqual(receipt.acceptedRows.map((row)=>row.englishId),['forex-profit']); assert.equal(receipt.remainingUnprovedFinanceIds.length,93); assert.equal(new Set(receipt.remainingUnprovedFinanceIds).size,93);
  for(const id of ['forex-profit',...scope.excludedPayeRepairIds,...scope.excludedSeparateCandidateIds]) assert.equal(receipt.remainingUnprovedFinanceIds.includes(id),false,id);
});
