'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const parity = require('../assets/js/pages/sw-career-parity');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const APPS = [
  {
    id: 'career-growth',
    route: '/sw/zana/ukuaji-wa-kazi/',
    file: 'sw/zana/ukuaji-wa-kazi/index.html',
    english: 'tools/career-growth/index.html',
    french: 'fr/tools/croissance-carriere/index.html',
    image: 'career-growth.webp',
  },
  {
    id: 'career-switch',
    route: '/sw/zana/kubadili-kazi/',
    file: 'sw/zana/kubadili-kazi/index.html',
    english: 'tools/career-switch/index.html',
    french: 'fr/tools/changement-carriere/index.html',
    image: 'career-switch.webp',
  },
  {
    id: 'retirement-readiness',
    route: '/sw/zana/utayari-wa-kustaafu/',
    file: 'sw/zana/utayari-wa-kustaafu/index.html',
    english: 'tools/retirement-readiness/index.html',
    french: 'fr/tools/preparation-retraite/index.html',
    image: 'retirement-readiness.webp',
  },
  {
    id: 'salary-negotiation',
    route: '/sw/zana/majadiliano-ya-mshahara/',
    file: 'sw/zana/majadiliano-ya-mshahara/index.html',
    english: 'tools/salary-negotiation/index.html',
    french: 'fr/tools/negociation-salaire/index.html',
    image: 'salary-negotiation.webp',
  },
];

