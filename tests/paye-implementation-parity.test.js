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
 * Egypt also applies bracket exclusion: past each threshold the taxpayer stops
 * benefiting from a lower bracket. All three implementations model that as a
 * table of "extra tax" per lost bracket, each entry being bandWidth x bandRate:
 *
 *     band 0   40,000 x 0%     =       0
 *     band 1   15,000 x 10%    =   1,500
 *     band 2   15,000 x 15%    =   2,250
 *     band 3  130,000 x 20%    =  26,000
 *     band 4  200,000 x 22.5%  =  45,000
 *     band 5  800,000 x 25%    = 200,000
 *
 * The page sums every entry whose threshold is passed. The frontend engine and
 * the backend function add only the last matching entry — but their final table
 * value is 274,750, which is the cumulative total of all six, not 200,000.
 * So their intended semantics is plainly "the last rule carries the running
 * total", and only that final entry was ever converted. The five below it are
 * still per-band values being read as though cumulative.
 *
 * The consequence is a real under-statement, not a rounding difference:
 *
 *     bands 0..2 excluded   page   3,750   engine/backend   2,250   short  1,500
 *     bands 0..3 excluded   page  29,750   engine/backend  26,000   short  3,750
 *     bands 0..4 excluded   page  74,750   engine/backend  45,000   short 29,750
 *
 * That is taxable income above 800,000 and up to 1,200,000, or roughly
 * 839,000 to 1,239,000 gross.
 *
 * This test does not pick a winner. Which reading is correct is a question for
 * the Egyptian Income Tax Law and the ETA schedule, and .claude/rules/salary-tax.md
 * is explicit that a band or relief may only move after reading the operative
 * instrument. So parity is enforced everywhere the three already agree, and the
 * divergence is asserted to still exist — pinned, visible on every run, and
 * impossible to "fix" on one side alone without this failing.
 */
const EG_AGREED_SALARIES = [60000, 120000, 240000, 600000, 700000, 800000, 1300000, 1600000];

// Gross salaries whose taxable income falls in the disputed exclusion range.
const EG_DISPUTED = [
  { gross: 900000, excludedBands: 2 },
  { gross: 1000000, excludedBands: 3 },
  { gross: 1200000, excludedBands: 4 }
];
const EG_EXPECTED_SHORTFALL = { 2: 1500, 3: 3750, 4: 29750 };

check('Egypt: page, frontend engine and backend agree outside the disputed exclusion range', () => {
  const engine = loadFrontendEngine('assets/js/engines/eg-paye.js', 'egPAYE');
  const backend = loadBackend('netlify/functions/_engines/eg-paye.js');

  for (const gross of EG_AGREED_SALARIES) {
    const page = runPage('egypt/eg-paye.html', { inputs: { grossSalary: gross }, toggles: ['nosi'] });
    const fromEngine = engine.calculate(gross, { nosi: true });
    const fromBackend = backend.calculate({ grossAnnual: gross, nosi: true });

    agree(`EG ${gross} page vs engine (tax)`, page.tax, fromEngine.tax);
    agree(`EG ${gross} page vs backend (tax)`, page.tax, fromBackend.tax.netTax);
    agree(`EG ${gross} page vs engine (NOSI)`, page.nosi, fromEngine.nosi);
    agree(`EG ${gross} page vs engine (taxable)`, page.nati, fromEngine.nati);
  }
});

check('Egypt: the bracket-exclusion divergence is still exactly as recorded', () => {
  const engine = loadFrontendEngine('assets/js/engines/eg-paye.js', 'egPAYE');
  const backend = loadBackend('netlify/functions/_engines/eg-paye.js');

  for (const { gross, excludedBands } of EG_DISPUTED) {
    const page = runPage('egypt/eg-paye.html', { inputs: { grossSalary: gross }, toggles: ['nosi'] });
    const fromEngine = engine.calculate(gross, { nosi: true });
    const fromBackend = backend.calculate({ grossAnnual: gross, nosi: true });
    const expected = EG_EXPECTED_SHORTFALL[excludedBands];

    // Engine and backend must at least agree with each other.
    agree(`EG ${gross} engine vs backend`, fromEngine.tax, fromBackend.tax.netTax);

    const shortfall = page.tax - fromEngine.tax;
    assert.strictEqual(
      Math.round(shortfall), expected,
      `EG ${gross}: the page/engine gap is now ${Math.round(shortfall)}, recorded as ${expected}. ` +
      'If this was resolved against the Egyptian Income Tax Law, delete this check and fold ' +
      `these salaries into EG_AGREED_SALARIES. If it moved by accident, one side has drifted.`
    );
    console.log(`     note: EG ${gross} — page ${Math.round(page.tax)}, engine/backend ` +
      `${Math.round(fromEngine.tax)}, unresolved gap ${expected} (bands 0..${excludedBands} excluded)`);
  }
});

/* ── The constants each implementation carries ──────────────────────────── */
check('Egypt: the three implementations share the same statutory constants', () => {
  const engine = loadFrontendEngine('assets/js/engines/eg-paye.js', 'egPAYE');
  const pageHtml = fs.readFileSync(path.join(ROOT, 'egypt/eg-paye.html'), 'utf8');
  assert.strictEqual(engine.PERSONAL_EXEMPTION, 20000, 'engine personal exemption');
  assert.strictEqual(engine.DISABLED_PERSONAL_EXEMPTION, 30000, 'engine disabled exemption');
  assert.strictEqual(engine.NOSI_RATE, 0.11, 'engine NOSI rate');
  assert.strictEqual(engine.NOSI_ANNUAL_CAP, 174000, 'engine NOSI cap');
  for (const literal of ['20000', '30000', '0.11', '174000']) {
    assert(pageHtml.includes(literal), `page no longer contains the constant ${literal}`);
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
