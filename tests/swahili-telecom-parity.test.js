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
} = require('../scripts/build-swahili-telecom-parity');
const engine = require('../assets/js/engines/telecom-planning-engine');
const swahiliTelecom = require('../assets/js/lib/sw-telecom-localization');
const localePolicy = require('../data/registry/locale-coverage-policy.json');
const swahiliAcceptance = require('../data/audits/swahili-free-app-acceptance.json');
const swahiliAiMap = require('../assets/js/ai/swahili-route-map.generated');
const swahiliInventory = require('../reports/swahili-free-app-parity-inventory.json');

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

assert.strictEqual(APPS.length, 14, 'Swahili Telecom denominator must remain exactly 14');
assert.deepStrictEqual(APPS.map((app) => app.toolId), expectedIds, 'generator inventory must follow canonical Telecom order');
assert.strictEqual(new Set(APPS.map((app) => app.slug)).size, 14, 'Swahili slugs must be unique');

const registry = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
const hub = fs.readFileSync(path.join(ROOT, 'sw/mawasiliano-na-mtandao/index.html'), 'utf8');
assert.strictEqual(
  normalizeTelecomGeneratorHtml(hub),
  normalizeTelecomGeneratorHtml(hubPage()),
  'Swahili Telecom hub must match its scoped source generator'
);
assert.match(
  hub,
  /<meta\b[^>]*name=["']twitter:image["'][^>]*content=["']https:\/\/afrotools\.com\/assets\/img\/[^"']+["'][^>]*>/i,
  'Swahili Telecom hub exposes a local AfroTools Twitter image after SEO postbuild'
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
  const swahiliRoute = `/sw/zana/${app.slug}/`;
  const target = path.join(ROOT, 'sw', 'zana', app.slug, 'index.html');
  const html = fs.readFileSync(target, 'utf8');
  const english = fs.readFileSync(path.join(ROOT, app.english.replace(/^\/|\/$/g, ''), 'index.html'), 'utf8');
  const image = path.join(ROOT, 'assets/img/tools', `${app.image}.webp`);
  const registryRow = registry.split(/\r?\n/).find((line) => line.includes(`href: "${swahiliRoute}"`) || line.includes(`href: '${swahiliRoute}'`));

  assert.strictEqual(normalizeTelecomGeneratorHtml(html), normalizeTelecomGeneratorHtml(page(app)), `${app.toolId}: generated page`);
  assert.ok(fs.existsSync(image), `${app.toolId}: owned artwork exists`);
  assert.ok(html.includes(`<img src="/assets/img/tools/${app.image}.webp" alt="Mchoro wa zana ${app.title}" width="640" height="360">`), `${app.toolId}: visible artwork`);
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${swahiliRoute}">`), `${app.toolId}: canonical`);
  assert.ok(html.includes(`<meta property="og:url" content="https://afrotools.com${swahiliRoute}">`), `${app.toolId}: OG URL`);
  assert.ok(html.includes(`<meta property="og:image" content="https://afrotools.com/assets/img/tools/${app.image}.webp">`), `${app.toolId}: OG artwork`);
  assert.ok(html.includes(`<meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${app.image}.webp">`), `${app.toolId}: Twitter artwork`);
  assert.ok(jsonLdValues(html).some((schema) => schema.inLanguage === 'sw' && schema.url === `https://afrotools.com${swahiliRoute}`), `${app.toolId}: Swahili schema`);
  assert.ok(html.includes(`hreflang="en" href="https://afrotools.com${app.english}"`), `${app.toolId}: English alternate`);
  assert.ok(english.includes(`hreflang="sw" href="https://afrotools.com${swahiliRoute}"`), `${app.toolId}: reciprocal English alternate`);
  for (const sibling of english.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)) {
    if (['en', 'sw', 'x-default'].includes(sibling[1])) continue;
    assert.ok(html.includes(`<link rel="alternate" hreflang="${sibling[1]}" href="${sibling[2]}">`), `${app.toolId}: preserves ${sibling[1]} alternate`);
    const siblingRoute = new URL(sibling[2]).pathname;
    const siblingHtml = fs.readFileSync(path.join(ROOT, siblingRoute.replace(/^\/|\/$/g, ''), 'index.html'), 'utf8');
    assert.ok(siblingHtml.includes(`hreflang="sw" href="https://afrotools.com${swahiliRoute}"`), `${app.toolId}: ${sibling[1]} reciprocal alternate`);
  }
  assert.ok(html.includes('data-source-state="stale" data-source-confidence="low"'), `${app.toolId}: stale/low source boundary`);
  assert.ok(html.includes('Hakuna bei, msimbo, kifurushi, kasi, coverage, hali ya kanuni, upatikanaji au mtoa huduma unaodaiwa kuwa wa sasa.'), `${app.toolId}: no current claim`);
  assert.ok(html.includes('Hakuna sehemu inayotumwa, hakuna AI inayoitwa'), `${app.toolId}: local privacy and AI boundary`);
  assert.ok(html.includes('id="telecom-download-json"') && html.includes('id="telecom-import"'), `${app.toolId}: JSON export/reopen`);
  assert.ok(html.includes('id="telecom-reset" type="reset">Anza upya</button>'), `${app.toolId}: reset`);
  assert.ok(html.includes('window.AFROTOOLS_TELECOM_DISABLE_LIVE_DATA = true'), `${app.toolId}: live overlays disabled`);
  assert.ok(html.includes('<meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts/build-swahili-telecom-parity.js">'), `${app.toolId}: source-owned local-only policy`);
  assert.ok(html.includes('/assets/js/components/navbar.min.js'), `${app.toolId}: maintained navbar runtime`);
  assert.ok(!html.includes('/assets/js/supabase.min.js'), `${app.toolId}: no Supabase SDK bootstrap`);
  assert.ok(html.includes('/assets/js/lib/sw-telecom-localization.js') && html.includes('/assets/js/pages/sw-telecom-app.js'), `${app.toolId}: native owners`);
  assert.ok(!/<iframe\b/i.test(html), `${app.toolId}: no iframe`);
  assert.ok(!/sw-telecom-runtime-localizer/.test(html), `${app.toolId}: no translated shell runtime`);
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(html), `${app.toolId}: no page network primitive`);
  assert.ok(registryRow, `${app.toolId}: registry row`);
  assert.ok(registryRow.includes('category: "telecom"') || registryRow.includes("category: 'telecom'"), `${app.toolId}: Telecom category`);
  assert.ok(registryRow.includes(`sourceId: '${app.toolId}'`) || registryRow.includes(`sourceId: "${app.toolId}"`), `${app.toolId}: canonical sourceId`);
  assert.strictEqual((hub.match(new RegExp(`href="${swahiliRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g')) || []).length, 1, `${app.toolId}: hub link exactly once`);
  const policy = localePolicy.overrides.find((row) => row.route === swahiliRoute);
  assert.deepStrictEqual(policy && { state: policy.state, equivalentRoute: policy.equivalentRoute, engineLocaleNeutral: policy.engineLocaleNeutral }, { state: 'native', equivalentRoute: app.english, engineLocaleNeutral: true }, `${app.toolId}: native coverage owner`);
  const acceptedEntry = swahiliAcceptance.entries.find((row) => row.englishId === app.toolId && row.status === 'accepted');
  assert.ok(acceptedEntry, `${app.toolId}: coordinator acceptance recorded`);
  assert.strictEqual(acceptedEntry.swahiliRoute, swahiliRoute, `${app.toolId}: accepted route ownership`);
  assert.strictEqual(swahiliAiMap.routes[app.english], swahiliRoute, `${app.toolId}: generated AI route follows accepted ownership`);

  for (const [name, type, value, min, max, step] of exactControlContracts[app.toolId] || []) {
    const input = html.match(new RegExp(`<input[^>]*\\bname="${name}"[^>]*>`));
    assert.ok(input, `${app.toolId}: ${name} control`);
    for (const [attribute, expected] of Object.entries({ type, value, min, max, step })) {
      assert.ok(new RegExp(`\\b${attribute}="${expected.replace('.', '\\.')}"`).test(input[0]), `${app.toolId}: ${name} ${attribute}=${expected}`);
    }
  }
  if (app.toolId === 'telecom-business-internet') {
    assert.ok(['10', '25', '50', '100', '200'].every((speed) => new RegExp(`<option value="${speed}"(?: selected)?>`).test(html)), `${app.toolId}: speed selector parity`);
    assert.ok(html.includes('<option value="50" selected>') && html.includes('<option value="moderate" selected>Wastani</option>'), `${app.toolId}: defaults`);
  }
  if (app.toolId === 'telecom-data-plan') assert.ok(['all', '1', '7', '30'].every((value) => html.includes(`<option value="${value}"`)) && !html.includes('<option value="2">'), `${app.toolId}: validity controls`);
  if (app.toolId === 'telecom-tv') assert.ok(html.includes('<option value="price-desc" selected>Bei: kubwa hadi ndogo</option>'), `${app.toolId}: descending default`);
  if (app.toolId === 'telecom-airtime') {
    const amount = html.match(/<input[^>]*\bname="amount"[^>]*>/);
    assert.ok(amount && /\bmin="1"/.test(amount[0]) && /\bstep="1"/.test(amount[0]) && !/\bvalue=/.test(amount[0]), `${app.toolId}: amount contract`);
    assert.ok(!/\bname="(?:lowRate|highRate)"/.test(html), `${app.toolId}: fixed English oracle assumptions`);
  }
}
assert.ok(hub.includes('<meta name="afrotools-network-policy" content="local-only" data-source-owner="scripts/build-swahili-telecom-parity.js">'), 'hub: source-owned local-only policy');
assert.ok(hub.includes('/assets/js/components/navbar.min.js'), 'hub: maintained navbar runtime');
assert.ok(!hub.includes('/assets/js/supabase.min.js'), 'hub: no Supabase SDK bootstrap');
const navbarSource = fs.readFileSync(path.join(ROOT, 'assets/js/components/navbar.js'), 'utf8');
const navbarMinified = fs.readFileSync(path.join(ROOT, 'assets/js/components/navbar.min.js'), 'utf8');
assert.ok(navbarSource.includes('function _isExplicitLocalOnlySurface()'), 'navbar source owns explicit local-only auth guard');
assert.strictEqual((navbarSource.match(/if \(!_isExplicitLocalOnlySurface\(\)\) setTimeout/g) || []).length, 2, 'both delayed auth bootstrap paths are guarded');
assert.ok(navbarMinified.includes('afrotools-network-policy') && navbarMinified.includes('local-only'), 'maintained minified navbar contains local-only guard');
assert.strictEqual(APPS.filter((app) => localePolicy.overrides.some((row) => row.route === `/sw/zana/${app.slug}/`)).length, 14, '14 native coverage overrides');
assert.strictEqual(
  Object.keys(swahiliAiMap.routes).length,
  swahiliAcceptance.entries.filter((row) => row.status === 'accepted'
    && swahiliInventory.rows.some((inventoryRow) => inventoryRow.englishId === row.englishId)).length,
  'generated Swahili AI map stays aligned with the accepted ledger'
);
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
  Object.keys(swahiliTelecom.countryNames).sort(),
  Object.keys(telecomData.countries).sort(),
  'every populated Telecom country selector needs an explicit native Swahili label'
);
for (const [code, countryRecord] of Object.entries(telecomData.countries)) {
  assert.ok(swahiliTelecom.countryName(code, countryRecord.name), `${code}: native country label`);
  for (const operator of countryRecord.operators || []) {
    for (const bundle of operator.dataBundles || []) {
      assert.doesNotMatch(swahiliTelecom.planName(bundle.name), /\b(?:Daily|Weekly|Monthly|Day|Unlimited)\b/i, `${code}: Swahili plan name`);
      assert.doesNotMatch(swahiliTelecom.validity(bundle.validity), /\b(?:day|days|hrs)\b/i, `${code}: Swahili validity`);
      assert.doesNotMatch(swahiliTelecom.dataVolume(bundle.volume), /\bUnlimited\b/i, `${code}: Swahili volume`);
    }
  }
  const portability = countryRecord.numberPortability || {};
  for (const value of [portability.process, portability.notes].filter(Boolean)) {
    assert.notStrictEqual(swahiliTelecom.portability(value), value, `${code}: native portability text`);
  }
  const sim = countryRecord.simRegistration || {};
  for (const value of [sim.method, sim.deadline, sim.checkCode, sim.penalty].filter(Boolean)) {
    assert.doesNotMatch(
      swahiliTelecom.sim(value),
      /\b(?:National ID|linkage|enforcement|Line|deactivation|disconnection|Regulation of Interception|Contact provider|Send ID number)\b/i,
      `${code}: native SIM text`
    );
  }
  assert.doesNotMatch(
    swahiliTelecom.regulator(countryRecord.regulator),
    /\b(?:Communications Authority|Nigerian Communications Commission)\b/i,
    `${code}: native regulator label`
  );
  for (const isp of countryRecord.isp || []) {
    assert.ok(swahiliTelecom.networkType(isp.type), `${code}: native ISP type`);
    for (const archivedSpeed of isp.speeds || []) {
      assert.match(swahiliTelecom.speed(archivedSpeed), /Mbps\b/, `${code}: Swahili speed unit`);
    }
  }
  const archivedTvNames = [];
  for (const provider of countryRecord.tvProviders || []) {
    for (const item of provider.packages || []) {
      archivedTvNames.push(item.name);
      assert.doesNotMatch(
        swahiliTelecom.tvNote(item.notes),
        /\b(?:devices|Sports|entertainment|Streaming only)\b/i,
        `${code}: native TV note`
      );
    }
  }
  assert.ok(
    archivedTvNames.every((name) => Object.prototype.hasOwnProperty.call(swahiliTelecom.tvNames, name)),
    `${code}: every archived TV tier has an explicit Swahili rendering decision`
  );
}
assert.strictEqual(swahiliTelecom.businessName('Alpha Mobile Data'), 'Alpha Data ya simu', 'native business option name');
assert.strictEqual(swahiliTelecom.networkType('Mobile Data'), 'Data ya simu', 'native business option type');

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
const controller = fs.readFileSync(path.join(ROOT, 'assets/js/pages/sw-telecom-app.js'), 'utf8');
assert.ok(
  controller.includes("result.bestValue.provider + ' · ' + locale.tvName(result.bestValue.name)"),
  'TV best-value headline and derived TXT must localize the archived tier name through the shared owner'
);
assert.ok(controller.includes("payload.toolId !== config.toolId"), 'reopen must reject another tool export');
assert.ok(controller.includes("Hali imefunguliwa tena na kukokotolewa ndani."), 'reopen must recalculate locally');
assert.ok(controller.includes("schemaVersion: 1"), 'export must be versioned');
assert.ok(
  controller.indexOf('clearLatestResult();') < controller.indexOf('form.reportValidity()'),
  'every calculation must invalidate the previous result and export payload before native validity can return'
);
assert.ok(controller.includes("form.addEventListener('reset'"), 'visible form reset must own reset state');
assert.ok(controller.includes('exportStatus.textContent = "Hali imeanzishwa upya."'), 'reset must announce completion');
assert.ok(controller.includes('setResultActionsAvailable(false);'), 'reset and invalidation must revoke result actions');
assert.ok(controller.includes("config.kind !== 'whatsappVsSms'"), 'WhatsApp mix balancing must remain scoped to that app');
const dataScript = fs.readFileSync(path.join(ROOT, 'data/telecom/country-telecom-index.js'), 'utf8');
assert.ok(dataScript.includes('window.AFROTOOLS_TELECOM_DISABLE_LIVE_DATA'), 'dataset overlay must honor local-only mode');
const carriedData = new Function(`${dataScript}; return TELECOM_DATA;`)();
assert.strictEqual(Object.keys(carriedData.countries).length, 12, 'country dataset denominator');
for (const [code, record] of Object.entries(carriedData.countries)) {
  assert.ok(record.currency && record.symbol, `${code}: local currency code and display symbol`);
}

console.log('Swahili Telecom parity: 14/14 structural, route, oracle, source-gap and export contracts passed.');
