'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const pdfJs = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

const ROOT = path.resolve(__dirname, '..');
const CATEGORY_KEYS = new Set(['legal', 'government', 'insurance']);
const inventory = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.json'),
  'utf8'
));
const rows = inventory.rows.filter((row) => CATEGORY_KEYS.has(row.categoryKey));

function normalize(route) {
  return route === '/' ? route : String(route).replace(/\/+$/, '');
}

function routeFile(route) {
  return path.join(ROOT, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function testValue(field) {
  const value = Object.prototype.hasOwnProperty.call(field, 'testFixtureValue')
    ? field.testFixtureValue
    : field.fixtureValue;
  return field.type === 'checkbox' ? value === 'true' : value;
}

function registryRows() {
  const sandbox = {
    window: {},
    document: {
      readyState: 'complete',
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      getElementById() { return null; },
      querySelector() { return null; },
      createElement() { return {}; },
      head: { appendChild() {} }
    },
    CustomEvent: function CustomEvent() {}
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8'),
    sandbox
  );
  return sandbox.AFRO_TOOLS;
}

test('exact scoped denominator is 66 + 15 + 16', () => {
  assert.equal(rows.length, 97);
  assert.equal(rows.filter((row) => row.categoryKey === 'legal').length, 66);
  assert.equal(rows.filter((row) => row.categoryKey === 'government').length, 15);
  assert.equal(rows.filter((row) => row.categoryKey === 'insurance').length, 16);
  assert.ok(rows.every((row) => row.state === 'localized-shell-candidate'));
  assert.ok(rows.every((row) => row.primarySwahiliRoute));
});

test('all 97 owners are native Swahili documents with self canonical metadata', () => {
  for (const row of rows) {
    const html = fs.readFileSync(routeFile(row.primarySwahiliRoute), 'utf8');
    const route = normalize(row.primarySwahiliRoute);
    assert.match(html, /<html\b[^>]*\blang=["']sw["']/i, row.englishId);
    assert.match(
      html,
      new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']https://afrotools\\.com${route}/?["']`, 'i'),
      `canonical ${row.englishId}`
    );
    assert.match(html, /hreflang=["']en["']/i, `English alternate ${row.englishId}`);
    assert.match(html, /hreflang=["']sw["']/i, `Swahili alternate ${row.englishId}`);
    assert.match(html, /property=["']og:title["']/i, `OG title ${row.englishId}`);
    assert.match(html, /property=["']og:description["']/i, `OG description ${row.englishId}`);
    assert.match(html, /application\/ld\+json/i, `schema ${row.englishId}`);
    assert.match(html, /["']inLanguage["']\s*:\s*["']sw["']/i, `schema language ${row.englishId}`);
    assert.doesNotMatch(html, /<iframe\b/i, `iframe forbidden ${row.englishId}`);
    assert.doesNotMatch(html, /\bfetch\s*\(\s*["']\/tools\//i, `English HTML fetch forbidden ${row.englishId}`);
    assert.doesNotMatch(html, /afrotools-(?:locale|language)-fallback["'][^>]*content=["']en/i, `fallback forbidden ${row.englishId}`);
  }
});

test('all 97 routes have exactly one Swahili registry owner', () => {
  const registry = registryRows();
  for (const row of rows) {
    const matches = registry.filter((item) => (
      item.lang === 'sw'
      && item.sourceId === row.englishId
      && normalize(item.href) === normalize(row.primarySwahiliRoute)
    ));
    assert.equal(matches.length, 1, `registry owner ${row.englishId}`);
  }
});

test('all 97 owners use available canonical artwork', () => {
  for (const row of rows) {
    const artwork = path.join(ROOT, 'assets', 'img', 'tools', `${row.englishId}.webp`);
    assert.ok(fs.existsSync(artwork), `artwork ${row.englishId}`);
    assert.ok(fs.statSync(artwork).size > 100, `non-empty artwork ${row.englishId}`);
  }
});

test('13 legal/property gaps execute the shared English-owner engine', () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data/registry/swahili-legal-property-gaps.json'),
    'utf8'
  ));
  const engine = require('../assets/js/engines/french-mortgage-property.js');
  global.window = {};
  require('../engines/src/legal-engine.js');
  const legalEngine = global.window.AfroTools.LegalEngine;
  assert.equal(manifest.count, 13);
  for (const contract of manifest.rows) {
    const input = Object.fromEntries(contract.fields.map((field) => [
      field.name,
      testValue(field)
    ]));
    const result = engine.run(contract, input, { legalEngine });
    assert.equal(result.ok, true, contract.englishId);
    assert.ok(Object.keys(result.resultFields || {}).length > 0, contract.englishId);
  }
  delete global.window;
});

test('tenant-planning family has exact route-owned calculations and discovery contracts', () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data/registry/swahili-legal-property-gaps.json'),
    'utf8'
  ));
  const contracts = new Map(manifest.rows.map((row) => [row.englishId, row]));
  const registry = registryRows();
  const hub = fs.readFileSync(path.join(ROOT, 'sw/nyumba-na-ardhi/index.html'), 'utf8');
  const aiCatalog = fs.readFileSync(path.join(ROOT, 'data/ai/tool-catalog-pack.json'), 'utf8');
  const expected = {
    'tenancy-deposit': {
      route: '/sw/zana/amana-ya-upangaji/',
      engine: 'mortgage-property-english-owner',
      results: {
        avance: 6000000,
        depot: 500000,
        honorairesAgent: 600000,
        fraisJuridiques: 300000,
        chargesService: 0,
        coutEntree: 7400000,
        devise: 'NGN'
      }
    },
    'rent-affordability': {
      route: '/sw/zana/uwezo-wa-kulipa-pango/',
      engine: 'property-assumption',
      results: { loyer: 1200, plafond: 1500, avance: 2400, devise: 'XOF' }
    }
  };
  const engine = require('../assets/js/engines/french-mortgage-property.js');
  global.window = {};
  delete require.cache[require.resolve('../engines/src/legal-engine.js')];
  require('../engines/src/legal-engine.js');
  const legalEngine = global.window.AfroTools.LegalEngine;

  for (const [englishId, oracle] of Object.entries(expected)) {
    const contract = contracts.get(englishId);
    assert.ok(contract, englishId);
    assert.equal(contract.swahiliRoute, oracle.route);
    assert.equal(contract.sharedEngine, oracle.engine);
    assert.equal(contract.clearStaleOnInput, true);
    assert.equal(contract.parserValidPdf, true);
    const input = Object.fromEntries(contract.fields.map((field) => [
      field.name,
      testValue(field)
    ]));
    const result = engine.run(contract, input, { legalEngine });
    assert.equal(result.ok, true, englishId);
    assert.deepEqual({ ...result.resultFields }, oracle.results, englishId);

    const html = fs.readFileSync(routeFile(oracle.route), 'utf8');
    assert.match(html, /data-sw-legal-property-app/);
    assert.match(html, /build-sw-legal-government-insurance-parity\.js/);
    assert.match(html, /--sw-mp-control-border:#64748b/);
    assert.match(html, /--sw-mp-control-border:#76869c/);
    assert.match(html, /outline:3px solid var\(--sw-mp-focus\)!important/);
    assert.match(html, /<script src="\/assets\/js\/supabase\.min\.js(?:\?v=[a-f0-9]{8})?"><\/script>/);
    assert.doesNotMatch(html, /\bswpCalc\s*\(/, `${englishId} generic shell`);
    assert.equal(
      registry.filter((row) => row.lang === 'sw'
        && row.sourceId === englishId
        && normalize(row.href) === normalize(oracle.route)).length,
      1,
      `${englishId} registry row`
    );
    assert.equal(hub.split(`href="${oracle.route}"`).length - 1, 1, `${englishId} hub link`);
    assert.match(aiCatalog, new RegExp(`"id"\\s*:\\s*"${englishId}"`), `${englishId} AI catalog`);
    assert.ok(fs.statSync(path.join(ROOT, `assets/img/tools/${englishId}.webp`)).size > 100);

    for (const ownerRoute of [
      `/tools/${englishId}/`,
      contract.frenchRoute.endsWith('/') ? contract.frenchRoute : `${contract.frenchRoute}/`
    ]) {
      const ownerHtml = fs.readFileSync(routeFile(ownerRoute), 'utf8');
      assert.match(
        ownerHtml,
        new RegExp(`hreflang=["']sw["'][^>]+href=["']https://afrotools\\.com${oracle.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i'),
        `${englishId} reciprocal ${ownerRoute}`
      );
    }
  }
  delete global.window;
});

test('tenant-planning owner defaults and every tenancy country preset match English', () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data/registry/swahili-legal-property-gaps.json'),
    'utf8'
  ));
  const contracts = new Map(manifest.rows.map((row) => [row.englishId, row]));
  const tenancy = contracts.get('tenancy-deposit');
  const affordability = contracts.get('rent-affordability');
  const initials = (contract) => Object.fromEntries(contract.fields.map((field) => [
    field.name,
    field.initialValue
  ]));

  assert.deepEqual(initials(tenancy), {
    country: 'ng',
    rent: '500000',
    advanceMonths: '12',
    depositMonths: '1',
    agentFee: '10',
    legalFee: '5',
    serviceCharge: '0'
  });
  assert.deepEqual(tenancy.countryPresets, {
    ng: { rent: '500000', advanceMonths: '12', depositMonths: '1', agentFee: '10', legalFee: '5', serviceCharge: '0' },
    ke: { rent: '50000', advanceMonths: '1', depositMonths: '1', agentFee: '8.33', legalFee: '0', serviceCharge: '0' },
    za: { rent: '12000', advanceMonths: '1', depositMonths: '2', agentFee: '0', legalFee: '0', serviceCharge: '0' },
    gh: { rent: '3000', advanceMonths: '12', depositMonths: '1', agentFee: '10', legalFee: '5', serviceCharge: '0' }
  });
  assert.deepEqual(initials(affordability), {
    currency: 'sarafu yako',
    income: '',
    rent: '',
    ratio: '',
    advance: ''
  });
  assert.ok(affordability.fields.every((field) => !Object.prototype.hasOwnProperty.call(field, 'fixtureValue')));
});

