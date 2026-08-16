'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const engine = require('../assets/js/engines/sw-personal-finance');
const manifest = require('../data/localization/sw-personal-finance-parity-manifest.json');
const ledger = require('../data/audits/swahili-free-app-acceptance.json');
const inventory = require('../reports/swahili-free-app-parity-inventory.json');

const APPS = [
  { id: '50-30-20-budget', route: '/sw/zana/bajeti-50-30-20/', file: 'sw/zana/bajeti-50-30-20/index.html', frRoute: '/fr/tools/budget-50-30-20/', frFile: 'fr/tools/budget-50-30-20/index.html', hash: '3f6adb5573a531a9f95dd700eb5179df937b07a5f89f5dc096746000a32a2e07', fields: ['country','income','currentNeeds','currentWants','currentSavings'], countries: ['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','CI','CM','SN','MA','TN','AO'] },
  { id: 'album-budget', route: '/sw/zana/bajeti-ya-albamu/', file: 'sw/zana/bajeti-ya-albamu/index.html', frRoute: '/fr/tools/budget-album-ep/', frFile: 'fr/tools/budget-album-ep/index.html', hash: '51496064067d955fa69f3c39546215b3b6ba5dd69f4385fb5a1babb9b0e24165', fields: ['country','projectType','tracks','studioRate','hoursPerTrack','beatCost','mixCost','masterCost','coverArt','photoShoot','musicVideo','distroCost','playlistBudget','adsBudget','prBudget','netPerStream'], countries: ['NG','KE','ZA','GH','EG','TZ','RW','CI','CM','SN','MA'] },
  { id: 'film-budget', route: '/sw/zana/bajeti-ya-filamu/', file: 'sw/zana/bajeti-ya-filamu/index.html', frRoute: '/fr/tools/budget-film/', frFile: 'fr/tools/budget-film/index.html', hash: 'a18dec00674bdf13113390c0ad7e54fc80e110295105583019e126f9a0c0a2ef', fields: ['country','prodType','totalBudget','shootDays','cashSecured','contingencyPct','aboveLinePct','productionPct','postPct','marketingPct'], countries: ['NG','KE','ZA','GH','EG'] },
  { id: 'security-emergency-fund', route: '/sw/zana/mfuko-wa-dharura-wa-usalama/', file: 'sw/zana/mfuko-wa-dharura-wa-usalama/index.html', frRoute: '/fr/tools/fonds-d-urgence-et-de-securite/', frFile: 'fr/tools/fonds-d-urgence-et-de-securite/index.html', hash: '7a12dc921fb947b0c27d2d6d182f842b453a44b7283847c11216af0015ca9da7', fields: ['country','monthlyExpenses','targetMonths','oneOffCosts','currentSavings','monthlyContribution'], countries: ['NG','KE','ZA','GH','ET','TZ','UG','EG','MA','CI','SN','CM','ZM','ZW'] },
  { id: 'side-hustle-ranker', route: '/sw/zana/orodha-ya-side-hustle/', file: 'sw/zana/orodha-ya-side-hustle/index.html', frRoute: '/fr/tools/classement-d-activites-complementaires/', frFile: 'fr/tools/classement-d-activites-complementaires/index.html', hash: 'a75abb8d4276632e138fabbf0f20b7aeebda01fe65826b17fee7bfc0b67b8109', fields: ['hours','capital','skills'], countries: [] }
];

