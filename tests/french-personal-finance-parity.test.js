'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const runtime = require('../assets/js/pages/fr-personal-finance');
const router = require('../assets/js/ai/intent-router');
const manifestApi = require('../assets/js/ai/tool-manifest');

const APPS = [
  {
    id: '50-30-20-budget',
    app: 'budget-50-30-20',
    route: '/fr/tools/budget-50-30-20/',
    file: 'fr/tools/budget-50-30-20/index.html',
    englishHash: '3F6ADB5573A531A9F95DD700EB5179DF937B07A5F89F5DC096746000A32A2E07'
  },
  {
    id: 'album-budget',
    app: 'budget-album-ep',
    route: '/fr/tools/budget-album-ep/',
    file: 'fr/tools/budget-album-ep/index.html',
    englishHash: '51496064067D955FA69F3C39546215B3B6BA5DD69F4385FB5A1BABB9B0E24165'
  },
  {
    id: 'film-budget',
    app: 'budget-film',
    route: '/fr/tools/budget-film/',
    file: 'fr/tools/budget-film/index.html',
    englishHash: 'A18DEC00674BDF13113390C0AD7E54FC80E110295105583019E126F9A0C0A2EF'
  },
  {
    id: 'security-emergency-fund',
    app: 'fonds-urgence-securite',
    route: '/fr/tools/fonds-d-urgence-et-de-securite/',
    file: 'fr/tools/fonds-d-urgence-et-de-securite/index.html',
    englishHash: '7A12DC921FB947B0C27D2D6D182F842B453A44B7283847C11216AF0015CA9DA7'
  },
  {
    id: 'side-hustle-ranker',
    app: 'classement-activites',
    route: '/fr/tools/classement-d-activites-complementaires/',
    file: 'fr/tools/classement-d-activites-complementaires/index.html',
    englishHash: 'A75ABB8D4276632E138FABBF0F20B7AEEBDA01FE65826B17FEE7BFC0B67B8109'
  }
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function hash(relativePath) {
  const html = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  const executableInlineScripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc=|application\/(?:ld\+json|json)/i.test(match[1]))
    .map((match) => match[2].trim())
    .filter(Boolean)
    .join('\n');
  return crypto.createHash('sha256')
    .update(executableInlineScripts)
    .digest('hex')
    .toUpperCase();
}

function schemas(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}