test('rent affordability preserves every English DOM constraint and marks its unavailable source', () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data/registry/swahili-legal-property-gaps.json'),
    'utf8'
  ));
  const affordability = manifest.rows.find((row) => row.englishId === 'rent-affordability');
  const constraints = Object.fromEntries(affordability.fields.map((field) => [
    field.name,
    Object.fromEntries(['type', 'min', 'max', 'step', 'required']
      .filter((key) => Object.prototype.hasOwnProperty.call(field, key))
      .map((key) => [key, field[key]]))
  ]));

  assert.deepEqual(constraints, {
    currency: { type: 'text', required: true },
    income: { type: 'number', min: '0.01', step: 'any', required: true },
    rent: { type: 'number', min: '0', step: 'any', required: true },
    ratio: { type: 'number', min: '0', max: '100', step: 'any', required: true },
    advance: { type: 'number', min: '0', step: 'any', required: true }
  });
  assert.deepEqual(affordability.source, {
    url: '',
    label: 'UN-Habitat — kiungo cha chanzo cha nje hakipatikani; uthibitishaji wa mkono unahitajika',
    availability: 'unavailable',
    checkedAt: '2026-08-02',
    confidence: 'Hesabu ni thabiti kwa maingizo yako. Chanzo cha UN-Habitat kilirudisha 403 wakati wa ukaguzi; usichukulie uwiano kama kiwango kilichothibitishwa, cha kisheria, cha benki au cha kila mahali.'
  });
  const html = fs.readFileSync(routeFile(affordability.swahiliRoute), 'utf8');
  assert.match(html, /data-source-state="unavailable"/);
  assert.match(html, /uthibitishaji wa mkono unahitajika/);
  assert.doesNotMatch(html, /wcr_2026_chapter_3\.pdf/);
});

