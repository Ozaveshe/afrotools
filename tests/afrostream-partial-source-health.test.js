'use strict';

// Runs the maintained page's health functions, without loading its app or providers.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'tools/afrostream/index.html'), 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(source => source.includes('function buildSourceLanes('));
assert.ok(script, 'actual source-health owner must be present');
const wantedFunctions = new Set(['laneHealth', 'sourceHoursAgo', 'sourceDaysAgo', 'isBlockedRun',
  'isPartialRun', 'formatAge', 'summarizeSourceHealth', 'buildSourceLanes', 'renderSourceRail',
  'escapeHtml', 'escapeAttr']);
const wantedVariables = new Set(['SOURCE_LANES', 'SOURCE_STATUS_LABELS']);
const pieces = [];
for (const node of acorn.parse(script, { ecmaVersion: 'latest' }).body) {
  if (node.type === 'FunctionDeclaration' && wantedFunctions.has(node.id.name)) pieces.push(script.slice(node.start, node.end));
  if (node.type === 'VariableDeclaration') {
    for (const item of node.declarations) if (wantedVariables.has(item.id.name)) pieces.push('var ' + script.slice(item.start, item.end) + ';');
  }
}
const NOW = Date.UTC(2026, 9, 18, 9);
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : [NOW])); }
  static now() { return NOW; }
}
const plain = value => JSON.parse(JSON.stringify(value));
function owner(preview = false) {
  const rail = { className: '', innerHTML: '' }, creatorStatus = { textContent: '' };
  const context = { Date: TestDate, isStaticPreviewHost: () => preview, AFROSTREAM_LOADING: false,
    document: { getElementById: id => id === 'asSourceRail' ? rail : id === 'asCreatorStatus' ? creatorStatus : null } };
  vm.createContext(context);
  vm.runInContext(pieces.join('\n'), context);
  return { context, rail, creatorStatus };
}
function fixture() {
  const run = () => ({ status: 'ok', error_message: null, fetched_at: new Date(NOW).toISOString() });
  return {
    data: { creators: [{ id: 'creator' }], streams: { live: [{ id: 'live' }], upcoming: [{ id: 'upcoming' }] }, news: [{ id: 'news' }] },
    health: { automation: { sync: run(), livecheck: run(), news_monitor: run() }, snapshots: { age_days: 0 },
      creators: { published: 1 }, streams: { live_now: 1, last_24h: 2, latest_updated_age_hours: 0 },
      news: { total_published: 1, latest_age_hours: 0 }, sources: { stale_over_7d: 0, success_last_24h: 3 } }
  };
}
const runForLane = { streams: 'livecheck', rankings: 'sync', news: 'news_monitor', calendar: 'livecheck' };
const privateError = 'SYNTHETIC_PROVIDER_DETAIL https://example.invalid/private-feed?token=fixture <img onerror=fixture>';

for (const lane of Object.keys(runForLane)) test(lane + ': ok run with a source error is partial while useful output stays intact', () => {
  const { context } = owner(), { data, health } = fixture();
  health.automation[runForLane[lane]].error_message = privateError;
  const before = JSON.stringify({ data, health });
  const lanes = context.buildSourceLanes(data, health, null);
  assert.equal(lanes[lane].status, 'partial');
  assert.match(lanes[lane].detail, /1 .*shown/);
  assert.match(lanes[lane].detail, /Some .*sources could not be checked/);
  assert.equal(JSON.stringify({ data, health }), before, 'health presentation cannot remove or rewrite output');
  assert.ok(!JSON.stringify(lanes).includes(privateError));
  assert.doesNotMatch(lanes[lane].detail, /SYNTHETIC_PROVIDER_DETAIL|example\.invalid|token=|onerror|failed source run/);
});

test('all-success states remain live, including null/absent/whitespace diagnostics', () => {
  for (const value of [null, undefined, '', ' \t\n']) {
    const { context } = owner(), { data, health } = fixture();
    Object.values(health.automation).forEach(run => { run.error_message = value; });
    const lanes = context.buildSourceLanes(data, health, null);
    assert.deepEqual(Object.values(lanes).map(lane => lane.status), ['live', 'live', 'live', 'live']);
    assert.equal(context.summarizeSourceHealth(lanes).title, 'Live data');
  }
});

for (const lane of Object.keys(runForLane)) test(lane + ': failed run keeps blocked precedence over partial errors', () => {
  for (const status of ['failed', 'error', 'blocked', 'timeout']) {
    const { context } = owner(), { data, health } = fixture();
    Object.assign(health.automation[runForLane[lane]], { status, error_message: privateError });
    const lanes = context.buildSourceLanes(data, health, null);
    assert.equal(lanes[lane].status, 'blocked');
    assert.equal(context.summarizeSourceHealth(lanes).state, 'blocked');
  }
});

