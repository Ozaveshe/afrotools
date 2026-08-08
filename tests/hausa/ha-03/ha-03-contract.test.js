'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { buildReport: buildHausaVisibleCopyReport } = require('../../../scripts/audit-hausa-visible-copy.js');

const ROOT = path.resolve(__dirname, '../../..');
const BASE_SHA = '6edacda8437e1fa9b9e5a512138cbdd3169e38be';
const rows = [
  { id: 'waec-calculator', route: '/ha/kayan-aiki/kalkuleta-waec/', app: 'waec', hub: 'ha/ilimi/index.html', image: 'waec-calculator.webp' },
  { id: 'jamb-aggregate', route: '/ha/kayan-aiki/jimillar-jamb/', app: 'jamb', hub: 'ha/ilimi/index.html', image: 'jamb-aggregate.webp' },
  { id: 'gpa-calculator', route: '/ha/kayan-aiki/kalkuleta-gpa/', app: 'gpa', hub: 'ha/ilimi/index.html', image: 'gpa-calculator.webp' },
  { id: 'school-fees', route: '/ha/kayan-aiki/kudin-makaranta/', app: 'school-fees', hub: 'ha/ilimi/index.html', image: 'school-fees.webp' },
  { id: 'scholarship-finder', route: '/ha/kayan-aiki/neman-tallafin-karatu/', app: 'scholarships', hub: 'ha/ilimi/index.html', image: 'scholarship-finder.webp' },
  { id: 'nysc-allowance', route: '/ha/kayan-aiki/alawus-na-nysc/', app: 'nysc', hub: 'ha/ilimi/index.html', image: 'nysc-allowance.webp' },
  { id: 'student-budget', route: '/ha/kayan-aiki/kasafin-dalibi/', app: 'student-budget', hub: 'ha/ilimi/index.html', image: 'student-budget.webp' },
  { id: 'hausa-translator', route: '/ha/kayan-aiki/fassarar-hausa/', app: 'translator', hub: 'ha/harshe-da-fassara/index.html', image: 'hausa-translator.webp' }
];