test('tenancy presets bind Lagos authority to Nigeria and mark the other three as planning defaults', () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data/registry/swahili-legal-property-gaps.json'),
    'utf8'
  ));
  const tenancy = manifest.rows.find((row) => row.englishId === 'tenancy-deposit');
  assert.deepEqual(Object.fromEntries(Object.entries(tenancy.jurisdictionSources).map(([country, source]) => [
    country,
    { jurisdiction: source.jurisdiction, availability: source.availability, hasOfficialUrl: Boolean(source.url) }
  ])), {
    ng: { jurisdiction: 'Nigeria — Jimbo la Lagos', availability: 'official-source', hasOfficialUrl: true },
    ke: { jurisdiction: 'Kenya', availability: 'planning-default', hasOfficialUrl: false },
    za: { jurisdiction: 'Afrika Kusini', availability: 'planning-default', hasOfficialUrl: false },
    gh: { jurisdiction: 'Ghana', availability: 'planning-default', hasOfficialUrl: false }
  });
  assert.match(tenancy.jurisdictionSources.ng.confidence, /Nigeria, Jimbo la Lagos pekee/);
  for (const country of ['ke', 'za', 'gh']) {
    assert.match(tenancy.jurisdictionSources[country].label, /thamani za mwanzo za kupanga/);
    assert.match(tenancy.jurisdictionSources[country].confidence, /si ada, desturi au sheria rasmi/);
  }
});

