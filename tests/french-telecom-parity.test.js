'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const {
  APPS,
  page,
  hubPage,
  normalizeTelecomGeneratorHtml
} = require('../scripts/build-french-telecom-parity');
const { buildReport } = require('../scripts/build-french-free-app-parity-inventory');
const sourceRegistryBuilder = require('../scripts/build-source-registry');
const telecomRouteMap = require('../scripts/lib/french-telecom-route-map');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated');
const localeCoverage = require('../data/registry/locale-page-coverage.json');
const sourceRegistry = require('../data/source-registry.json');
const router = require('../assets/js/ai/intent-router');
const engine = require('../assets/js/engines/telecom-planning-engine');
const frenchTelecom = require('../assets/js/lib/fr-telecom-localization');

const expectedIds = [
  'telecom-data-plan',
  'telecom-ussd',
  'telecom-roaming',
  'telecom-starlink',
  'telecom-tv',
  'telecom-data-usage',
  'telecom-airtime',
  'telecom-portability',
  'telecom-sim-reg',
  'telecom-internet',
  'telecom-fiber-lte-5g',
  'telecom-business-internet',
  'telecom-bulk-sms',
  'telecom-whatsapp-vs-sms'
];

function jsonLdValues(html) {
  return Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
    .map((match) => JSON.parse(match[1]));
}

assert.strictEqual(APPS.length, 14, 'French Telecom denominator must remain exactly 14');
assert.deepStrictEqual(APPS.map((app) => app.toolId), expectedIds, 'generator inventory must follow canonical Telecom order');
assert.strictEqual(new Set(APPS.map((app) => app.slug)).size, 14, 'French slugs must be unique');

const report = buildReport();
const telecom = report.categories.find((category) => category.category === 'Telecom & Mobile');
assert.ok(telecom, 'Telecom & Mobile parity category must exist');
assert.deepStrictEqual({
  englishFreeApps: telecom.englishFreeApps,
  native: telecom['native-candidate'],
  iframe: telecom['english-iframe'],
  bridge: telecom['bridge-handoff'],
  alias: telecom['alias-utility'],
  missing: telecom.missing
}, {
  englishFreeApps: 14,
  native: 14,
  iframe: 0,
  bridge: 0,
  alias: 0,
  missing: 0
}, 'all 14 Telecom apps must be native French candidates with no route ambiguity');

