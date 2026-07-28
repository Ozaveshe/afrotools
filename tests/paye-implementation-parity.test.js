#!/usr/bin/env node
'use strict';

/**
 * Egypt and Tanzania each compute PAYE three separate times:
 *
 *   1. inline in the page          egypt/eg-paye.html, tanzania/tz-paye.html
 *   2. a shared frontend engine    assets/js/engines/{eg,tz}-paye.js
 *   3. a serverless function       netlify/functions/_engines/{eg,tz}-paye.js
 *
 * Nothing tied them together. That is exactly the setup behind the bug
 * .claude/rules/salary-tax.md was written about:
 *
 *   "The shared assets/js/engines/ke-paye.js was already correct; the page had
 *    its own inline logic that was not. […] confirm the page's inline
 *    calculator matches the shared engine."
 *
 * The July 2026 audit compared them by hand and found no divergence. This test
 * makes that permanent: if any one of the three moves without the others, it
 * fails and names the pair that disagreed.
 *
 * It deliberately asserts agreement, not correctness. Whether a band is right
 * is a question for the gazetted schedule and the source ledger; this only
 * guarantees a taxpayer sees the same number wherever they ask.
 *
 * Run: node tests/paye-implementation-parity.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

/* ── 1. The page, run headless ─────────────────────────────────────────────
 * The inline script is a browser program: it wires listeners, draws a chart and
 * writes into the DOM. Running it needs a stub broad enough that top-level code
 * completes, after which calculate() populates the global RESULT.
 */