function localFile(route) {
  return path.join(ROOT, route.replace(/^\//, ''), 'index.html');
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function scholarshipMatcher() {
  const context = {};
  vm.runInNewContext(read('engines/scholarship-matcher.js'), context, { filename: 'scholarship-matcher.js' });
  return context.ScholarshipMatcher;
}

function humanFacingCopy(html) {
  const parts = [];
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) parts.push(title[1]);
  for (const match of html.matchAll(/<meta\s+([^>]*?)>/gi)) {
    const attrs = match[1] || '';
    const key = (attrs.match(/(?:name|property)=["']([^"']+)["']/i) || [])[1] || '';
    const content = (attrs.match(/content=["']([^"']*)["']/i) || [])[1] || '';
    if (/^(?:description|ai-content-declaration|og:title|og:description|twitter:title|twitter:description)$/i.test(key)) parts.push(content);
  }
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || '';
  for (const match of body.matchAll(/\b(?:placeholder|aria-label|alt|title)=["']([^"']+)["']/gi)) parts.push(match[1]);
  parts.push(body
    .replace(/<(?:script|style|template|svg)\b[^>]*>[\s\S]*?<\/(?:script|style|template|svg)>/gi, ' ')
    .replace(/<[^>]+>/g, ' '));
  return parts.join('\n')
    .replace(/&nbsp;|&amp;|&quot;|&#39;/gi, ' ')
    .replace(/\s+/g, ' ');
}

test('HA-03 denominator is exactly the eight director-assigned rows', () => {
  assert.equal(rows.length, 8);
  assert.deepEqual(rows.map((row) => row.id), [
    'waec-calculator', 'jamb-aggregate', 'gpa-calculator', 'school-fees',
    'scholarship-finder', 'nysc-allowance', 'student-budget', 'hausa-translator'
  ]);
});

test('all exact Hausa routes are native, self-canonical, structured, and export-honest', () => {
  for (const row of rows) {
    const file = localFile(row.route);
    assert.ok(fs.existsSync(file), `${row.id}: route file exists`);
    const html = fs.readFileSync(file, 'utf8');
    const canonical = `https://afrotools.com${row.route}`;
    assert.match(html, /<html lang="ha">/i, `${row.id}: Hausa document language`);
    assert.match(html, new RegExp(`data-ha03-app="${row.app}"`), `${row.id}: native runtime mount`);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${row.id}: one canonical`);
    assert.ok(html.includes(`rel="canonical" href="${canonical}"`), `${row.id}: exact self-canonical`);
    assert.ok(html.includes(`property="og:url" content="${canonical}"`), `${row.id}: exact OG URL`);
    assert.ok(html.includes('"inLanguage":"ha"'), `${row.id}: Hausa schema`);
    assert.ok(html.includes(`meta name="tool-id" content="${row.id}"`), `${row.id}: English source id preserved`);
    assert.ok(html.includes('data-ha03-export'), `${row.id}: TXT export control`);
    assert.ok(html.includes('/ha/assets/ha-03-education-language.js'), `${row.id}: shared Hausa controller`);
    assert.doesNotMatch(html, /<iframe\b|http-equiv=["']refresh|location\.(?:href|replace)|href=["']\/tools\//i, `${row.id}: no iframe, redirect, bridge, or English UI link`);
    assert.doesNotMatch(html, /PDF export|CSV export|DOCX|XLSX/i, `${row.id}: no unproved export claim`);
    assert.doesNotMatch(html, /Verification, freshness and limits|Based on the AfroTools workflow|Shafin Turanci|English version/i, `${row.id}: no known fallback transplant copy`);
    assert.doesNotMatch(html, /\uFFFD|Ã|Â|â€|ï¿½/, `${row.id}: no mojibake`);
    const schemas = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g));
    assert.ok(schemas.length >= 1, `${row.id}: structured data present`);
    for (const schema of schemas) assert.doesNotThrow(() => JSON.parse(schema[1]), `${row.id}: valid JSON-LD`);
    const artwork = path.join(ROOT, 'assets/img/tools', row.image);
    assert.ok(fs.existsSync(artwork) && fs.statSync(artwork).size > 1000, `${row.id}: nontrivial artwork exists`);
    assert.ok(html.includes(`/assets/img/tools/${row.image}`), `${row.id}: artwork is used`);
  }
});

test('the eight routes have zero Hausa visible-copy blockers and clean human-facing metadata', () => {
  const routeSet = new Set(rows.map((row) => row.route));
  const audit = buildHausaVisibleCopyReport();
  const blockers = audit.groups.BLOCKER_VISIBLE_ENGLISH.filter((finding) => routeSet.has(finding.route));
  assert.deepEqual(blockers, [], 'route-scoped scripts/audit-hausa-visible-copy.js result');

  const forbiddenHumanCopy = /(?:\bShare\b|Share fom|Share bincike|\bGrade\b|Core\/compulsory|\(English Language\)|grade point|Weighted percentage|Weighted score|\baverage\b|Arts da Humanities|\bPercentage\b|reviewed feed|Budget arithmetic|\bentitlement\b|\barrears\b|income streams|service year|\bprofile\b|ranar ƙage|\bbenchmark\b|\badmissions\b|\bBuffer\b|Positive balance|\baffordability\b|\bdeadlines\b|\btuition\b|\bextras\b|\buniform\b|\blevies\b|\boverall\b|\bState\b|\bapp\b)/i;
  for (const row of rows) {
    const copy = humanFacingCopy(fs.readFileSync(localFile(row.route), 'utf8'));
    assert.doesNotMatch(copy, forbiddenHumanCopy, `${row.id}: visible UI and metadata contain no rejected English phrase`);
  }
});

test('owned Hausa hubs discover every assigned exact route', () => {
  const caches = new Map();
  for (const row of rows) {
    if (!caches.has(row.hub)) caches.set(row.hub, read(row.hub));
    assert.ok(caches.get(row.hub).includes(`href="${row.route}"`), `${row.id}: linked from ${row.hub}`);
  }
});

test('central all-tools hub is byte-identical to the frozen base after collision correction', () => {
  const frozen = execFileSync('git', ['show', `${BASE_SHA}:ha/kayan-aiki/index.html`], { cwd: ROOT });
  const current = fs.readFileSync(path.join(ROOT, 'ha/kayan-aiki/index.html'));
  assert.deepEqual(current, frozen);
});

test('coordinator-owned and unrelated locale files remain outside the diff', () => {
  const changed = execFileSync('git', ['diff', '--name-only', BASE_SHA, '--'], { cwd: ROOT, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter(Boolean).map((file) => file.replace(/\\/g, '/'));
  const forbidden = new Set([
    'data/audits/hausa-free-app-acceptance.json',
    'scripts/build-hausa-free-app-parity-inventory.js',
    'reports/hausa-free-app-parity-inventory.json',
    'reports/hausa-free-app-parity-inventory.md',
    'docs/HAUSA-LANGUAGE-DIRECTOR-LEDGER.md',
    'data/registry/locale-page-coverage.json',
    'data/registry/locale-coverage-policy.json',
    'assets/js/components/tool-registry.js',
    'assets/js/components/navbar.js',
    'assets/js/components/footer.js',
    'lang/ha.json',
    'scripts/build-hausa-product-surface.js',
    'scripts/report-hausa-coverage.js',
    'ha/kayan-aiki/index.html'
  ]);
  assert.deepEqual(changed.filter((file) => forbidden.has(file)), []);
  assert.deepEqual(changed.filter((file) => /^(?:fr|sw|yo)\//.test(file)), []);
  assert.deepEqual(changed.filter((file) => /(?:^|\/)(?:sitemap[^/]*\.xml|_redirects|service-worker[^/]*)$/.test(file)), []);
});

test('DOM-free source engines preserve the English formula semantics', () => {
  const waec = require(path.join(ROOT, 'tools/waec-calculator/waec-engine.js'));
  const jamb = require(path.join(ROOT, 'tools/jamb-aggregate/jamb-aggregate-engine.js'));
  const gpa = require(path.join(ROOT, 'tools/gpa-calculator/gpa-engine.js'));
  const fees = require(path.join(ROOT, 'tools/school-fees/school-fees-engine.js'));
  const nysc = require(path.join(ROOT, 'tools/nysc-allowance/nysc-budget-engine.js'));
  const budget = require(path.join(ROOT, 'tools/student-budget/student-budget-engine.js'));
  const matcher = scholarshipMatcher();

  const nigeria = waec.calculateNigeria([
    { name: 'English Language', grade: 'A1' }, { name: 'Mathematics', grade: 'B2' },
    { name: 'Biology', grade: 'B3' }, { name: 'Chemistry', grade: 'C4' }, { name: 'Physics', grade: 'C5' }
  ]);
  assert.equal(nigeria.complete, true);
  assert.equal(nigeria.value, 15);

  const ghana = waec.calculateGhana([
    { name: 'English Language', grade: 'A1' }, { name: 'Core Mathematics', grade: 'B2' },
    { name: 'Integrated Science', grade: 'B3' }, { name: 'Biology', grade: 'C4' },
    { name: 'Chemistry', grade: 'C5' }, { name: 'Physics', grade: 'C6' }
  ], 'science');
  assert.equal(ghana.complete, true);
  assert.equal(ghana.value, 21);

  const jambResult = jamb.calculate({ utme: 300, postUtme: 70, utmeWeight: 60, postUtmeWeight: 40, benchmark: 65 });
  assert.equal(jambResult.ok, true);
  assert.equal(jambResult.aggregate, 73);
  assert.equal(jambResult.difference, 8);

  const gpaResult = gpa.calculateSemester([
    { name: 'Synthetic A', credits: 3, value: 4 }, { name: 'Synthetic B', credits: 2, value: 3 }
  ], gpa.getTemplate('direct-points', 5));
  assert.equal(gpaResult.totalCredits, 5);
  assert.equal(gpaResult.totalPoints, 18);
  assert.equal(gpaResult.average, 3.6);

  const feeResult = fees.calculate({ school: 'Synthetic option', currency: 'NGN', tuition: 120000, extras: 30000, monthlySupport: 50000, rhythm: 3 });
  assert.equal(feeResult.annual, 150000);
  assert.equal(feeResult.monthlyReserve, 12500);
  assert.equal(feeResult.paymentChunk, 50000);

  const scholarshipResults = matcher.match([{ name: 'Synthetic scholarship', levels: ['masters'], destinations: ['uk'], fields: ['stem'], min_gpa_4: 3 }], {
    gpa_value: 3.5, gpa_scale: '4.0', target_fields: ['stem'], target_countries: ['uk'], target_study_level: 'masters'
  });
  assert.equal(scholarshipResults.length, 1);
  assert.equal(scholarshipResults[0].scholarship.name, 'Synthetic scholarship');
  assert.ok(scholarshipResults[0].percent >= 80);

  const nyscResult = nysc.calculate({
    planMonths: 12, federalMonthly: 77000, federalMonths: 12, stateMonthly: 0, stateMonths: 0,
    ppaMonthly: 10000, ppaMonths: 6, otherMonthly: 0, otherMonths: 0, oneTimeIncome: 5000,
    housingMonthly: 20000, foodMonthly: 25000, transportMonthly: 10000, dataMonthly: 5000,
    otherCostMonthly: 0, oneTimeCosts: 10000
  });
  assert.equal(nyscResult.valid, true);
  assert.equal(nyscResult.totalIncome, 989000);
  assert.equal(nyscResult.totalCosts, 730000);

  const budgetResult = budget.calculate({
    periodMonths: 4, monthlyIncome: 50000, periodFunding: 100000,
    monthlyExpenses: { housing: 20000, food: 15000, transport: 5000, data: 3000, other: 2000 },
    periodExpenses: { tuition: 90000, books: 10000, other: 0 }
  });
  assert.equal(budgetResult.ok, true);
  assert.equal(budgetResult.totalResources, 300000);
  assert.equal(budgetResult.totalExpenses, 280000);
  assert.equal(budgetResult.balance, 20000);
});

test('Hausa phrasebook is Unicode-safe, sourced, and substantive', () => {
  const phrasebook = require(path.join(ROOT, 'ha/assets/ha-03-hausa-phrasebook.js'));
  assert.equal(phrasebook.script, 'Boko');
  assert.equal(phrasebook.checkedAt, '2026-07-26');
  assert.match(phrasebook.sourceUrl, /^https:\/\//);
  assert.ok(phrasebook.entries.length >= 40);
  assert.ok(phrasebook.entries.some((entry) => entry.ha.includes('ƙ')));
  assert.ok(phrasebook.entries.some((entry) => entry.ha.includes('ɗ')));
  assert.doesNotMatch(JSON.stringify(phrasebook), /\uFFFD|Ã|Â|â€|ï¿½/);
});

test('Hausa runtime keeps raw inputs out of URLs, logs, analytics, and direct network calls', () => {
  const runtime = read('ha/assets/ha-03-education-language.js');
  assert.doesNotMatch(runtime, /console\.(?:log|info|warn|error)|location\.(?:search|hash)|history\.(?:pushState|replaceState)|gtag\(|analytics\.|fetch\(|XMLHttpRequest|sendBeacon/);
  assert.match(runtime, /new Blob\(\['\\ufeff'/, 'TXT export includes UTF-8 BOM for parser compatibility');
  assert.equal((runtime.match(/bindExport\(/g) || []).length, 9, 'one helper plus eight app bindings');
});
