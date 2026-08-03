'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const parity = require('../assets/js/pages/sw-security-parity');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const APPS = [
  { id: 'cctv-cost', route: '/sw/zana/gharama-za-cctv/', file: 'sw/zana/gharama-za-cctv/index.html', en: 'tools/cctv-cost/index.html', fr: 'fr/tools/cout-cctv/index.html', image: 'cctv-cost.webp' },
  { id: 'cybersecurity-assessment', route: '/sw/zana/tathmini-ya-usalama-wa-kidijitali/', file: 'sw/zana/tathmini-ya-usalama-wa-kidijitali/index.html', en: 'tools/cybersecurity-assessment/index.html', fr: 'fr/tools/evaluation-risque-cybersecurite/index.html', image: 'cybersecurity-assessment.webp' },
  { id: 'data-breach-cost', route: '/sw/zana/gharama-ya-uvujaji-wa-data/', file: 'sw/zana/gharama-ya-uvujaji-wa-data/index.html', en: 'tools/data-breach-cost/index.html', fr: 'fr/tools/cout-violation-donnees/index.html', image: 'data-breach-cost.webp' },
  { id: 'fire-safety-checklist', route: '/sw/zana/ukaguzi-wa-usalama-wa-moto/', file: 'sw/zana/ukaguzi-wa-usalama-wa-moto/index.html', en: 'tools/fire-safety-checklist/index.html', fr: 'fr/tools/checklist-securite-incendie/index.html', image: 'fire-safety-checklist.webp' },
  { id: 'home-security-cost', route: '/sw/zana/gharama-za-usalama-wa-nyumbani/', file: 'sw/zana/gharama-za-usalama-wa-nyumbani/index.html', en: 'tools/home-security-cost/index.html', fr: 'fr/tools/cout-securite-maison/index.html', image: 'home-security-cost.webp' },
  { id: 'password-strength', route: '/sw/zana/nguvu-ya-nenosiri/', file: 'sw/zana/nguvu-ya-nenosiri/index.html', en: 'tools/password-strength/index.html', fr: 'fr/tools/force-mot-de-passe/index.html', image: 'password-strength.webp' },
  { id: 'phishing-quiz', route: '/sw/zana/jaribio-la-kutambua-hadaa/', file: 'sw/zana/jaribio-la-kutambua-hadaa/index.html', en: 'tools/phishing-quiz/index.html', fr: 'fr/tools/quiz-phishing/index.html', image: 'phishing-quiz.webp' },
];

test('all seven Security routes are native local-first apps with source boundaries', () => {
  for (const app of APPS) {
    const html = read(app.file);
    assert.match(html, new RegExp(`data-sw-security-app="${app.id}"`));
    assert.match(html, /assets\/js\/pages\/sw-security-parity\.js/);
    assert.match(html, /data-local-only="true"/);
    assert.match(html, /Chanzo, uhalisia wa muda na uhakika/i);
    assert.match(html, /Imekaguliwa:\s*<\/strong>\s*2026-08-02/i);
    assert.match(html, /ridhaa ya wazi/i);
    assert.match(html, new RegExp(`assets/img/tools/${app.image}`));
    assert.doesNotMatch(html, /<iframe\b/i);
    assert.doesNotMatch(html, /https:\/\/fonts\./i);
  }
});

test('English inline owners retain the formula fingerprints frozen by this candidate', () => {
  const cctv = read('tools/cctv-cost/index.html');
  assert.match(cctv, /var totalCameras=cameraCost\*cameras/);
  assert.match(cctv, /var hddCount=Math\.ceil\(cameras\*storage\/2\/2\)/);
  assert.match(cctv, /var fiveYear=setupTotal\+monthlyTotal\*60/);

  const cyber = read('tools/cybersecurity-assessment/index.html');
  assert.match(cyber, /var score=checked\*d\.pts/);
  assert.match(cyber, /incidents==='minor'\) totalScore-=5/);
  assert.match(cyber, /incidents==='major'\) totalScore-=15/);
  assert.match(cyber, /totalScore>=90\?'A':totalScore>=75\?'B':totalScore>=60\?'C':totalScore>=45\?'D':'F'/);

  const breach = read('tools/data-breach-cost/index.html');
  assert.match(breach, /var SENS_MULT=\{low:0\.7,medium:1\.0,high:1\.4,critical:1\.9\}/);
  assert.match(breach, /var notification=Math\.min\(records\*2,50000\)/);
  assert.match(breach, /var downtime=sizeBase\*0\.32/);
  assert.match(breach, /totalUSD=Math\.max\(totalUSD, sizeBase\*0\.8\)/);
});