function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function inlineHash(file) {
  const scripts = [...read(file).matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc=|application\/(?:ld\+json|json)/i.test(match[1]))
    .map((match) => match[2].trim()).filter(Boolean).join('\n');
  return crypto.createHash('sha256').update(scripts).digest('hex');
}
function schemas(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}
function selectValues(html, name) {
  const select = [...html.matchAll(/<select\b[^>]*>[\s\S]*?<\/select>/gi)].map((match) => match[0])
    .find((value) => new RegExp(`\\b(?:name|id)=["']${name}["']`).test(value));
  return select ? [...select.matchAll(/<option\s+value=["']([^"']+)["']/gi)].map((match) => match[1]) : [];
}
function visibleText(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

test('historical manifest reconciles all five rows to coordinator acceptance', () => {
  assert.equal(manifest.coordinatorBase, '8354e321ff34caf60a33a3393cd0dcddfb00c023');
  const currentInventoryIds = new Set(inventory.rows.map((row) => row.englishId));
  const accepted = ledger.entries.filter((entry) => entry.status === 'accepted' && currentInventoryIds.has(entry.englishId));
  assert.equal(accepted.length, inventory.totals.accepted);
  assert.equal(ledger.entries.filter((entry) => entry.status !== 'accepted').length, 0);
  assert.deepEqual(manifest.noOverlap, { acceptedEnglishIds: [], count: 0 });
  const ids = manifest.entries.map((entry) => entry.englishId);
  assert.deepEqual(ids, APPS.map((app) => app.id));
  assert.deepEqual(ids.filter((id) => accepted.some((entry) => entry.englishId === id)), ids);
  assert.deepEqual(inventory.rows.filter((row) => row.categoryKey === 'personal-finance').map((row) => row.englishId), ids);
});

test('generator owns exactly the five source pages and stays fresh', () => {
  const check = spawnSync(process.execPath, ['scripts/build-sw-personal-finance-parity.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr || check.stdout);
  assert.match(check.stdout, /verified: 5/);
});

test('the English product formula contracts remain frozen', () => {
  for (const app of APPS) assert.equal(inlineHash(`tools/${app.id}/index.html`), app.hash, app.id);
});

test('every country selector exactly matches its English owner option set and order', () => {
  for (const app of APPS) {
    const englishValues = selectValues(read(`tools/${app.id}/index.html`), 'country');
    const swahiliValues = selectValues(read(app.file), 'country');
    assert.deepEqual(englishValues, app.countries, `${app.id}: English owner changed`);
    assert.deepEqual(swahiliValues, englishValues, `${app.id}: Swahili country parity`);
  }
});

test('visible copy is native Kiswahili and source limitations fail closed', () => {
  const forbidden = /\b(?:formula|conversion|recording|mixing|mastering|visuals|distribution|promotion|break-even|streams?|release|tracks?|shooting|allocations?|contingency|side hustle|shortlist|skills?|scoring|input fit|live demand|platform promises|exports?|buttons?|freshness|confidence|amounts?|selections?|network function|fields?|workflow|theme|system|light|dark|print|backup)\b/i;
  for (const app of APPS) assert.doesNotMatch(visibleText(read(app.file)), forbidden, `${app.id}: visible English residue`);
  const runtime = read('assets/js/pages/sw-personal-finance.js');
  for (const phrase of ['Above the line','Physical production','Post-production','Marketing na delivery','Side hustle ya kwanza','input fit','siku ya shooting','currency conversion']) {
    assert.doesNotMatch(runtime, new RegExp(phrase, 'i'), `runtime residue: ${phrase}`);
  }
  const hustleCopy = engine.HUSTLES.map((item) => `${item.name} ${item.check}`).join(' ');
  assert.doesNotMatch(hustleCopy, /\b(?:freelance|content|branding|portfolio|brief|ride-hailing|catering|delivery|freight|returns?|last-mile|editing|storage|deposit|commission|allergy|web|app|acceptance|maintenance|pilot|scope|fashion|remake|working capital|electronics|parts|warranty)\b/i);
  assert.match(read('sw/zana/orodha-ya-side-hustle/index.html'), /chanzo cha ndani kinachojirejelea, si uthibitisho huru/i);
  assert.match(read('sw/zana/bajeti-ya-filamu/index.html'), /uhalali wa chanzo kuwa haujathibitishwa/i);
});

test('50/30/20 formula returns exact targets and fails closed', () => {
  assert.deepEqual(engine.budget503020({ income: 600000, currentNeeds: 350000, currentWants: 120000, currentSavings: 80000 }), {
    ok: true, income: 600000, idealNeeds: 300000, idealWants: 180000, idealSavings: 120000,
    currentNeeds: 350000, currentWants: 120000, currentSavings: 80000, currentTotal: 550000,
    needsGap: 50000, wantsGap: -60000, savingsGap: -40000, unallocated: 50000
  });
  assert.equal(engine.budget503020({ income: 0, currentNeeds: 0, currentWants: 0, currentSavings: 0 }).field, 'income');
});

test('album formula preserves every English production, visual, marketing and stream output', () => {
  const result = engine.albumBudget({ tracks: 5, studioRate: 10000, hoursPerTrack: 4, beatCost: 50000, mixCost: 15000, masterCost: 30000, coverArt: 20000, photoShoot: 30000, musicVideo: 150000, distroCost: 10000, playlistBudget: 20000, adsBudget: 50000, prBudget: 30000, netPerStream: 1 });
  assert.deepEqual(result, { ok: true, tracks: 5, recordingCost: 200000, mixingCost: 75000, production: 355000, visuals: 200000, marketing: 110000, total: 665000, costPerTrack: 133000, contingency10: 66500, contingency20: 133000, breakEvenStreams: 665000 });
  assert.equal(engine.albumBudget({ tracks: 0 }).field, 'studioRate');
  assert.equal(engine.albumBudget({ tracks: 0, studioRate: 0, hoursPerTrack: 4, beatCost: 0, mixCost: 0, masterCost: 0, coverArt: 0, photoShoot: 0, musicVideo: 0, distroCost: 0, playlistBudget: 0, adsBudget: 0, prBudget: 0, netPerStream: 0 }).field, 'tracks');
});

test('film formula enforces the 100% allocation boundary and exact gap', () => {
  const input = { totalBudget: 10000000, shootDays: 20, cashSecured: 6000000, contingencyPct: 10, aboveLinePct: 20, productionPct: 50, postPct: 20, marketingPct: 10 };
  assert.deepEqual(engine.filmBudget(input), { ok: true, total: 10000000, shootDays: 20, perDay: 500000, aboveLine: 2000000, production: 5000000, post: 2000000, marketing: 1000000, allocations: [20,50,20,10], allocationTotal: 100, contingency: 1000000, required: 11000000, cashSecured: 6000000, gap: 5000000, surplus: 0 });
  assert.equal(engine.filmBudget({ ...input, marketingPct: 0 }).field, 'aboveLinePct');
});

test('emergency formula returns exact tiers and ceiling timeline', () => {
  assert.deepEqual(engine.emergencyFund({ monthlyExpenses: 250000, targetMonths: 3, oneOffCosts: 100000, currentSavings: 200000, monthlyContribution: 50000 }), { ok: true, target: 850000, tier1: 350000, tier2: 850000, tier3: 1600000, gap: 650000, monthsToGoal: 13 });
  assert.equal(engine.emergencyFund({ monthlyExpenses: 0, targetMonths: 3, oneOffCosts: 0, currentSavings: 0, monthlyContribution: 0 }).field, 'monthlyExpenses');
});

test('side-hustle ranker preserves the 60/20/20 score and deterministic tie order', () => {
  const result = engine.rankSideHustles({ skills: ['writing'], hours: 10, capital: 1 });
  assert.equal(result.ok, true);
  assert.deepEqual(result.top5.map((item) => item.hustle.id), ['freelance_writing','social_media_mgmt','financial_consulting','graphics_design','beauty_hair']);
  assert.deepEqual(result.top5.map((item) => item.fit.score), [100,100,40,40,40]);
  assert.equal(engine.rankSideHustles({ skills: [], hours: 0, capital: 0 }).field, 'hours');
});

test('every page has the complete app-specific field matrix, exports, privacy and reciprocal SEO', () => {
  const registry = read('assets/js/components/tool-registry.js');
  for (const app of APPS) {
    const html = read(app.file);
    const english = read(`tools/${app.id}/index.html`);
    const french = read(app.frFile);
    assert.match(html, /<html\b[^>]*\blang="sw"[^>]*>/);
    assert.match(html, new RegExp(`data-app="${app.id}"`));
    for (const field of app.fields) assert.match(html, new RegExp(`name="${field}"`), `${app.id}:${field}`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools.com${app.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, new RegExp(`hreflang="en" href="https://afrotools.com/tools/${app.id}/"`));
    assert.match(html, new RegExp(`hreflang="fr" href="https://afrotools.com${app.frRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(english, new RegExp(`hreflang="sw" href="https://afrotools.com${app.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(french, new RegExp(`hreflang="sw" href="https://afrotools.com${app.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, new RegExp(`/assets/img/tools/${app.id}\\.webp`));
    assert(fs.existsSync(path.join(ROOT, `assets/img/tools/${app.id}.webp`)), `${app.id} artwork`);
    assert.match(html, /data-action="txt"/);
    assert.match(html, /data-action="json"/);
    assert.match(html, /data-action="print"/);
    assert.match(html, /data-action="import">Fungua JSON<\/button>/);
    assert.match(html, /data-import tabindex="-1" aria-label="Fungua nakala rudufu ya JSON"/);
    assert.match(html, /data-shared-ai-handoff/);
    assert.match(html, /href="\/sw\/ai\/"/);
    assert.match(html, /Hakuna kiwango cha sasa au bei ya mtoa huduma inayodaiwa/);
    assert.match(html, /Hazitumwi|hazitumwi/);
    assert.doesNotMatch(html, /<iframe|generated.*bridge|fetch\s*\(|XMLHttpRequest|sendBeacon|candidate|acceptance ledger|AI map|English owner/i);
    const jsonLd = schemas(html);
    assert(jsonLd.some((item) => item['@type'] === 'SoftwareApplication' && item.inLanguage === 'sw' && item.isBasedOn.endsWith(`/tools/${app.id}/`)));
    assert(new RegExp(`sourceId: ["']${app.id}["']`).test(registry), `${app.id} registry sourceId`);
    assert(new RegExp(`href: ["']${app.route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(registry), `${app.id} registry route`);
  }
});