test('all four Career routes are native apps with private export and reopen contracts', () => {
  for (const app of APPS) {
    const html = read(app.file);
    assert.match(html, new RegExp(`data-sw-career-app="${app.id}"`));
    assert.match(html, /assets\/js\/pages\/sw-career-parity\.js/);
    assert.match(html, /data-career-action="txt"/);
    assert.match(html, /data-career-action="json"/);
    assert.match(html, /data-career-action="save"/);
    assert.match(html, /data-career-action="open"/);
    assert.match(html, /data-career-import/);
    assert.match(html, /data-local-only="true"/);
    assert.match(html, /ridhaa ya wazi/i);
    assert.match(html, /<afro-navbar active="career"><\/afro-navbar>/);
    assert.match(html, /<afro-footer><\/afro-footer>/);
    assert.match(html, /assets\/js\/components\/navbar\.min\.js/);
    assert.match(html, /assets\/js\/components\/footer\.min\.js/);
    assert.match(html, /assets\/js\/supabase\.min\.js/);
    assert.ok(
      html.indexOf('/assets/js/supabase.min.js') < html.indexOf('/assets/js/components/navbar.min.js'),
      `${app.id}: local Supabase SDK must exist before delayed shared-navbar auth startup`,
    );
    assert.doesNotMatch(html, /cdn\.jsdelivr\.net/i);
    assert.match(html, new RegExp(`assets/img/tools/${app.image}`));
    assert.doesNotMatch(html, /<iframe\b/i);
    assert.doesNotMatch(html, /\bcareerCalc\s*\(/);
    assert.doesNotMatch(html, /https:\/\/fonts\./);
  }
});

test('Career Growth reproduces the frozen English selected-factor oracle', () => {
  const result = parity.calculateCareerGrowth({
    country: 'KE',
    industry: 'tech',
    level: 2,
    salary: 120000,
    experience: 4,
    education: 'degree',
    path: 'management',
    learning: '5',
    network: 'medium',
    mobility: 'sometimes',
  });
  assert.equal(result.startSalary, 120000);
  assert.ok(Math.abs(result.annualRaise - 0.19) < 1e-12);
  assert.ok(Math.abs(result.fiveYearSalary - 653180.6087821636) < 1e-6);
  assert.ok(Math.abs(result.tenYearSalary - 2942955.271537162) < 1e-6);
  assert.ok(Math.abs(result.cumulativeEarnings - 129026113.05804905) < 1e-6);
  assert.equal(result.projectedLevel, 'Mkurugenzi / VP');
  assert.equal(result.rows.length, 11);
  assert.ok(Math.abs(result.promotionPremium - 0.2272727272727273) < 1e-12);
  assert.deepEqual(result.growthDrivers.map((item) => item.value), ['19% kwa mwaka', '+23% katika ngazi inayofuata', '+15% kwa kila hatua']);
  assert.equal(result.recommendedNextSteps.length, 2);
  const report = parity.report(result);
  assert.match(report, /Vichocheo vya ukuaji/);
  assert.match(report, /Hatua zinazopendekezwa/);
  assert.match(report, /Nyongeza ya kupandishwa ngazi/);
});

test('Career Switch reproduces cost, break-even, and five-year English oracle', () => {
  const result = parity.calculateCareerSwitch({
    currency: 'KES',
    currentSalary: 100000,
    currentBenefits: 15000,
    newSalary: 160000,
    trainingCost: 240000,
    trainingMonths: 6,
    searchMonths: 2,
    partTimeRatio: 0.5,
    growthRate: 8,
    satisfaction: 5,
  });
  assert.equal(result.totalCost, 815000);
  assert.equal(result.monthlyGain, 45000);
  assert.equal(result.breakEven, 19);
  assert.equal(result.rows.length, 5);
  assert.ok(Math.abs(result.rows[4].newCareer - 10010256.173006188) < 1e-6);
  assert.ok(Math.abs(result.rows[4].difference - 3110256.173006188) < 1e-6);
});

test('Retirement Readiness reproduces 25x, real-return, 4 percent, and gap oracle', () => {
  const result = parity.calculateRetirement({
    country: 'KE',
    age: 35,
    retireAge: 60,
    savings: 1200000,
    contribution: 30000,
    salary: 120000,
    pensionPayout: 0,
    expenses: 80000,
    dependants: 1,
    housing: 'owned',
    health: 'public',
  });
  assert.equal(result.target, 24000000);
  assert.equal(result.pessimistic, 10200000);
  assert.ok(Math.abs(result.projected - 15918258.1611145) < 1e-6);
  assert.ok(Math.abs(result.optimistic - 22042839.797065057) < 1e-6);
  assert.equal(result.score, 66);
  assert.ok(Math.abs(result.monthlyFromSavings - 53060.86053704834) < 1e-6);
  assert.ok(Math.abs(result.shortfall - -26939.139462951658) < 1e-6);
  assert.ok(Math.abs(result.extraContribution - 18120.179559550987) < 1e-6);
  assert.match(parity.report(result), /Mchango wa ziada unaohitajika: KES 18K\/mwezi/);
});

test('Salary Negotiation uses only the entered benchmark for disclosed bands', () => {
  const result = parity.calculateSalaryNegotiation({
    country: 'KE',
    industry: 'tech',
    role: 'individual_contributor',
    experience: 5,
    benchmark: 180000,
    currentSalary: 140000,
    offerSalary: 165000,
    companySize: 'medium',
    location: 'hybrid',
  });
  assert.equal(result.lower, 162000);
  assert.equal(result.median, 180000);
  assert.equal(result.counter, 189000);
  assert.equal(result.upper, 198000);
  assert.equal(result.comparison, 'Chini ya kiwango cha kati');
  assert.match(result.script, /Ikiwa mshahara wa msingi hauwezi kubadilika/);
  assert.match(result.script, /bonasi ya utendaji/);
  assert.match(parity.report(result), /tathmini ya utendaji baada ya miezi 6/);
});

test('invalid values fail closed and JSON imports are app-bound', () => {
  assert.throws(
    () => parity.calculateCareerSwitch({
      currency: 'KES', currentSalary: 0, currentBenefits: 0, newSalary: 1,
      trainingCost: 0, trainingMonths: 0, searchMonths: 0,
      partTimeRatio: 0, growthRate: 0, satisfaction: 5,
    }),
    /mshahara wa sasa/i,
  );
  assert.throws(
    () => parity.calculateRetirement({
      country: 'KE', age: 60, retireAge: 60, savings: 0, contribution: 0,
      salary: 0, pensionPayout: 0, expenses: 1, dependants: 0,
      housing: 'owned', health: 'public',
    }),
    /lazima uzidi/i,
  );
  const payload = JSON.stringify({
    schema: parity.SCHEMA,
    locale: 'sw',
    app: 'career-growth',
    input: {},
  });
  assert.throws(() => parity.parseEnvelope(payload, 'career-switch'), /si mpango halali/i);
});

test('registry and policy own exactly four native Career counterparts', () => {
  const registry = read('assets/js/components/tool-registry.js');
  const policy = JSON.parse(read('data/registry/locale-coverage-policy.json'));
  for (const app of APPS) {
    assert.equal((registry.match(new RegExp(`sourceId: '${app.id}'`, 'g')) || []).length >= 1, true);
    const row = policy.overrides.find((entry) => entry.route === app.route);
    assert.ok(row, `missing policy row for ${app.route}`);
    assert.equal(row.state, 'native');
    assert.match(row.sourceOwner, /sw-career-parity\.js/);
  }
  const swRows = registry.split(/\r?\n/).filter((line) => line.includes("lang: 'sw'") && APPS.some((app) => line.includes(`sourceId: '${app.id}'`)));
  assert.equal(swRows.length, 4);
});

test('canonical, artwork, and English/French/Swahili hreflang are fully reciprocal', () => {
  for (const app of APPS) {
    const sw = read(app.file);
    const en = read(app.english);
    const fr = read(app.french);
    assert.match(sw, new RegExp(`rel="canonical" href="https://afrotools.com${app.route}"`));
    assert.match(sw, /hreflang="en"/);
    assert.match(sw, /hreflang="fr"/);
    assert.match(sw, /hreflang="sw"/);
    assert.match(en, new RegExp(`hreflang="sw" href="https://afrotools.com${app.route}"`));
    assert.match(fr, new RegExp(`hreflang="sw" href="https://afrotools.com${app.route}"`));
  }
});

test('central acceptance and generated AI remain fail-closed for coordinator review', () => {
  const acceptance = JSON.parse(read('data/audits/swahili-free-app-acceptance.json'));
  const aiMap = require('../assets/js/ai/swahili-route-map.generated');
  for (const app of APPS) {
    assert.equal(acceptance.entries.some((entry) => entry.englishId === app.id && entry.status === 'accepted'), false);
    assert.equal(Object.hasOwn(aiMap.ids, app.id), false);
  }
});