test('the registry delta adds exactly two rows and preserves all 11 coordinator rows byte-identically', () => {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'data/registry/swahili-legal-property-gaps.json'),
    'utf8'
  ));
  const coordinatorRowHashes = {
    'leave-days': '4eaad00dcbaaa96edd22687a6008244dd8aeecb684366fc69e9473bb6e593930',
    'stamp-duty': '897bddb930c8858bc5ca1ded435ce8ac057ff1e635147c1d6da239139141c922',
    'rent-intelligence': '910e11ce7ff626b95edb4cc2bedccd73ca795dd275090808dcb6910f71edc53b',
    'lease-risk-check': 'b9ca41b02119f330a9cbf89fd9e8893af97751a925964991f57c4771d310b556',
    'rental-agreement': '73c4aff133c1fb01ec6e06bd69ba4d9c02a8a17d31a12a4301f7c67bc08ccfc3',
    'survey-cost': '21c64c040045b25ccacb4e67fb23d97182976b521bf765f4f18ad571e243c6e5',
    'plot-converter': 'e51c39d461bcac6e843997fd1f0496f855603ccc838aec7a1c9f09a6510003c3',
    'ng-nhf': '177890a9c30e9ee21471518056c2229e1ca929b493f1e62762828c1cc47d3654',
    'ip-rights-africa': '9cf2e1393a266ab433d0eddafb61e5794b9084b647d232a5f6e86fcd77c39349',
    'inheritance-tax': 'd71d15b338a6d85e63fe3715b654ebf8678bbf981eef08f5110985a44bdcc18c',
    'ip-protection': 'b32c4261d7ab82daf4d29647ed6308f1b8fe6018cf80bc92a4f7e315d4536321'
  };
  const ids = manifest.rows.map((row) => row.englishId);
  assert.deepEqual(ids.filter((id) => !Object.hasOwn(coordinatorRowHashes, id)), [
    'tenancy-deposit',
    'rent-affordability'
  ]);
  for (const [englishId, expectedHash] of Object.entries(coordinatorRowHashes)) {
    const row = manifest.rows.find((candidate) => candidate.englishId === englishId);
    const actualHash = crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');
    assert.equal(actualHash, expectedHash, englishId);
    assert.equal(Object.hasOwn(row, 'clearStaleOnInput'), false, englishId);
    assert.equal(Object.hasOwn(row, 'parserValidPdf'), false, englishId);
  }
});

