'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/engines/hajj-budget.js');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const manifest = JSON.parse(read('data/localization/sw-hajj-budget.json'));
const sw = read('sw/zana/bajeti-ya-hajj-na-umrah/index.html');
const en = read('tools/hajj-budget/index.html');
const fr = read('fr/tools/budget-hajj-umrah/index.html');
const hub = read('sw/dini-na-utamaduni/index.html');
const registry = read('assets/js/components/tool-registry.js');

const preset = engine.estimatePreset({ origin: 'NG', trip: 'hajj', travelers: 1, package: 'standard', days: 21, buffer: 12 });
assert.deepEqual(preset.input, { origin: 'NG', trip: 'hajj', travelers: 1, package: 'standard', days: 21, buffer: 12 });
assert.equal(preset.subtotal, 7145);
assert.equal(preset.total, 8002.4);
assert.equal(preset.perTraveler, 8002.4);
assert.equal(preset.contingencyValue, 857.4);
assert.equal(preset.basePackagePerTraveler, 6200);
assert.equal(preset.dailyAllowanceOwnerRow, 945);
assert.equal(preset.dailyAllowanceAdjusted, 945);
assert.equal(preset.originLabel, 'Nigeria');

const umrahKenya = engine.estimatePreset({ origin: 'KE', trip: 'umrah', travelers: 2, package: 'economy', days: 10, buffer: 0 });
assert.equal(umrahKenya.subtotal, 4073.76);
assert.equal(umrahKenya.total, 4073.76);
assert.equal(umrahKenya.perTraveler, 2036.88);
assert.equal(umrahKenya.basePackagePerTraveler, 1622.88);
assert.equal(umrahKenya.dailyAllowanceOwnerRow, 900);
assert.equal(umrahKenya.dailyAllowanceAdjusted, 828);
assert.equal(umrahKenya.originMultiplier, 0.92);

const quote = engine.estimateWrittenQuote({ travelers: 1, packageCost: 6200, cashBudget: 800, buffer: 12 });
assert.equal(quote.subtotal, 7000);
assert.equal(quote.total, 7840);
assert.equal(quote.perTraveler, 7840);
assert.equal(quote.contingencyValue, 840);
assert.equal(quote.packageTotal, 6200);
assert.equal(quote.cashTotal, 800);
assert.equal(engine.estimateWrittenQuote({ travelers: 1, packageCost: 0, cashBudget: 0, buffer: 0 }).total, 0);

const presetBoundary = engine.estimatePreset({ origin: 'ZA', trip: 'hajj', travelers: 100, package: 'premium', days: 365, buffer: 100 });
assert.equal(presetBoundary.total, 6189100);
const quoteBoundary = engine.estimateWrittenQuote({ travelers: 100, packageCost: 1000000000, cashBudget: 1000000000, buffer: 100 });
assert.equal(quoteBoundary.total, 400000000000);

for (const [call, field, code] of [
  [() => engine.estimatePreset({ origin: 'XX', trip: 'hajj', travelers: 1, package: 'standard', days: 21, buffer: 12 }), 'origin', 'INVALID_CHOICE'],
  [() => engine.estimatePreset({ origin: 'NG', trip: 'other', travelers: 1, package: 'standard', days: 21, buffer: 12 }), 'trip', 'INVALID_CHOICE'],
  [() => engine.estimatePreset({ origin: 'NG', trip: 'hajj', travelers: 1, package: 'other', days: 21, buffer: 12 }), 'package', 'INVALID_CHOICE'],
  [() => engine.estimatePreset({ origin: 'NG', trip: 'hajj', travelers: 0, package: 'standard', days: 21, buffer: 12 }), 'travelers', 'OUT_OF_RANGE'],
  [() => engine.estimatePreset({ origin: 'NG', trip: 'hajj', travelers: 1.5, package: 'standard', days: 21, buffer: 12 }), 'travelers', 'INTEGER_REQUIRED'],
  [() => engine.estimatePreset({ origin: 'NG', trip: 'hajj', travelers: 1, package: 'standard', days: 0, buffer: 12 }), 'days', 'OUT_OF_RANGE'],
  [() => engine.estimatePreset({ origin: 'NG', trip: 'hajj', travelers: 1, package: 'standard', days: 366, buffer: 12 }), 'days', 'OUT_OF_RANGE'],
  [() => engine.estimatePreset({ origin: 'NG', trip: 'hajj', travelers: 1, package: 'standard', days: 21, buffer: 101 }), 'buffer', 'OUT_OF_RANGE'],
  [() => engine.estimateWrittenQuote({ travelers: 1, packageCost: -1, cashBudget: 0, buffer: 0 }), 'packageCost', 'OUT_OF_RANGE'],
  [() => engine.estimateWrittenQuote({ travelers: 1, packageCost: '', cashBudget: 0, buffer: 0 }), 'packageCost', 'INVALID_NUMBER'],
  [() => engine.estimateWrittenQuote({ travelers: 1, packageCost: 0, cashBudget: 1000000001, buffer: 0 }), 'cashBudget', 'OUT_OF_RANGE'],
  [() => engine.estimateWrittenQuote({ travelers: 101, packageCost: 0, cashBudget: 0, buffer: 0 }), 'quoteTravelers', 'OUT_OF_RANGE'],
  [() => engine.estimateWrittenQuote({ travelers: 1, packageCost: 0, cashBudget: 0, buffer: -0.1 }), 'quoteBuffer', 'OUT_OF_RANGE']
]) assert.throws(call, error => error.field === field && error.code === code);