for (const lane of Object.keys(runForLane)) test(lane + ': stale evidence keeps precedence over partial errors', () => {
  const { context } = owner(), { data, health } = fixture();
  health.automation[runForLane[lane]].error_message = privateError;
  if (lane === 'streams') health.streams.latest_updated_age_hours = 4;
  if (lane === 'calendar') health.streams.latest_updated_age_hours = 25;
  if (lane === 'rankings') health.snapshots.age_days = 3;
  if (lane === 'news') health.news.latest_age_hours = 169;
  const lanes = context.buildSourceLanes(data, health, null);
  assert.equal(lanes[lane].status, 'stale');
  assert.equal(context.summarizeSourceHealth(lanes).state, 'stale');
});

test('health unavailable never upgrades loaded data to partial or live', () => {
  for (const missing of [null, undefined]) {
    const { context } = owner(), { data } = fixture();
    const lanes = context.buildSourceLanes(data, missing, new Error('synthetic unavailable'));
    assert.deepEqual(Object.values(lanes).map(lane => lane.status), ['unavailable', 'unavailable', 'unavailable', 'unavailable']);
  }
});

test('a partial source does not make unloaded data available', () => {
  const { context } = owner(), { health } = fixture();
  Object.values(health.automation).forEach(run => { run.error_message = privateError; });
  const lanes = context.buildSourceLanes({}, health, null);
  assert.deepEqual(Object.values(lanes).map(lane => lane.status), ['unavailable', 'unavailable', 'unavailable', 'unavailable']);
});

test('archived creator fallback remains stale despite a recent partial sync', () => {
  const { context } = owner(), { data, health } = fixture();
  data.creators[0]._raw = { source_state: 'fallback', source_snapshot_label: 'synthetic archive' };
  health.automation.sync.error_message = privateError;
  const lane = context.buildSourceLanes(data, health, null).rankings;
  assert.equal(lane.status, 'stale');
  assert.match(lane.detail, /archived sample creators/);
});

test('disagreeing stream counts remain stale while a separately fresh calendar can be partial', () => {
  const { context } = owner(), { data, health } = fixture();
  health.automation.livecheck.error_message = privateError;
  health.streams.live_now = 2;
  const lanes = context.buildSourceLanes(data, health, null);
  assert.equal(lanes.streams.status, 'stale');
  assert.match(lanes.streams.detail, /marked 2/);
  assert.equal(lanes.calendar.status, 'partial');
});

test('empty loaded lists stay visible as zero output and partial coverage, not an invented total outage', () => {
  const { context } = owner(), { data, health } = fixture();
  data.streams = { live: [], upcoming: [] }; data.news = []; health.streams.live_now = 0;
  health.automation.livecheck.error_message = privateError; health.automation.news_monitor.error_message = privateError;
  const lanes = context.buildSourceLanes(data, health, null);
  for (const lane of ['streams', 'calendar', 'news']) { assert.equal(lanes[lane].status, 'partial'); assert.match(lanes[lane].detail, /^0 .*shown/); }
});

test('preview remains preview and does not claim provider coverage', () => {
  const { context } = owner(true), { data, health } = fixture();
  Object.values(health.automation).forEach(run => { run.error_message = privateError; });
  assert.deepEqual(Object.values(context.buildSourceLanes(data, health, null)).map(lane => lane.status), ['preview', 'preview', 'preview', 'preview']);
});

test('partial coverage has readable lane and summary text in the existing live region', () => {
  const { context, rail } = owner(), { data, health } = fixture();
  health.automation.livecheck.error_message = privateError; health.automation.news_monitor.error_message = privateError;
  const lanes = context.buildSourceLanes(data, health, null), summary = context.summarizeSourceHealth(lanes);
  assert.equal(summary.state, 'partial');
  assert.match(summary.title, /Some sources could not be checked/);
  assert.match(summary.detail, /Available listings are still shown/);
  context.renderSourceRail('live', { lanes });
  assert.match(rail.innerHTML, /<em>Partial coverage<\/em>/);
  assert.match(rail.innerHTML, /data-source-status="partial"/);
  assert.ok(!rail.innerHTML.includes(privateError));
  assert.match(html, /id="asSourceRail" role="status" aria-live="polite"/);
  assert.match(html, /\.as-source-rail\.partial \.as-source-dot/);
  assert.match(html, /\.as-source-pill\.partial::before/);
});

test('the maintained HTML remains the deployment template owner, rather than a hand-patched generated bundle', () => {
  const builder = fs.readFileSync(path.join(ROOT, 'scripts/build-afrostream-templates.js'), 'utf8');
  const scripts = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts;
  assert.match(builder, /\['article\.html', 'news\.html', 'index\.html'\]/);
  assert.match(builder, /fs\.readFileSync\(path\.join\(root, 'tools\/afrostream', file\), 'utf8'\)/);
  assert.match(builder, /netlify\/functions\/_shared\/afrostream-templates\.json/);
  assert.match(scripts['build:deploy'], /node scripts\/build-afrostream-templates\.js/);
});