test('Swahili local PDF wraps long text and reopens through PDF.js inside page bounds', async () => {
  const pdf = require('../assets/js/lib/swahili-local-pdf.js');
  const longLine = `Chanzo: ${'Mpango wa upangaji wa nyumba unaohitaji uthibitisho wa mamlaka na mtaalamu. '.repeat(3)}`;
  const plan = pdf.layout('Ripoti ya kupanga pango', [longLine]);
  const bytes = Buffer.from(await pdf.create('Ripoti ya kupanga pango', [longLine]));
  const parsed = await pdfJs.getDocument({ data: new Uint8Array(bytes) }).promise;
  const parsedPage = await parsed.getPage(1);
  const parsedText = (await parsedPage.getTextContent()).items.map((item) => item.str).join(' ');

  assert.equal(parsed.numPages, 1);
  assert.match(parsedText, /Ripoti ya kupanga pango/);
  assert.ok(plan.rows.length > 2, 'long line must wrap');
  for (const row of plan.rows) {
    assert.ok(row.x >= plan.page.margin);
    assert.ok(row.y >= plan.page.margin);
    assert.ok(row.y <= plan.page.height - plan.page.margin);
    assert.ok(
      row.x + pdf.measureText(row.text, row.fontSize) <= plan.page.width - plan.page.margin + 0.01,
      row.text
    );
  }
  if (parsed.destroy) await parsed.destroy();
});

test('Government and Insurance shared engines reject invalid state and compute fixtures', () => {
  const government = require('../assets/js/engines/government-parity-engine.js');
  const insurance = require('../assets/js/pages/insurance-assumption-workflow.js');
  assert.equal(government.calculatePension({
    monthlyContribution: -1, currentBalance: 0, years: 10, annualRate: 5
  }).ok, false);
  assert.equal(government.calculatePermit({
    mainApplicants: 1, dependants: 0, mainFee: 100, dependantFee: 50,
    supportingCosts: 20, professionalCosts: 0, travelCosts: 0, otherCosts: 0,
    contingencyRate: 10
  }).total, 132);
  assert.equal(insurance.calculate('quote', {
    exposure: 10000, rate: 2, fixed: 50, contingency: 10
  }).total, 275);
  assert.equal(insurance.calculate('quote', {
    exposure: 0, rate: 2, fixed: 50, contingency: 10
  }).ok, false);
});

test('the 21 generated gaps are idempotent and source-owned', () => {
  const { LEGAL, GOVERNMENT, INSURANCE } = require('../scripts/build-sw-legal-government-insurance-parity.js');
  assert.equal(Object.keys(LEGAL).length, 13);
  assert.equal(Object.keys(GOVERNMENT).length, 6);
  assert.equal(Object.keys(INSURANCE).length, 2);
  const gapRoutes = [...Object.values(LEGAL), ...Object.values(GOVERNMENT), ...Object.values(INSURANCE)]
    .map((value) => value.route || value[0]);
  for (const route of gapRoutes) {
    const html = fs.readFileSync(routeFile(route), 'utf8');
    assert.match(html, /build-sw-legal-government-insurance-parity\.js/);
  }
});

test('the 21 reconciled owners have reciprocal French or Hausa hreflang', () => {
  const { RECIPROCAL_LOCALE_OWNERS } = require('../scripts/build-sw-legal-government-insurance-parity.js');
  assert.equal(Object.keys(RECIPROCAL_LOCALE_OWNERS).length, 21);
  const byId = new Map(rows.map((row) => [row.englishId, row]));
  for (const [englishId, ownerRoutes] of Object.entries(RECIPROCAL_LOCALE_OWNERS)) {
    const swahiliRoute = `${normalize(byId.get(englishId).primarySwahiliRoute)}/`;
    for (const ownerRoute of ownerRoutes) {
      const ownerHtml = fs.readFileSync(routeFile(ownerRoute), 'utf8');
      assert.match(
        ownerHtml,
        new RegExp(`hreflang=["']sw["'][^>]+href=["']https://afrotools\\.com${swahiliRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i'),
        `${englishId} reciprocal owner ${ownerRoute}`
      );
    }
  }
  const nhf = fs.readFileSync(routeFile('/sw/zana/kikokotoo-nhf-nigeria/'), 'utf8');
  assert.match(nhf, /hreflang=["']ha["'][^>]+href=["']https:\/\/afrotools\.com\/ha\/kayan-aiki\/nhf-najeriya\/["']/i);
});