assert.equal(manifest.sourceId, 'hajj-budget');
assert.equal(manifest.route, '/sw/zana/bajeti-ya-hajj-na-umrah/');
assert.equal(manifest.englishOwner, '/tools/hajj-budget/');
assert.deepEqual(manifest.exports, ['clipboard', 'json', 'json-import', 'local-save-reopen', 'pdf', 'print']);
assert.deepEqual(manifest.ownerParity.packageUsd, { economy: 4200, standard: 6200, premium: 9800 });
assert.equal(manifest.ownerParity.dailyAllowanceUsd, 45);
assert.match(sw, /data-source-id="hajj-budget"/);
assert.match(sw, /data-ai-mode="deterministic-local"/);
assert.match(sw, /assets\/js\/engines\/hajj-budget\.js/);
assert.match(sw, /assets\/js\/pages\/hajj-budget-sw\.js/);
assert.match(sw, /assets\/img\/tools\/hajj-budget\.webp/);
assert.match(sw, /window\._afroAuthLoaded=true/);
assert.match(sw, /Hifadhi na fungua tena ndani ya kifaa/);
assert.match(sw, /Huduma ya Serikali ya Saudi iliyorejelewa na English owner/);
assert.doesNotMatch(sw, /religious-cultural-apps\.js|english-df-app-upgrades\.js|data-rs-tool-id|sw-rc-runtime-localizer/i);
assert.match(sw, /assets\/js\/lazy-analytics\.js/);
assert.match(en, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/bajeti-ya-hajj-na-umrah\/"/);
assert.match(fr, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/bajeti-ya-hajj-na-umrah\/"/);
assert.match(hub, /href="\/sw\/zana\/bajeti-ya-hajj-na-umrah\/"/);
assert.equal(fs.existsSync(path.join(root, manifest.artwork.replace(/^\//, ''))), true);
assert.match(registry, /id: "zana-bajeti-ya-hajj-na-umrah-sw".+href: "\/sw\/zana\/bajeti-ya-hajj-na-umrah\/".+lang: 'sw'/);
const engineSource = read('assets/js/engines/hajj-budget.js');
assert.match(engineSource, /var subtotal = \(packageCost \+ cashBudget\) \* travelers;/);
assert.match(engineSource, /var subtotal = \(basePackageUsd \+ dailyAllowancePerTraveler\) \* travelers \* originData\.multiplier;/);
assert.match(engineSource, /var total = subtotal \* \(1 \+ buffer \/ 100\);/);
assert.match(engineSource, /'\(\(packageCost \+ cashBudget\) \* travelers\) \* \(1 \+ buffer \/ 100\)'/);
assert.match(engineSource, /'\(\(packageUsd \* tripFactor \+ 45 \* days\) \* travelers \* originMultiplier\) \* \(1 \+ buffer \/ 100\)'/);

console.log('sw-hajj-budget.test.js passed: both English-owner formulas, boundaries, native source, exports and existing discovery');