function runPage(pageRel, { inputs = {}, toggles = [] } = {}) {
  const html = fs.readFileSync(path.join(ROOT, pageRel), 'utf8');
  const blocks = [...html.matchAll(
    /<script(?![^>]*\bsrc=)(?![^>]*ld\+json)(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/gi
  )].map((m) => m[1]);
  const js = blocks.join('\n');

  const els = Object.create(null);
  const makeEl = (id) => {
    if (els[id]) return els[id];
    els[id] = {
      id,
      value: inputs[id] !== undefined ? String(inputs[id]) : '',
      textContent: '', innerHTML: '', checked: false, dataset: {}, style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, click() {},
      setAttribute() {}, removeAttribute() {}, getAttribute: () => null,
      querySelector: () => null, querySelectorAll: () => [],
      appendChild() {}, insertAdjacentHTML() {}, scrollIntoView() {},
      getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
      getContext: () => null
    };
    return els[id];
  };

  // isOn(tog) reads document.querySelector('[data-tog="x"]').classList.contains('on').
  const toggleEl = (name) => ({
    classList: { contains: (cls) => cls === 'on' && toggles.includes(name), add() {}, remove() {} }
  });

  const doc = {
    getElementById: makeEl,
    querySelector(sel) {
      const m = /\[data-tog="([^"]+)"\]/.exec(sel);
      return m ? toggleEl(m[1]) : null;
    },
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: () => makeEl('__created'),
    body: makeEl('__body'),
    documentElement: makeEl('__html'),
    readyState: 'complete'
  };

  const sandbox = {
    document: doc,
    console: { log() {}, warn() {}, error() {} },
    Math, JSON, Date, Number, String, Array, Object, RegExp, Error, Promise,
    parseFloat, parseInt, isNaN, isFinite, Intl, URL, URLSearchParams,
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {},
    requestAnimationFrame() {}, getComputedStyle: () => ({ getPropertyValue: () => '' }),
    matchMedia: () => ({ matches: false, addListener() {}, addEventListener() {} }),
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: {}, location: { href: '', search: '', pathname: '' },
    history: { replaceState() {} },
    fetch: () => Promise.reject(new Error('network disabled in tests')),
    alert() {}, gtag() {}, dataLayer: [],
    addEventListener() {}, removeEventListener() {},
    Chart: function Chart() {},
    AfroChartColors: new Proxy({}, { get: () => '#000' }),
    AfroTools: {}
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(js, sandbox, { timeout: 10000, filename: pageRel });
  sandbox.calculate();
  assert(sandbox.RESULT, `${pageRel}: calculate() left RESULT unset`);
  return sandbox.RESULT;
}

/* ── 2. The shared frontend engine ─────────────────────────────────────── */
function loadFrontendEngine(rel, key) {
  const sandbox = {
    window: {}, module: { exports: {} }, exports: {},
    console: { log() {}, warn() {}, error() {} },
    Math, JSON, Date, Number, String, Array, Object,
    parseFloat, parseInt, isNaN, isFinite
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
  const engines = sandbox.window.AfroTools && sandbox.window.AfroTools.engines;
  assert(engines && engines[key], `${rel}: expected AfroTools.engines.${key}`);
  return engines[key];
}

/* ── 3. The serverless function ────────────────────────────────────────── */
function loadBackend(rel) {
  return require(path.join(ROOT, rel));
}

let failures = 0;
function check(label, fn) {
  try { fn(); console.log(`PASS ${label}`); }
  catch (error) { failures += 1; console.error(`FAIL ${label}`); console.error('     ' + (error.message || error)); }
}

/** Agreement to the nearest whole currency unit; the three round at different points. */
function agree(label, a, b, tolerance = 1) {
  assert(
    Math.abs(a - b) <= tolerance,
    `${label}: ${a} vs ${b} (difference ${Math.abs(a - b).toFixed(2)}, tolerance ${tolerance})`
  );
}

/* ── Tanzania ──────────────────────────────────────────────────────────────
 * Monthly bands: 270,000 at 0%, then 8%, 20%, 25%, 30%. NSSF is a 10% employee
 * deduction for the private sector and reduces the taxable base.
 */
const TZ_SALARIES = [300000, 500000, 760000, 1000000, 2000000, 5000000];

check('Tanzania: page, frontend engine and backend agree on monthly PAYE', () => {
  const engine = loadFrontendEngine('assets/js/engines/tz-paye.js', 'tzPAYE');
  const backend = loadBackend('netlify/functions/_engines/tz-paye.js');

  for (const gross of TZ_SALARIES) {
    const page = runPage('tanzania/tz-paye.html', {
      inputs: { grossSalary: gross },
      toggles: ['nssf']
    });
    const fromEngine = engine.calculate(gross, { sector: 'private', nssf: true });
    const fromBackend = backend.calculate({ grossAnnual: gross * 12 });

    agree(`TZ ${gross} page vs engine (PAYE)`, page.monthlyPAYE, fromEngine.paye);
    agree(`TZ ${gross} page vs backend (PAYE)`, page.monthlyPAYE, fromBackend.tax.netTax / 12);
    agree(`TZ ${gross} page vs engine (NSSF)`, page.social, fromEngine.socialEmployee);
    agree(`TZ ${gross} page vs backend (NSSF)`, page.social, fromBackend.deductions.nssf / 12);
    agree(`TZ ${gross} page vs backend (net)`, page.netMonthly, fromBackend.result.netMonthly);
  }
});

/* ── Egypt ─────────────────────────────────────────────────────────────────
 * Annual bands on income after the personal exemption and NOSI (11% of
 * insurable pay, capped at 174,000).
 *
 * Egypt also applies bracket exclusion ("tiering"): past each threshold the
 * lower brackets are WITHDRAWN, and the income they covered is taxed at the
 * first surviving rate. It re-rates income already counted; it is not a
 * surcharge stacked on top of the standard band tax.
 *
 * Every implementation used to model it as a table of "extra tax" per lost
 * bracket, each entry being bandWidth x its OWN rate (0 / 1,500 / 2,250 /
 * 26,000 / 45,000 / 200,000). That is the tax the withdrawn band already
 * collected — the wrong quantity entirely — and the four implementations then
 * disagreed about how to combine it. The page summed every entry passed; the
 * engine and the backend took only the last. Neither produced the statutory
 * figure, and the backend's reading was provably impossible: it returned a
 * 43.6% effective rate at 1,300,000 gross against a 27.5% top marginal rate.
 *
 * The rule is now derived from ETA_BANDS in all four, so it cannot drift from
 * the bands, and asserted below against the published table rather than
 * against another implementation.
 *
 * The four implementations Egypt ships:
 *   1. egypt/eg-paye.html                          (inline)
 *   2. sw/egypt/kikokotoo-kodi-mshahara/index.html (inline, Swahili)
 *   3. assets/js/engines/eg-paye.js                (browser engine)
 *   4. netlify/functions/_engines/eg-paye.js       (serverless)
 */
const EG_SALARIES = [
  60000, 120000, 240000, 600000, 700000, 800000,
  900000, 1000000, 1100000, 1200000, 1300000, 1600000, 2000000, 3000000
];

/* The ETA tiering table transcribed literally — six columns of net taxable
 * income, each listing the brackets that survive at that level. Reproduced by
 * Deloitte Middle East ("amendment introduced to tax brackets") and by Andersen
 * Egypt ("Egypt's Personal Income Tax in 2026"), which carries the current
 * 40,000 / 55,000 / 70,000 thresholds. Written out as [bracketTop, rate] so it
 * shares no code with the implementations it checks.
 */
const EG_TIER_TABLE = [
  { max: 600000,   brackets: [[40000, 0], [55000, 0.10], [70000, 0.15], [200000, 0.20], [400000, 0.225], [1200000, 0.25], [Infinity, 0.275]] },
  { max: 700000,   brackets: [[55000, 0.10], [70000, 0.15], [200000, 0.20], [400000, 0.225], [Infinity, 0.25]] },
  { max: 800000,   brackets: [[70000, 0.15], [200000, 0.20], [400000, 0.225], [Infinity, 0.25]] },
  { max: 900000,   brackets: [[200000, 0.20], [400000, 0.225], [Infinity, 0.25]] },
  { max: 1200000,  brackets: [[400000, 0.225], [Infinity, 0.25]] },
  { max: Infinity, brackets: [[1200000, 0.25], [Infinity, 0.275]] }
];

function egTaxFromTable(nati) {
  const tier = EG_TIER_TABLE.find((t) => nati <= t.max);
  let tax = 0;
  let previousTop = 0;
  for (const [top, rate] of tier.brackets) {
    const inBracket = Math.min(nati, top) - previousTop;
    if (inBracket <= 0) break;
    tax += inBracket * rate;
    previousTop = top;
  }
  return tax;
}

check('Egypt: all four implementations agree, and match the published tiering table', () => {
  const engine = loadFrontendEngine('assets/js/engines/eg-paye.js', 'egPAYE');
  const backend = loadBackend('netlify/functions/_engines/eg-paye.js');

  for (const gross of EG_SALARIES) {
    const page = runPage('egypt/eg-paye.html', { inputs: { grossSalary: gross }, toggles: ['nosi'] });
    const swPage = runPage('sw/egypt/kikokotoo-kodi-mshahara/index.html', { inputs: { grossSalary: gross }, toggles: ['nosi'] });
    const fromEngine = engine.calculate(gross, { nosi: true });
    const fromBackend = backend.calculate({ grossAnnual: gross, nosi: true });

    agree(`EG ${gross} page vs engine (tax)`, page.tax, fromEngine.tax);
    agree(`EG ${gross} page vs backend (tax)`, page.tax, fromBackend.tax.netTax);
    agree(`EG ${gross} page vs Swahili page (tax)`, page.tax, swPage.tax);
    agree(`EG ${gross} page vs engine (NOSI)`, page.nosi, fromEngine.nosi);
    agree(`EG ${gross} page vs engine (taxable)`, page.nati, fromEngine.nati);

    // The table is the authority, not the other implementations.
    agree(`EG ${gross} engine vs ETA tiering table`, fromEngine.tax, egTaxFromTable(fromEngine.nati));
  }
});

check('Egypt: the exclusion tiers are the five the ETA table publishes', () => {
  const engine = loadFrontendEngine('assets/js/engines/eg-paye.js', 'egPAYE');

  // Five tiers, not six: the step after 900,000 is 1,200,000 — there is no
  // 1,000,000 tier — and the 25% bracket is never withdrawn.
  const thresholds = engine.EXCLUSION_RULES.map((r) => r.threshold);
  assert.strictEqual(thresholds.length, 5, `expected 5 exclusion tiers, got ${thresholds.length}`);
  [600000, 700000, 800000, 900000, 1200000].forEach((expected, i) => {
    assert.strictEqual(thresholds[i], expected, `exclusion threshold ${i}`);
  });

  // Derived, so these are the arithmetic the bands imply — not a typed table.
  const extras = engine.EXCLUSION_RULES.map((r) => r.extraTax);
  [4000, 6750, 10250, 15250, 25250].forEach((expected, i) => {
    assert.strictEqual(extras[i], expected, `exclusion extra for tier ${i}`);
  });

  // Tier k withdraws bands 0..k, taken whole rather than accumulated.
  engine.EXCLUSION_RULES.forEach((rule, k) => {
    assert.strictEqual(rule.excludedBands.length, k + 1, `tier ${k} withdrawn band count`);
    rule.excludedBands.forEach((band, i) => assert.strictEqual(band, i, `tier ${k} band ${i}`));
  });
});

check('Egypt: no salary produces an effective rate above the top marginal rate', () => {
  const engine = loadFrontendEngine('assets/js/engines/eg-paye.js', 'egPAYE');

  // The defect that exposed the bug: the shipped backend charged 43.6% at
  // 1,300,000 gross. Tax can never exceed the top marginal rate on the whole
  // of income, whatever the tiering does.
  for (let gross = 50000; gross <= 5000000; gross += 25000) {
    const { tax } = engine.calculate(gross, { nosi: true });
    assert(
      tax / gross <= 0.275,
      `EG ${gross}: effective rate ${(tax / gross * 100).toFixed(1)}% exceeds the 27.5% top marginal rate`
    );
  }
});

/* ── The constants each implementation carries ──────────────────────────── */
check('Egypt: the four implementations share the same statutory constants', () => {
  const engine = loadFrontendEngine('assets/js/engines/eg-paye.js', 'egPAYE');
  assert.strictEqual(engine.PERSONAL_EXEMPTION, 20000, 'engine personal exemption');
  assert.strictEqual(engine.DISABLED_PERSONAL_EXEMPTION, 30000, 'engine disabled exemption');
  assert.strictEqual(engine.NOSI_RATE, 0.11, 'engine NOSI rate');
  assert.strictEqual(engine.NOSI_ANNUAL_CAP, 174000, 'engine NOSI cap');

  const sources = [
    'egypt/eg-paye.html',
    'sw/egypt/kikokotoo-kodi-mshahara/index.html',
    'netlify/functions/_engines/eg-paye.js'
  ];
  for (const rel of sources) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const literal of ['20000', '30000', '0.11', '174000']) {
      assert(text.includes(literal), `${rel} no longer contains the constant ${literal}`);
    }
    // The phantom tier. Its removal is the fix; a reappearance is a regression.
    assert(
      !/threshold:\s*1000000/.test(text),
      `${rel} reintroduced a 1,000,000 exclusion tier — the ETA table steps from 900,000 to 1,200,000`
    );
  }
});

