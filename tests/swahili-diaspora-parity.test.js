'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const diasporaApps = require('../assets/js/pages/sw-diaspora-apps');

const ROOT = path.resolve(__dirname, '..');
const APPS = [
  {
    id: 'immigration-points',
    englishRoute: '/tools/immigration-points/',
    swahiliRoute: '/sw/zana/kikokotoo-pointi-za-uhamiaji/',
    file: 'sw/zana/kikokotoo-pointi-za-uhamiaji/index.html',
    artwork: '/assets/img/tools/immigration-points.webp',
  },
  {
    id: 'visa-tracker',
    englishRoute: '/tools/visa-tracker/',
    swahiliRoute: '/sw/zana/kifuatiliaji-ombi-la-visa/',
    file: 'sw/zana/kifuatiliaji-ombi-la-visa/index.html',
    artwork: '/assets/img/tools/visa-tracker.webp',
  },
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

test('the Swahili Diaspora hub owns exactly the two canonical counterparts', () => {
  const hub = read('sw/diaspora/index.html');
  const cards = [...hub.matchAll(/<a class="fd-tool-card" href="([^"]+)">/g)].map((match) => match[1]);
  assert.deepEqual(cards, APPS.map((app) => app.swahiliRoute));
  const collection = jsonLd(hub).find((entry) => entry['@type'] === 'CollectionPage');
  assert.equal(collection.mainEntity.numberOfItems, 2);
  assert.equal(collection.mainEntity.itemListElement.length, 2);
});

test('both apps have native route, local runtime, artwork, privacy and reciprocal locale contracts', () => {
  for (const app of APPS) {
    const html = read(app.file);
    const swUrl = `https://afrotools.com${app.swahiliRoute}`;
    const enUrl = `https://afrotools.com${app.englishRoute}`;
    assert(html.includes(`<link rel="canonical" href="${swUrl}">`), app.file);
    assert(html.includes(`<link rel="alternate" hreflang="sw" href="${swUrl}">`), app.file);
    assert(html.includes(`<link rel="alternate" hreflang="en" href="${enUrl}">`), app.file);
    assert(html.includes(`<meta property="og:url" content="${swUrl}">`), app.file);
    assert(html.includes(`src="${app.artwork}"`), app.file);
    assert(html.includes('data-local-only="true"'), app.file);
    assert(html.includes('/assets/js/pages/sw-diaspora-apps.js'), app.file);
    assert(html.includes('/assets/css/design-system.min.css'), app.file);
    assert(html.includes('/assets/js/components/navbar.min.js'), app.file);
    assert(html.includes('/assets/js/components/footer.min.js'), app.file);
    assert(html.includes('/assets/js/lib/dark-mode.js'), app.file);
    assert(html.includes('<afro-navbar active="diaspora"></afro-navbar>'), app.file);
    assert(html.includes('<afro-footer></afro-footer>'), app.file);
    assert(jsonLd(html).some((entry) => entry['@type'] === 'WebApplication'), app.file);

    const englishHtml = read(app.englishRoute.replace(/^\/|\/$/g, '') + '/index.html');
    assert(englishHtml.includes(`<link rel="alternate" hreflang="sw" href="${swUrl}">`), app.englishRoute);
  }
});
test('Swahili immigration formulas reproduce the selected-factor English oracle', () => {
  const canada = diasporaApps.calculateCanada({
    age: 110,
    education: 135,
    educationIndex: 6,
    clb: 9,
    canadianExperience: 53,
    canadianExperienceIndex: 2,
    foreignYears: 3,
    nomination: 0,
    sibling: 15,
    canadianStudy: 30,
  });
  const australia = diasporaApps.calculateAustralia({
    age: 30,
    education: 20,
    english: 20,
    outsideExperience: 15,
    australiaExperience: 20,
    nomination: 15,
    australiaStudy: 5,
    partner: 10,
  });
  const uk = diasporaApps.calculateUk({
    sponsorship: 20,
    occupation: 20,
    english: 10,
    salary: 41700,
    salaryFloor: 41700,
    goingRateMet: true,
  });

  assert.equal(canada.score, 567);
  assert.equal(australia.score, 120);
  assert.equal(uk.score, 70);
  assert.equal(diasporaApps.calculateUk({
    sponsorship: 20,
    occupation: 20,
    english: 10,
    salary: 41699,
    salaryFloor: 41700,
    goingRateMet: true,
  }).score, 50);
});

test('visa timeline rejects invented ranges and uses only user-entered official values', () => {
  const expectedSources = {
    UK: /gov\.uk/,
    CA: /canada\.ca/,
    AU: /immi\.homeaffairs\.gov\.au/,
    US: /travel\.state\.gov/,
    AE: /icp\.gov\.ae/,
    SC: /home-affairs\.ec\.europa\.eu/,
  };
  assert.deepEqual(Object.keys(diasporaApps.VISA_SOURCES), Object.keys(expectedSources));
  for (const [destination, source] of Object.entries(expectedSources)) {
    const jurisdictionResult = diasporaApps.calculateTimeline({
      destination,
      visaType: 'tourist',
      submitted: '2026-07-01',
      minimum: 15,
      maximum: 30,
      unit: 'days',
      checks: [],
    }, '2026-07-29T12:00:00Z');
    assert.equal(jurisdictionResult.ok, true, destination);
    assert.match(jurisdictionResult.source.href, source, destination);
  }
  assert.equal(diasporaApps.calculateTimeline({
    destination: '',
    visaType: 'tourist',
    submitted: '2026-07-01',
    minimum: 15,
    maximum: 30,
    unit: 'days',
    checks: [],
  }, '2026-07-29T12:00:00Z').ok, false);
  assert.equal(diasporaApps.calculateTimeline({
    destination: 'CA',
    visaType: 'tourist',
    submitted: '2026-07-01',
    minimum: 30,
    maximum: 15,
    unit: 'days',
    checks: [],
  }, '2026-07-29T12:00:00Z').ok, false);
  const result = diasporaApps.calculateTimeline({
    destination: 'CA',
    visaType: 'tourist',
    submitted: '2026-07-01',
    minimum: 15,
    maximum: 30,
    unit: 'days',
    checks: [true, false],
  }, '2026-07-29T12:00:00Z');
  assert.equal(result.ok, true);
  assert.equal(result.elapsedDays, 28);
  assert.equal(result.minimumCalendarDays, 15);
  assert.equal(result.maximumCalendarDays, 30);
  assert.match(result.source.href, /canada\.ca/);
  assert.equal(diasporaApps.calculateTimeline({
    destination: 'UK', visaType: 'work', submitted: '2026-02-31',
    minimum: 2, maximum: 4, unit: 'weeks', checks: [],
  }, '2026-07-29T12:00:00Z').ok, false);
  const originalTz = process.env.TZ;
  process.env.TZ = 'Pacific/Honolulu';
  try {
    const localCalendarResult = diasporaApps.calculateTimeline({
      destination: 'UK', visaType: 'work', submitted: '2026-07-28',
      minimum: 1, maximum: 2, unit: 'days', checks: [],
    }, '2026-07-29T01:00:00Z');
    assert.equal(localCalendarResult.ok, true);
    assert.equal(localCalendarResult.elapsedDays, 0);
    assert.equal(localCalendarResult.today, '2026-07-28');
  } finally {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  }
  const visaHtml = read('sw/zana/kifuatiliaji-ombi-la-visa/index.html');
  assert.match(visaHtml, /Viungo vilikaguliwa 31 Julai 2026/);
  assert.equal(diasporaApps.VISA_SOURCES.UK.href, 'https://www.gov.uk/guidance/visa-processing-times-applications-outside-the-uk');
  assert.match(visaHtml, /https:\/\/www\.gov\.uk\/guidance\/visa-processing-times-applications-outside-the-uk/);
  assert.match(visaHtml, /id="fd-visa-print"[^>]*>Chapisha \/ hifadhi PDF<\/button>/);
  const immigrationHtml = read('sw/zana/kikokotoo-pointi-za-uhamiaji/index.html');
  assert.match(immigrationHtml, /english-owner-blob-829a2b52c4d1-reviewed-2026-07-31/);
  assert.match(immigrationHtml, /id="fd-immigration-import"/);
  assert.match(immigrationHtml, /id="fd-immigration-print"[^>]*>Chapisha \/ hifadhi PDF<\/button>/);
});

test('registry and locale policy classify exactly two native Swahili Diaspora counterparts', () => {
  const registry = read('assets/js/components/tool-registry.js');
  for (const app of APPS) {
    const row = registry.split('\n').find((line) => (
      line.includes(`sourceId: "${app.id}"`) &&
      line.includes('category: "diaspora"') &&
      line.includes('lang: "sw"')
    ));
    assert(row, `missing Swahili registry row for ${app.id}`);
    assert(row.includes(`href: "${app.swahiliRoute}"`), app.id);
  }

  const policy = JSON.parse(read('data/registry/locale-coverage-policy.json'));
  for (const app of APPS) {
    const override = policy.overrides.find((entry) => entry.route === app.swahiliRoute);
    assert.equal(override.state, 'native');
    assert.equal(override.engineLocaleNeutral, true);
    assert.equal(override.equivalentRoute, app.englishRoute);
  }
});

test('acceptance and AI stay fail-closed for coordinator review', () => {
  const acceptance = JSON.parse(read('data/audits/swahili-free-app-acceptance.json'));
  const aiMap = require('../assets/js/ai/swahili-route-map.generated');
  for (const app of APPS) {
    assert.equal(acceptance.entries.some((entry) => entry.englishId === app.id && entry.status === 'accepted'), false);
    assert.equal(Object.hasOwn(aiMap.ids, app.id), false);
  }
});