test('the scoped generator owns exactly five canonical apps plus one French hub', () => {
  const check = spawnSync(process.execPath, ['scripts/build-french-personal-finance-parity.js', '--check'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.equal(check.status, 0, check.stderr || check.stdout);
  assert.match(check.stdout, /5\/5 canonical apps plus hub/);

  const hub = read('fr/personal-finance/index.html');
  assert.equal((hub.match(/class="pf-tool-card"/g) || []).length, 5);
  for (const app of APPS) assert.match(hub, new RegExp(`href="${app.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
});

test('the five English formula owners remain byte-for-byte frozen', () => {
  for (const app of APPS) {
    assert.equal(hash(`tools/${app.id}/index.html`), app.englishHash, app.id);
  }
});

test('50/30/20 French formula matches the frozen English arithmetic and fails closed', () => {
  const formula = runtime.formulas['budget-50-30-20'];
  assert.deepEqual(formula({ income: 300000, currentNeeds: 150000, currentWants: 90000, currentSavings: 60000 }), {
    ok: true,
    income: 300000,
    idealNeeds: 150000,
    idealWants: 90000,
    idealSavings: 60000,
    currentNeeds: 150000,
    currentWants: 90000,
    currentSavings: 60000,
    currentTotal: 300000,
    needsGap: 0,
    wantsGap: 0,
    savingsGap: 0,
    unallocated: 0
  });
  assert.deepEqual(formula({ income: 0, currentNeeds: 0, currentWants: 0, currentSavings: 0 }), {
    ok: false,
    field: 'income',
    error: 'Saisissez un revenu net mensuel supérieur à zéro.'
  });
});

test('album French formula matches production, visual, marketing, contingency and break-even fixtures', () => {
  const result = runtime.formulas['budget-album-ep']({
    tracks: 5,
    hoursPerTrack: 4,
    studioRate: 15000,
    beatCost: 50000,
    mixCost: 10000,
    masterCost: 30000,
    coverArt: 25000,
    photoShoot: 30000,
    musicVideo: 0,
    distroCost: 0,
    playlistBudget: 15000,
    adsBudget: 50000,
    prBudget: 20000,
    netPerStream: 5
  });
  assert.equal(result.ok, true);
  assert.equal(result.recordingCost, 300000);
  assert.equal(result.mixingCost, 50000);
  assert.equal(result.production, 430000);
  assert.equal(result.visuals, 55000);
  assert.equal(result.marketing, 85000);
  assert.equal(result.total, 570000);
  assert.equal(result.costPerTrack, 114000);
  assert.equal(result.contingency10, 57000);
  assert.equal(result.contingency20, 114000);
  assert.equal(result.breakEvenStreams, 114000);
  assert.equal(runtime.formulas['budget-album-ep']({ tracks: 0 }).ok, false);
});

test('film French formula preserves the 100% gate, department split, reserve and funding gap', () => {
  const formula = runtime.formulas['budget-film'];
  const result = formula({
    totalBudget: 20000000,
    shootDays: 10,
    cashSecured: 5000000,
    contingencyPct: 10,
    aboveLinePct: 30,
    productionPct: 45,
    postPct: 15,
    marketingPct: 10
  });
  assert.equal(result.ok, true);
  assert.equal(result.perDay, 2000000);
  assert.equal(result.aboveLine, 6000000);
  assert.equal(result.production, 9000000);
  assert.equal(result.post, 3000000);
  assert.equal(result.marketing, 2000000);
  assert.equal(result.contingency, 2000000);
  assert.equal(result.required, 22000000);
  assert.equal(result.gap, 17000000);
  assert.match(formula({
    totalBudget: 100,
    shootDays: 1,
    cashSecured: 0,
    contingencyPct: 10,
    aboveLinePct: 30,
    productionPct: 30,
    postPct: 10,
    marketingPct: 10
  }).error, /100 %/);
});

test('emergency-fund French formula matches the frozen target, tiers, gap and ceiling timeline', () => {
  const formula = runtime.formulas['fonds-urgence-securite'];
  const result = formula({
    monthlyExpenses: 150000,
    targetMonths: 3,
    oneOffCosts: 50000,
    currentSavings: 100000,
    monthlyContribution: 50000
  });
  assert.deepEqual(result, {
    ok: true,
    target: 500000,
    tier1: 200000,
    tier2: 500000,
    tier3: 950000,
    gap: 400000,
    monthsToGoal: 8
  });
  assert.equal(formula({
    monthlyExpenses: 150000,
    targetMonths: 25,
    oneOffCosts: 0,
    currentSavings: 0,
    monthlyContribution: 0
  }).field, 'targetMonths');
});

test('activity ranking preserves the English 60/20/20 score and stable English-owner tie break', () => {
  const formula = runtime.formulas['classement-activites'];
  const result = formula({ skills: ['writing'], hours: 10, capital: 2 });
  assert.equal(result.ok, true);
  assert.deepEqual(result.top5.map((item) => item.hustle.id), [
    'freelance_writing',
    'social_media_mgmt',
    'financial_consulting',
    'graphics_design',
    'beauty_hair'
  ]);
  assert.deepEqual(result.top5.slice(0, 2).map((item) => item.fit.score), [100, 100]);
  assert.equal(formula({ skills: [], hours: 0, capital: 0 }).field, 'hours');
  const html = read('fr/tools/classement-d-activites-complementaires/index.html');
  const hourValues = [...html.matchAll(/<option value="(\d+)"(?: selected)?>[^<]*heures[^<]*<\/option>/g)].map((match) => match[1]);
  assert.deepEqual(hourValues.slice(0, 4), ['5', '10', '20', '40']);
});

test('all five pages are native, private, export-capable and SEO/GEO complete', () => {
  const registry = read('assets/js/components/tool-registry.js');
  const englishHub = read('personal-finance/index.html');
  assert.match(englishHub, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/personal-finance\/"/);

  for (const app of APPS) {
    const html = read(app.file);
    assert.match(html, /<html\b[^>]*\blang="fr"/);
    assert.match(html, new RegExp(`<form data-personal-finance-form data-app="${app.app}"`));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com${app.route}"`));
    assert.match(html, new RegExp(`<meta property="og:url" content="https://afrotools.com${app.route}"`));
    assert.match(html, new RegExp(`hreflang="en" href="https://afrotools.com/tools/${app.id}/"`));
    assert.match(html, /hreflang="fr"/);
    assert.match(html, /data-action="save"/);
    assert.match(html, /data-action="restore"/);
    assert.match(html, /data-action="json"/);
    assert.match(html, /data-action="print"/);
    assert.match(html, /Aucun script d’analytique, appel d’IA, requête API ou envoi réseau/);
    assert.match(html, /Confiance :/);
    assert.match(html, /vérifiée le 18 juillet 2026/);
    assert.doesNotMatch(html, /<iframe|generated-fr-tool-bridge|fetch\s*\(|XMLHttpRequest|sendBeacon/i);
    assert.equal((html.match(/\/assets\/js\/lazy-analytics\.js/g) || []).length, 1, `${app.id} has one consent-aware analytics loader`);
    assert(fs.existsSync(path.join(ROOT, 'assets/img/tools', `${app.id}.webp`)), `${app.id} artwork`);

    const jsonLd = schemas(html);
    assert(jsonLd.some((item) => item['@type'] === 'SoftwareApplication' && item.inLanguage === 'fr'));
    assert(jsonLd.some((item) => item['@type'] === 'FAQPage' && item.inLanguage === 'fr'));
    assert(registry.includes(`sourceId: '${app.id}'`) || registry.includes(`sourceId: "${app.id}"`), `${app.id} registry owner`);
    assert(registry.includes(`href: '${app.route}'`) || registry.includes(`href: "${app.route}"`), `${app.id} registry href`);
  }
});

test('French AI discovery opens all five local routes without prefill or model use', () => {
  const manifest = manifestApi.getToolManifestForRouter();
  const cases = [
    ['Répartir mon salaire avec la règle 50 30 20', '50-30-20-budget', '/fr/tools/budget-50-30-20/?source=ask'],
    ['Préparer le budget de sortie de mon album', 'album-budget', '/fr/tools/budget-album-ep/?source=ask'],
    ['Répartir le budget de mon film', 'film-budget', '/fr/tools/budget-film/?source=ask'],
    ['Calculer mon fonds d urgence et de sécurité', 'security-emergency-fund', '/fr/tools/fonds-d-urgence-et-de-securite/?source=ask'],
    ['Classer mes idées d activité complémentaire selon mon temps mes compétences et mon capital', 'side-hustle-ranker', '/fr/tools/classement-d-activites-complementaires/?source=ask']
  ];
  for (const [query, id, route] of cases) {
    const decision = router.routeDeterministically(query, { manifest, locale: 'fr' });
    assert.equal(decision.selectedToolId, id, query);
    assert.equal(decision.selectedRoute, route, query);
    assert.equal(decision.canPrefill, false, query);
    assert.equal(decision._meta.providerUsed, false, query);
    const entry = manifest.find((item) => item.id === id);
    assert.equal(entry.privacyMode, 'browser_local', id);
    assert.deepEqual(entry.aiCapabilities, ['route_only'], id);
  }
});