const registry = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
const hub = fs.readFileSync(path.join(ROOT, 'fr/telecom/index.html'), 'utf8');
assert.strictEqual(
  normalizeTelecomGeneratorHtml(hub),
  normalizeTelecomGeneratorHtml(hubPage()),
  'French Telecom hub must match its scoped source generator'
);
assert.match(
  hub,
  /<meta\b[^>]*name=["']twitter:image["'][^>]*content=["']https:\/\/afrotools\.com\/assets\/img\/[^"']+["'][^>]*>/i,
  'French Telecom hub exposes a local AfroTools Twitter image after SEO postbuild'
);

const exactControlContracts = {
  'telecom-roaming': [
    ['days', 'number', '7', '1', '90', '1'],
    ['minutesPerDay', 'number', '15', '0', '300', '1'],
    ['smsPerDay', 'number', '5', '0', '200', '1'],
    ['dataMBPerDay', 'number', '200', '0', '5000', '1']
  ],
  'telecom-tv': [
    ['maxPrice', 'range', '100000', '0', '100000', '100']
  ],
  'telecom-data-usage': [
    ['browsing', 'range', '1', '0', '8', '0.5'],
    ['social', 'range', '2', '0', '8', '0.5'],
    ['youtube', 'range', '1', '0', '6', '0.5'],
    ['music', 'range', '0.5', '0', '8', '0.5'],
    ['videocall', 'range', '0.5', '0', '4', '0.5'],
    ['email', 'range', '20', '0', '100', '5'],
    ['downloads', 'range', '1', '0', '20', '0.5']
  ],
  'telecom-business-internet': [
    ['employees', 'number', '10', '1', '10000', '1']
  ],
  'telecom-bulk-sms': [
    ['volume', 'range', '10000', '1000', '1000000', '1000']
  ],
  'telecom-whatsapp-vs-sms': [
    ['volume', 'number', '10000', '100', '10000000', '1'],
    ['marketing', 'range', '40', '0', '100', '5'],
    ['utility', 'range', '35', '0', '100', '5'],
    ['service', 'range', '25', '0', '100', '5']
  ]
};

for (const app of APPS) {
  const frenchRoute = `/fr/telecom/${app.slug}/`;
  const target = path.join(ROOT, 'fr', 'telecom', app.slug, 'index.html');
  const html = fs.readFileSync(target, 'utf8');
  const english = fs.readFileSync(path.join(ROOT, app.english.replace(/^\/|\/$/g, ''), 'index.html'), 'utf8');
  const image = path.join(ROOT, 'assets/img/tools', `${app.image}.webp`);

  assert.strictEqual(
    normalizeTelecomGeneratorHtml(html),
    normalizeTelecomGeneratorHtml(page(app)),
    `${app.toolId}: page must match scoped generator`
  );
  assert.ok(fs.existsSync(image), `${app.toolId}: owned artwork must exist`);
  assert.ok(
    html.includes(`<figure class="tel-app-artwork">`)
      && html.includes(`<img src="/assets/img/tools/${app.image}.webp" alt="Illustration de l’outil ${app.title}" width="640" height="360">`),
    `${app.toolId}: owned artwork must be visible in the app page with useful alternative text`
  );
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${frenchRoute}">`), `${app.toolId}: canonical`);
  assert.ok(html.includes(`<meta property="og:url" content="https://afrotools.com${frenchRoute}">`), `${app.toolId}: OG URL`);
  assert.ok(
    html.includes(`<meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${app.image}.webp">`),
    `${app.toolId}: Twitter artwork`
  );
  assert.ok(
    jsonLdValues(html).some((schema) => schema.inLanguage === 'fr'),
    `${app.toolId}: French schema`
  );
  assert.ok(html.includes(`hreflang="en" href="https://afrotools.com${app.english}"`), `${app.toolId}: English alternate`);
  assert.ok(english.includes(`hreflang="fr" href="https://afrotools.com${frenchRoute}"`), `${app.toolId}: reciprocal French alternate`);
  for (const sibling of english.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)) {
    assert.ok(html.includes(`<link rel="alternate" hreflang="${sibling[1]}" href="${sibling[2]}">`)
      || sibling[1] === 'fr', `${app.toolId}: French page must preserve the ${sibling[1]} sibling alternate`);
    if (!['en', 'fr', 'x-default'].includes(sibling[1])) {
      const siblingRoute = new URL(sibling[2]).pathname;
      const siblingFile = path.join(ROOT, siblingRoute.replace(/^\/|\/$/g, ''), 'index.html');
      const siblingHtml = fs.readFileSync(siblingFile, 'utf8');
      assert.ok(
        siblingHtml.includes(`<link rel="alternate" hreflang="fr" href="https://afrotools.com${frenchRoute}">`),
        `${app.toolId}: ${sibling[1]} sibling must reciprocate the French alternate`
      );
    }
  }
  assert.ok(html.includes('data-source-state="stale" data-source-confidence="low"'), `${app.toolId}: stale source state`);
  assert.ok(html.includes('Aucun tarif, code, forfait, débit, couverture, statut réglementaire, disponibilité ou fournisseur n’est présenté comme actuel.'), `${app.toolId}: no current claim`);
  assert.ok(html.includes('Aucun champ n’est envoyé, aucune IA n’est appelée'), `${app.toolId}: local privacy contract`);
  assert.ok(html.includes('id="telecom-download-json"') && html.includes('id="telecom-import"'), `${app.toolId}: export/reopen controls`);
  assert.ok(
    html.includes('id="telecom-reset" type="reset">Réinitialiser</button>'),
    `${app.toolId}: visible native reset control`
  );
  for (const actionId of ['telecom-copy', 'telecom-download-txt', 'telecom-download-json']) {
    assert.ok(
      new RegExp(`id="${actionId}"[^>]*\\bhidden\\b[^>]*\\bdisabled\\b`).test(html),
      `${app.toolId}: ${actionId} must start unavailable until a fresh result exists`
    );
  }
  assert.ok(html.includes('window.AFROTOOLS_TELECOM_DISABLE_LIVE_DATA = true'), `${app.toolId}: local-only data mode`);
  assert.ok(html.includes('/assets/js/lib/fr-telecom-localization.js'), `${app.toolId}: shared native French dataset renderer`);
  assert.ok(!/<iframe\b/i.test(html), `${app.toolId}: no iframe/transplant`);
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(html), `${app.toolId}: no page network calls`);
  assert.ok(!/\b(?:Calculate|Select a country|Download JSON|No data|Best Value)\b/.test(html), `${app.toolId}: no common English UI residue`);
  assert.ok(registry.includes(`id: '${app.toolId}-fr'`) || (
    app.toolId === 'telecom-fiber-lte-5g' && registry.includes("id: 'telecom-fibre-lte-5g-fr'")
  ) || (
    app.toolId === 'telecom-bulk-sms' && registry.includes("id: 'telecom-sms-pro-fr'")
  ) || (
    app.toolId === 'telecom-portability' && registry.includes("id: 'telecom-portabilite-fr'")
  ), `${app.toolId}: French registry record`);
  assert.ok(registry.includes(`href: '${frenchRoute}'`), `${app.toolId}: registry route`);
  assert.strictEqual((hub.match(new RegExp(`href="${frenchRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) || []).length, 1, `${app.toolId}: hub link exactly once`);

  const englishKey = app.english;
  assert.strictEqual(aiRouteMap.routes[englishKey], frenchRoute, `${app.toolId}: generated AI route`);
  assert.ok(
    localeCoverage.records.some((record) => (
      record.route === frenchRoute
      && record.locale === 'fr'
      && record.indexableEligible
      && record.equivalentRoute === englishKey
      && record.state === 'native'
    )),
    `${app.toolId}: canonical locale-page coverage must be native`
  );
  assert.strictEqual(telecomRouteMap.frenchRouteForEnglishTelecomSource(app.english), frenchRoute.replace(/\/$/, ''), `${app.toolId}: source route map`);
  for (const [name, type, value, min, max, step] of exactControlContracts[app.toolId] || []) {
    const input = html.match(new RegExp(`<input[^>]*\\bname="${name}"[^>]*>`));
    assert.ok(input, `${app.toolId}: ${name} control`);
    for (const [attribute, expected] of Object.entries({ type, value, min, max, step })) {
      assert.ok(
        new RegExp(`\\b${attribute}="${expected.replace('.', '\\.')}"`).test(input[0]),
        `${app.toolId}: ${name} ${attribute}=${expected}`
      );
    }
  }
  if (app.toolId === 'telecom-business-internet') {
    assert.ok(
      html.includes('<select id="minimumSpeed" name="minimumSpeed" required>')
        && ['10', '25', '50', '100', '200'].every((speed) => new RegExp(`<option value="${speed}"(?: selected)?>`).test(html))
        && html.includes('<option value="50" selected>'),
      `${app.toolId}: discrete English-owned speed selector`
    );
    assert.ok(html.includes('<option value="moderate" selected>Modérée</option>'), `${app.toolId}: moderate usage default`);
  }
  if (app.toolId === 'telecom-data-plan') {
    assert.ok(!html.includes('<option value="2">'), `${app.toolId}: no extra two-day filter`);
    assert.ok(
      ['all', '1', '7', '30'].every((value) => html.includes(`<option value="${value}"`)),
      `${app.toolId}: English-equivalent duration controls`
    );
  }
  if (app.toolId === 'telecom-tv') {
    assert.ok(
      html.includes('<option value="price-desc" selected>Prix : décroissant</option>'),
      `${app.toolId}: descending-price default`
    );
    assert.ok(
      ['price-asc', 'price-desc', 'channels-desc', 'value'].every((value) => html.includes(`<option value="${value}"`)),
      `${app.toolId}: English-equivalent sort controls`
    );
  }
  if (app.toolId === 'telecom-airtime') {
    const amount = html.match(/<input[^>]*\bname="amount"[^>]*>/);
    assert.ok(amount, `${app.toolId}: amount control`);
    assert.ok(/\bmin="1"/.test(amount[0]) && /\bstep="1"/.test(amount[0]), `${app.toolId}: amount constraints`);
    assert.ok(!/\bvalue=/.test(amount[0]), `${app.toolId}: blank amount default`);
    assert.ok(!/\bname="(?:lowRate|highRate)"/.test(html), `${app.toolId}: no French-only editable rate controls`);
  }
  const decision = router.routeDeterministically(app.title, { locale: 'fr' });
  assert.strictEqual(decision.selectedToolId, app.toolId, `${app.toolId}: deterministic French intent`);
  assert.strictEqual(decision.selectedRoute, `${frenchRoute}?source=ask`, `${app.toolId}: deterministic French route`);
  assert.strictEqual(decision._meta.providerUsed, false, `${app.toolId}: local route must not call a model`);
  assert.strictEqual(
    decision.handoffPlan.consentRequiredForModel,
    decision.privacyMode === 'ai_optional',
    `${app.toolId}: optional AI consent must remain explicit while browser-local routes require none`
  );
}
assert.strictEqual(
  Object.keys(aiRouteMap.routes).filter((route) => route.startsWith('/telecom/')).length,
  14,
  'the generated AI map must contain exactly 14 Telecom apps'
);
assert.strictEqual(Object.keys(telecomRouteMap.FRENCH_TELECOM_SLUG_TO_ENGLISH_SOURCE).length, 14, 'French Telecom source map must contain exactly 14 routes');
assert.ok(!fs.existsSync(path.join(ROOT, 'assets/js/ai/french-route-overrides.js')), 'split French route override must be removed');

const aiPage = fs.readFileSync(path.join(ROOT, 'ai/index.html'), 'utf8');
const askPage = fs.readFileSync(path.join(ROOT, 'ask/index.html'), 'utf8');
const searchPage = fs.readFileSync(path.join(ROOT, 'search/index.html'), 'utf8');
const miniRouterPage = fs.readFileSync(path.join(ROOT, 'widgets/iframe/ai-mini-router.html'), 'utf8');
const homepage = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const [surface, source] of [
  ['/ai/', aiPage],
  ['/ask/', askPage],
  ['/search/', searchPage],
  ['AI mini-router', miniRouterPage],
  ['homepage mini-router', homepage],
]) {
  assert.ok(source.includes('/assets/js/ai/french-route-map.generated.js'), `${surface}: generated French AI map consumer`);
  assert.ok(!source.includes('french-route-overrides'), `${surface}: no split French route override`);
}
assert.ok(/locale:\s*routingLocale\(\)/.test(askPage), '/ask/: locale-aware generated-map routing');
assert.ok(/locale:\s*aiSearchLocale\(\)/.test(searchPage), '/search/: locale-aware generated-map routing');
assert.ok(/locale:\s*params\.get\("locale"\)/.test(miniRouterPage), 'AI mini-router: locale-aware generated-map routing');
assert.ok(/locale:\s*aiHomeLocale\(\)/.test(homepage), 'homepage mini-router: locale-aware generated-map routing');

const fixture = {
  lastUpdated: '2026-03-01',
  countries: {
    AA: {
      name: 'Alpha',
      currency: 'AAA',
      symbol: 'A',
      regulator: 'Alpha regulator',
      avgDataCostPerGB: 4,
      operators: [{
        name: 'Alpha Mobile',
        dataBundles: [
          { name: '1 GB', volume: '1GB', volumeMB: 1024, validity: '30 days', price: 10 },
          { name: '500 MB 2-Day', volume: '500MB', volumeMB: 500, validity: '2 days', price: 6 },
          { name: '2 GB', volume: '2GB', volumeMB: 2048, validity: '7 days', price: 30 }
        ]
      }],
      ussdCodes: { balance: { 'Alpha Mobile': '*100#' } },
      roaming: { avgVoicePerMin: 2, avgSMSRate: 1, avgDataPerMB: 0.5 },
      numberPortability: { available: true, regulator: 'Alpha regulator', fee: 0, process: 'Archived process' },
      simRegistration: { mandatory: true, method: 'Archived method', deadline: 'Archived deadline', checkCode: '*200#', penalty: 'Archived penalty' },
      isp: [{ name: 'Alpha Fiber', type: 'Fiber', speeds: ['50 Mbps', '100 Mbps'], prices: [100, 180], setup: 20 }],
      starlinkAvailable: true,
      starlinkPrice: { monthly: 50, hardware: 100, speed: '50-150 Mbps' },
      tvProviders: [{
        name: 'Alpha TV',
        packages: [
          { name: 'Twenty', price: 100, channels: 20 },
          { name: 'Ten', price: 70, channels: 10 }
        ]
      }],
      bulkSMS: { avgCostPerSMS: 0.1 },
      whatsappBusiness: { perConversation: { marketing: 0.05, utility: 0.02, service: 0.01 } }
    },
    BB: {
      name: 'Beta',
      currency: 'BBB',
      symbol: 'B',
      avgDataCostPerGB: 6,
      operators: [{ name: 'Beta Mobile', dataBundles: [{ name: '1 GB', volume: '1GB', volumeMB: 1024, validity: '30 days', price: 8 }] }],
      ussdCodes: {},
      isp: []
    }
  }
};

assert.deepStrictEqual(engine.snapshotState(fixture, new Date('2026-07-29T00:00:00Z')), {
  reviewedAt: '2026-03-01',
  ageDays: 150,
  cadenceDays: 30,
  freshness: 'stale',
  confidence: 'low_confidence'
}, 'source freshness oracle');

const plan = engine.dataPlans(fixture, { country: 'AA', operator: 'all', validity: '30', sort: 'pricePerGB' });
assert.strictEqual(plan.plans.length, 1, 'data-plan filter oracle');
assert.strictEqual(plan.plans[0].pricePerGB, 10, 'data-plan price/GB oracle');
assert.strictEqual(engine.dataPlans(fixture, { country: 'AA', operator: 'all', validity: '2', sort: 'pricePerGB' }).plans.length, 0, 'data-plan exact validity oracle');
assert.strictEqual(
  engine.dataPlans(fixture, { country: 'AA', operator: 'all', validity: '1', sort: 'pricePerGB' }).plans[0].validity,
  '2 days',
  'daily UI group must match the English one-to-two-day behavior'
);
assert.deepStrictEqual(engine.ussdDirectory(fixture, { country: 'AA', category: 'balance', query: 'alpha' }).codes[0], {
  category: 'balance', operator: 'Alpha Mobile', code: '*100#'
}, 'USSD search oracle');
assert.strictEqual(engine.roaming(fixture, {
  country: 'AA', destination: 'BB', days: 2, minutesPerDay: 10, smsPerDay: 2, dataMBPerDay: 100
}).roamingTotal, 144, 'roaming formula oracle');
assert.deepStrictEqual(
  (({ lowValue, midValue, highValue }) => ({ lowValue, midValue, highValue }))(
    engine.airtime(fixture, { country: 'AA', operator: 'Alpha Mobile', amount: 5000, lowRate: 0.7, highRate: 0.85 })
  ),
  { lowValue: 3500, midValue: 3875, highValue: 4250 },
  'airtime assumption oracle'
);
assert.strictEqual(engine.portability(fixture, { country: 'AA' }).record.snapshotAvailability, true, 'portability snapshot oracle');
assert.strictEqual(engine.simRegistration(fixture, { country: 'AA' }).record.methodSnapshot, 'Archived method', 'SIM snapshot oracle');
assert.strictEqual(
  engine.internet(fixture, { country: 'AA', sort: 'value' }).tiers.find((tier) => tier.provider === 'Alpha Fiber' && tier.speedMbps === 50).costPerMbps,
  2,
  'internet cost/Mbps oracle'
);
assert.strictEqual(engine.technology(fixture, { country: 'AA', priority: 'speed', usage: 'streaming', location: 'urban' }).recommendation, '5G', 'technology score oracle');
const business = engine.businessInternet(fixture, { country: 'AA', employees: 10, minimumSpeed: 20, usage: 'moderate' });
assert.strictEqual(business.recommendedBandwidth, 30, 'business bandwidth oracle');
assert.strictEqual(business.monthlyDataGB, 600, 'business data oracle');
assert.strictEqual(engine.bulkSms(fixture, { country: 'AA', volume: 10000, kind: 'domestic' }).totalCost, 950, 'bulk SMS tier oracle');
const messaging = engine.whatsappVsSms(fixture, { country: 'AA', volume: 10000, marketing: 50, utility: 30, service: 20 });
assert.strictEqual(messaging.whatsappTotal, 330, 'WhatsApp mix oracle');
assert.strictEqual(messaging.smsTotal, 950, 'SMS comparison oracle');
assert.strictEqual(engine.tv(fixture, { country: 'AA', sort: 'value' }).bestValue.pricePerChannel, 5, 'TV value oracle');
assert.strictEqual(engine.tv(fixture, { country: 'AA', maxPrice: 69, sort: 'value' }).packages.length, 0, 'TV maximum-price filter oracle');
assert.deepStrictEqual(
  engine.tv(fixture, { country: 'AA' }).packages.map((item) => item.price),
  [100, 70],
  'TV default sort must be descending price'
);
assert.strictEqual(engine.starlink(fixture, { country: 'AA' }).starlink.yearThree, 1900, 'Starlink TCO oracle');
const usage = engine.dataUsage(fixture, {
  country: 'AA', browsing: 1, social: 0, youtube: 0, music: 0, videocall: 0, email: 0, downloads: 0, youtubeQuality: 'medium'
});
assert.strictEqual(usage.totalMB, 1800, 'data-usage monthly oracle');
assert.strictEqual(usage.bufferedNeedMB, 1980.0000000000002, 'data-usage buffer oracle');
assert.strictEqual(engine.dataUsage(fixture, {
  country: 'AA', browsing: -1, social: 0, youtube: 0, music: 0, videocall: 0, email: 0, downloads: 0, youtubeQuality: 'medium'
}).error, 'invalid_usage', 'negative data usage must fail closed');
assert.strictEqual(engine.whatsappVsSms(fixture, {
  country: 'BB', volume: 1000, marketing: 100, utility: 0, service: 0
}).error, 'comparison_data_unavailable', 'missing messaging prices must fail closed');
assert.strictEqual(engine.roaming(fixture, {
  country: 'AA', destination: 'BB', days: 0, minutesPerDay: 1, smsPerDay: 1, dataMBPerDay: 1
}).error, 'invalid_usage', 'invalid roaming duration must fail closed');
assert.strictEqual(engine.airtime(fixture, {
  country: 'AA', operator: 'Alpha Mobile', amount: 10, lowRate: 0.9, highRate: 0.7
}).error, 'invalid_assumption', 'inverted airtime bounds must fail closed');
assert.strictEqual(engine.portability(fixture, { country: 'BB' }).error, 'portability_data_unavailable', 'missing portability record must be explicit');
assert.strictEqual(engine.simRegistration(fixture, { country: 'BB' }).error, 'sim_data_unavailable', 'missing SIM record must be explicit');
assert.strictEqual(engine.businessInternet(fixture, {
  country: 'AA', employees: 0, minimumSpeed: 20, usage: 'moderate'
}).error, 'invalid_business_usage', 'invalid business size must fail closed');
assert.strictEqual(engine.bulkSms(fixture, { country: 'AA', volume: 0, kind: 'domestic' }).error, 'invalid_volume', 'invalid SMS volume must fail closed');
assert.strictEqual(engine.whatsappVsSms(fixture, {
  country: 'AA', volume: 1000, marketing: 50, utility: 30, service: 10
}).error, 'message_mix_not_100', 'invalid message mix must fail closed');

const telecomDataScript = fs.readFileSync(path.join(ROOT, 'data/telecom/country-telecom-index.js'), 'utf8');
const telecomData = new Function(`${telecomDataScript}; return TELECOM_DATA;`)();
assert.deepStrictEqual(
  Object.keys(frenchTelecom.countryNames).sort(),
  Object.keys(telecomData.countries).sort(),
  'every populated Telecom country selector needs an explicit native French label'
);
for (const [code, countryRecord] of Object.entries(telecomData.countries)) {
  assert.ok(frenchTelecom.countryName(code, countryRecord.name), `${code}: native country label`);
  for (const operator of countryRecord.operators || []) {
    for (const bundle of operator.dataBundles || []) {
      assert.doesNotMatch(frenchTelecom.planName(bundle.name), /\b(?:GB|Daily|Weekly|Monthly|Day|Unlimited)\b/i, `${code}: French plan name`);
      assert.doesNotMatch(frenchTelecom.validity(bundle.validity), /\b(?:day|days|hrs)\b/i, `${code}: French validity`);
      assert.doesNotMatch(frenchTelecom.dataVolume(bundle.volume), /\b(?:GB|MB|Unlimited)\b/i, `${code}: French volume`);
    }
  }
  const portability = countryRecord.numberPortability || {};
  for (const value of [portability.process, portability.notes].filter(Boolean)) {
    assert.notStrictEqual(frenchTelecom.portability(value), value, `${code}: native portability text`);
  }
  const sim = countryRecord.simRegistration || {};
  for (const value of [sim.method, sim.deadline, sim.checkCode, sim.penalty].filter(Boolean)) {
    assert.doesNotMatch(
      frenchTelecom.sim(value),
      /\b(?:National ID|linkage|enforcement|Line|deactivation|disconnection|Regulation of Interception|Contact provider|Send ID number)\b/i,
      `${code}: native SIM text`
    );
  }
  assert.doesNotMatch(
    frenchTelecom.regulator(countryRecord.regulator),
    /\b(?:Communications Authority|Nigerian Communications Commission)\b/i,
    `${code}: native regulator label`
  );
  for (const isp of countryRecord.isp || []) {
    assert.doesNotMatch(frenchTelecom.networkType(isp.type), /\bFiber\b/i, `${code}: native ISP type`);
    for (const archivedSpeed of isp.speeds || []) {
      assert.doesNotMatch(frenchTelecom.speed(archivedSpeed), /\dMbps\b/, `${code}: French speed typography`);
    }
  }
  const archivedTvNames = [];
  for (const provider of countryRecord.tvProviders || []) {
    for (const item of provider.packages || []) {
      archivedTvNames.push(item.name);
      assert.doesNotMatch(
        frenchTelecom.tvNote(item.notes),
        /\b(?:devices|Sports|entertainment|Streaming only)\b/i,
        `${code}: native TV note`
      );
    }
  }
  assert.ok(
    archivedTvNames.every((name) => Object.prototype.hasOwnProperty.call(frenchTelecom.tvNames, name)),
    `${code}: every archived TV tier has an explicit French rendering decision`
  );
}
assert.strictEqual(frenchTelecom.businessName('Alpha Mobile Data'), 'Alpha Données mobiles', 'native business option name');
assert.strictEqual(frenchTelecom.networkType('Mobile Data'), 'Données mobiles', 'native business option type');

const sourceLedger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/telecom/official-sources.json'), 'utf8'));
assert.strictEqual(sourceLedger.highRiskCadenceDays, 30, 'Telecom high-risk freshness cadence');
assert.strictEqual(sourceLedger.gaps.regulatorsWithoutUrl.length, 9, 'carried regulator gaps must remain visible');
for (const field of [
  'operators[].dataBundles[].price',
  'roaming.*',
  'isp.*',
  'airtime resale rate 70-85%',
  'bulkSMS volume discount tiers',
  'ussdCodes'
]) {
  assert.ok(sourceLedger.gaps.unsourcedClaims.some((gap) => gap.field === field), `carried source gap: ${field}`);
}
const expectedTelecomSource = sourceRegistryBuilder.buildTelecomSnapshotEntry('2026-07-29');
const registeredTelecomSource = sourceRegistry.sources.find((entry) => entry.id === expectedTelecomSource.id);
assert.deepStrictEqual(registeredTelecomSource, expectedTelecomSource, 'canonical Telecom source-registry entry and dataset hash');
assert.strictEqual(registeredTelecomSource.toolIds.length, 14, 'Telecom source-registry tool denominator');
assert.strictEqual(registeredTelecomSource.routes.length, 28, 'Telecom source-registry English/French route denominator');
assert.strictEqual(registeredTelecomSource.freshnessStatus, 'stale', 'Telecom source registry must preserve stale handling');
assert.strictEqual(registeredTelecomSource.confidence, 'low_confidence', 'Telecom source registry must preserve low confidence');

const controller = fs.readFileSync(path.join(ROOT, 'assets/js/pages/fr-telecom-app.js'), 'utf8');
assert.ok(
  controller.includes("result.bestValue.provider + ' · ' + locale.tvName(result.bestValue.name)"),
  'TV best-value headline and derived TXT must localize the archived tier name through the shared owner'
);
assert.ok(controller.includes("payload.toolId !== config.toolId"), 'reopen must reject another tool export');
assert.ok(controller.includes("Scénario rouvert et recalculé localement."), 'reopen must recalculate locally');
assert.ok(controller.includes("schemaVersion: 1"), 'export must be versioned');
assert.ok(
  controller.indexOf('clearLatestResult();') < controller.indexOf('form.reportValidity()'),
  'every calculation must invalidate the previous result and export payload before native validity can return'
);
assert.ok(controller.includes("form.addEventListener('reset'"), 'visible form reset must own reset state');
assert.ok(controller.includes("exportStatus.textContent = 'Scénario réinitialisé.'"), 'reset must announce completion');
assert.ok(controller.includes('setResultActionsAvailable(false);'), 'reset and invalidation must revoke result actions');
assert.ok(controller.includes("config.kind !== 'whatsappVsSms'"), 'WhatsApp mix balancing must remain scoped to that app');
const dataScript = fs.readFileSync(path.join(ROOT, 'data/telecom/country-telecom-index.js'), 'utf8');
assert.ok(dataScript.includes('window.AFROTOOLS_TELECOM_DISABLE_LIVE_DATA'), 'dataset overlay must honor local-only mode');
const carriedData = new Function(`${dataScript}; return TELECOM_DATA;`)();
assert.strictEqual(Object.keys(carriedData.countries).length, 12, 'country dataset denominator');
for (const [code, record] of Object.entries(carriedData.countries)) {
  assert.ok(record.currency && record.symbol, `${code}: local currency code and display symbol`);
}

console.log('French Telecom parity: 14/14 structural, route, oracle, source-gap and export contracts passed.');