test('CCTV reproduces the frozen English hardware, storage, and five-year oracle', () => {
  const result = parity.calculateCctv({ country: 'KE', cameras: 8, cameraType: 'ip', recorder: 'nvr', storage: 4, installation: 'professional', monitoring: 'yes' });
  assert.deepEqual({ setup: result.setupTotal, monthly: result.monthlyTotal, fiveYear: result.fiveYear, hddCount: result.hddCount }, { setup: 79000, monthly: 2000, fiveYear: 199000, hddCount: 8 });
  assert.throws(() => parity.calculateCctv({ country: 'KE', cameras: 8, cameraType: 'analog', recorder: 'nvr', storage: 4, installation: 'professional', monitoring: 'yes' }), /DVR|NVR/);
});

test('Cyber assessment reproduces 20-control weights and incident penalty oracle', () => {
  const result = parity.calculateCyber({ country: 'KE', industry: 'technology', employees: '11-50', dataSensitivity: 'high', incidents: 'minor', checks: ['firewall','wifi_secure','encryption','backup','mfa','pw_policy','antivirus','os_updates','sec_training','incident_plan'] });
  assert.deepEqual({ base: result.baseScore, penalty: result.incidentPenalty, score: result.score, grade: result.grade }, { base: 50, penalty: 5, score: 45, grade: 'D' });
  const all = parity.CYBER_DOMAINS.flatMap((domain) => domain.checks);
  assert.equal(parity.calculateCyber({ country: 'NG', incidents: 'none', checks: all }).score, 100);
});

test('Data breach reproduces record, response component, FX, and exclusion oracle', () => {
  const result = parity.calculateBreach({ country: 'KE', records: 10000, basePerRecord: 165, sensitivity: 'medium', orgSize: 'mid', detection: 'medium' });
  assert.deepEqual({ usd: result.totalUSD, local: result.totalLocal, perRecord: result.perRecord }, { usd: 1920000, local: 249600000, perRecord: 192 });
  assert.equal(result.rows.reduce((sum, row) => sum + row[1], 0), 1920000);
  assert.match(result.display.subtitle, /faini.*hazija/i);
});

test('Fire checklist reuses the exact English weight and remediation engine', () => {
  const result = parity.calculateFire({ country: 'KE', propType: 'office', area: 500, floors: 2, occupants: 50, checks: ['c1','c3','c5','c6','c8','c9','c10','c12','c15'] });
  assert.deepEqual({ score: result.score, remediation: result.remediation, maintenance: result.maintenance }, { score: 61, remediation: 259200, maintenance: 12960 });
  assert.throws(() => parity.calculateFire({ country: 'KE', propType: 'office', area: 9, floors: 2, occupants: 50, checks: [] }), /eneo/i);
});

test('Home security reuses the exact English midpoint and package engine', () => {
  const result = parity.calculateHome({ country: 'KE', homeType: 'bungalow', riskLevel: 'medium', securityLevel: 'standard' });
  assert.deepEqual({ cctv: result.cctvSetup, alarm: result.alarmSetup, setup: result.totalSetup, monthly: result.totalMonthly, annual: result.annualCost, fiveYear: result.fiveYear }, { cctv: 70000, alarm: 25000, setup: 95000, monthly: 2700, annual: 51400, fiveYear: 257000 });
  assert.throws(() => parity.calculateHome({ country: 'XX', homeType: 'bungalow', riskLevel: 'medium', securityLevel: 'standard' }), /halali/i);
});