check('Tanzania: the frontend engine bands match the page bands', () => {
  const engine = loadFrontendEngine('assets/js/engines/tz-paye.js', 'tzPAYE');
  // Compare element by element rather than with deepStrictEqual. The engine is
  // evaluated in a vm realm, so its arrays do not share this realm's
  // Array.prototype and deepStrictEqual fails its prototype check even when
  // every value matches. Element-wise strictEqual also names the exact band
  // that moved. Note too that the open-ended top band's limit is Infinity,
  // which JSON.stringify renders as null — never diff these through JSON.
  const expected = [[270000, 0], [250000, 0.08], [240000, 0.2], [240000, 0.25], [Infinity, 0.3]];
  assert.strictEqual(engine.TRA_BANDS.length, expected.length, 'engine TRA_BANDS band count moved');
  expected.forEach(([limit, rate], i) => {
    assert.strictEqual(engine.TRA_BANDS[i].limit, limit, `engine TRA_BANDS[${i}].limit moved`);
    assert.strictEqual(engine.TRA_BANDS[i].rate, rate, `engine TRA_BANDS[${i}].rate moved`);
  });
  const pageHtml = fs.readFileSync(path.join(ROOT, 'tanzania/tz-paye.html'), 'utf8');
  for (const literal of ['270000', '520000', '760000', '1000000', '0.08', '0.20', '0.25', '0.30']) {
    assert(pageHtml.includes(literal), `page no longer contains the band literal ${literal}`);
  }
});

if (failures) {
  console.error(`\n${failures} parity check(s) failed.`);
  process.exit(1);
}
console.log('\nAll PAYE implementation parity checks passed.');