test('Password and phishing reproduce frozen local heuristics without secret export', () => {
  const password = parity.calculatePassword({ password: 'CorrectHorseBatteryStaple!9' });
  assert.equal(password.score, 80);
  assert.ok(Math.abs(password.entropy - 176.97389899529622) < 1e-12);
  assert.equal(password.crackTime, 'Zaidi ya bilioni 1 ya miaka');
  assert.equal(Object.hasOwn(password, 'input'), false);
  assert.throws(() => parity.envelope(password), /hayana export/i);
  const quiz = parity.calculatePhishing({ answers: parity.QUESTIONS.map((question) => question.answer) });
  assert.deepEqual({ score: quiz.score, grade: quiz.grade }, { score: 10, grade: 'Matokeo thabiti' });
  assert.throws(() => parity.calculatePhishing({ answers: [1] }), /maswali yote 10/i);
});

test('portable exports are schema, locale, and app bound and recalculate on reopen', () => {
  const plan = parity.calculateBreach({ country: 'KE', records: 10000, basePerRecord: 165, sensitivity: 'medium', orgSize: 'mid', detection: 'medium' });
  const exported = parity.envelope(plan);
  assert.deepEqual(Object.keys(exported), ['schema', 'locale', 'app', 'reviewed', 'input']);
  const parsed = parity.parseEnvelope(JSON.stringify(exported), 'data-breach-cost');
  assert.equal(parity.calculateBreach(parsed.input).totalUSD, plan.totalUSD);
  assert.throws(() => parity.parseEnvelope(JSON.stringify(exported), 'cctv-cost'), /si mpango halali/i);
  assert.throws(() => parity.parseEnvelope('{not-json', 'data-breach-cost'), /haijafunguka/i);
});

test('runtime has stale clearing, local export, and no unexpected network or raw logging', () => {
  const runtime = read('assets/js/pages/sw-security-parity.js');
  assert.match(runtime, /form\.addEventListener\('input',stale\)/);
  assert.match(runtime, /form\.addEventListener\('change',stale\)/);
  assert.match(runtime, /JSON\.stringify\(envelope\(last\)/);
  assert.match(runtime, /readAsText\(selected\)/);
  assert.doesNotMatch(runtime, /\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/);
  assert.doesNotMatch(runtime, /console\.(log|info|warn|error)/);
  const passwordRenderer = runtime.slice(runtime.indexOf('function renderPassword'), runtime.indexOf('function renderQuiz'));
  assert.doesNotMatch(passwordRenderer, /bindPortable|data-security-action|download\(|localStorage|report\(/);
});

test('registry and locale policy own exactly seven native Security counterparts', () => {
  const registry = read('assets/js/components/tool-registry.js');
  const policy = JSON.parse(read('data/registry/locale-coverage-policy.json'));
  for (const app of APPS) {
    const row = policy.overrides.find((entry) => entry.route === app.route);
    assert.ok(row, `missing policy row for ${app.route}`);
    assert.equal(row.state, 'native');
    assert.match(row.sourceOwner, /sw-security-parity\.js/);
  }
  const rows = registry.split(/\r?\n/).filter((line) => /lang:\s*["']sw["']/.test(line) && APPS.some((app) => new RegExp(`sourceId:\\s*["']${app.id}["']`).test(line)));
  assert.equal(rows.length, 7);
});

test('canonical, OG artwork, and English/French/Swahili hreflang are fully reciprocal', () => {
  for (const app of APPS) {
    const sw = read(app.file);
    assert.match(sw, new RegExp(`rel="canonical" href="https://afrotools.com${app.route}"`));
    assert.match(sw, new RegExp(`property="og:image" content="https://afrotools.com/assets/img/tools/${app.image}"`));
    for (const code of ['en', 'fr', 'sw', 'x-default']) assert.match(sw, new RegExp(`hreflang="${code}"`));
    assert.match(read(app.en), new RegExp(`hreflang="sw" href="https://afrotools.com${app.route}"`));
    assert.match(read(app.fr), new RegExp(`hreflang="sw" href="https://afrotools.com${app.route}"`));
  }
});

test('central acceptance and generated AI coverage include the approved security routes', () => {
  const acceptance = JSON.parse(read('data/audits/swahili-free-app-acceptance.json'));
  const aiMap = require('../assets/js/ai/swahili-route-map.generated');
  for (const app of APPS) {
    assert.equal(acceptance.entries.some((entry) => entry.englishId === app.id && entry.status === 'accepted'), true);
    assert.equal(aiMap.ids[app.id], app.route);
  }
});
