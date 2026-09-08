'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const studio = require('../assets/js/lib/seo-studio-projects.js');
const period = (start, end) => ({ start, end, filters: 'Web; all countries; all devices' });
const previous = period('2026-07-01', '2026-07-28');
const current = period('2026-08-01', '2026-08-28');
const csv = 'Top pages,Clicks,Impressions,CTR,Position\r\nhttps://example.com/,10,100,10%,8\r\nhttps://example.com/new,0,20,0%,12';
function fixture() { return studio.createProject(studio.emptyState(), 'Example', 'https://example.com/path'); }
function report(status = 'fail', method = '2') {
  return { url: 'https://example.com/', fetchedAt: '2026-09-08T12:00:00.000Z', methodologyVersion: method, score: status === 'fail' ? 60 : 90, grade: 'B', page: { title: 'Example' }, categories: [{ id: 'metadata', label: 'Metadata', checks: [{ id: status === 'fail' ? 'title-missing' : 'title-ok', label: 'Page title', status, detail: 'Observed title', fix: 'Add a title' }] }] };
}
test('AC-1 / EC-1 origins are unique and project changes are immutable', () => {
  const state = fixture();
  assert.equal(state.projects[0].origin, 'https://example.com');
  assert.throws(() => studio.createProject(state, 'Duplicate', 'https://example.com/other'), /already/i);
  for (const url of ['javascript:alert(1)', 'https://user:pass@example.com/', 'https://localhost/']) assert.throws(() => studio.createProject(state, 'Bad', url));
  assert.equal(studio.deleteProject(state, state.selectedId).projects.length, 0);
  assert.equal(state.projects.length, 1);
});
test('AC-2 / EC-4 manual completion is separate from observed resolution and recurrence', () => {
  let state = fixture();
  state = studio.addAudit(state, report());
  const key = studio.fixQueue(state.projects[0])[0].key;
  state = studio.setFixStatus(state, key, 'done');
  assert.equal(studio.fixQueue(state.projects[0])[0].verifiedAt, null);
  state = studio.addAudit(state, report());
  assert.equal(studio.fixQueue(state.projects[0])[0].status, 'open', 'failed recheck reopens manually completed work');
  state = studio.setFixStatus(state, key, 'done');
  state = studio.addAudit(state, report('pass'));
  assert.ok(studio.fixQueue(state.projects[0])[0].verifiedAt);
  state = studio.addAudit(state, report());
  assert.equal(studio.fixQueue(state.projects[0])[0].status, 'open');
  assert.equal(studio.fixQueue(state.projects[0])[0].verifiedAt, null);
  assert.throws(() => studio.addAudit(state, { ...report(), categories: [] }), /incomplete/i);
  assert.throws(() => studio.addAudit(state, { ...report(), url: 'https://other.example/' }), /project/i);
  assert.equal(studio.scoreDelta([report(), report('pass', '3')]), null);
});
test('AC-3 / EC-2 / EC-3 CSV metrics are recomputed and absence remains unknown', () => {
  const now = studio.parseSearchCsv(csv, current, 'https://example.com');
  const before = studio.parseSearchCsv(csv.replace(',10,100,10%,8', ',0,50,0%,10').replace('/new,0,20,0%,12', '/old,2,20,10%,14'), previous, 'https://example.com');
  const result = studio.compareSearch(before, now);
  const home = result.rows.find(r => r.key === 'https://example.com/');
  assert.equal(home.clickDelta, 10);
  assert.equal(home.ctrDelta, 0.1);
  assert.equal(home.positionDelta, -2);
  assert.equal(result.rows.find(r => r.key.endsWith('/new')).status, 'new-in-export');
  assert.equal(result.rows.find(r => r.key.endsWith('/old')).clickDelta, null);
  assert.equal(now.summary.ctr, 10 / 120);
  const quoted = studio.parseSearchCsv('\uFEFFTop queries,Clicks,Impressions,CTR,Position\r\n"best, \"\"local\"\"\nshop",1,10,10%,4', current);
  assert.equal(quoted.rows[0].key, 'best, "local"\nshop');
});
test('AC-3 / NFR-1 malformed or ambiguous imports never yield fabricated results', () => {
  for (const text of [csv + '\nhttps://example.com/,1,10,10%,5', csv.replace(',10,100,', ',-1,100,'), csv.replace(',10,100,', ',101,100,'), csv.replace(',10,100,', ',oops,100,'), csv.replace('Clicks', 'Other'), csv + '\n"unclosed', 'x'.repeat(2097153)]) assert.throws(() => studio.parseSearchCsv(text, current, 'https://example.com'));
  assert.throws(() => studio.parseSearchCsv(csv, current, 'https://wrong.example'), /origin/i);
  assert.throws(() => studio.parseSearchCsv(csv, period('2026-02-30', '2026-03-29')), /date/i);
  const a = studio.parseSearchCsv(csv, current);
  assert.throws(() => studio.compareSearch(a, a), /overlap/i);
  const b = studio.parseSearchCsv(csv.replace('Top pages', 'Top queries'), previous);
  assert.throws(() => studio.compareSearch(b, a), /dimension/i);
});
test('AC-4 / EC-5 / EC-6 backup validation and reports defend data and render text safely', () => {
  let state = fixture();
  state = studio.addAudit(state, report());
  const restored = studio.restoreBackup(JSON.stringify(state));
  assert.deepEqual(restored, state);
  assert.throws(() => studio.restoreBackup('{'), /backup/i);
  assert.throws(() => studio.restoreBackup(JSON.stringify({ ...state, version: 999 })), /version/i);
  assert.throws(() => studio.restoreBackup(JSON.stringify({ ...state, projects: [{ ...state.projects[0], origin: 'javascript:alert(1)' }] })));
  const text = studio.renderProjectReport({ ...state.projects[0], name: '<script>alert(1)</script>' });
  assert.ok(!text.includes('<script>'));
  assert.ok(text.includes('&lt;script&gt;'));
  assert.throws(() => studio.persist({ setItem() { throw Error('Quota'); } }, state), /backup|storage/i);
  assert.throws(() => studio.load({ getItem() { return '{'; } }), /backup|saved/i);
});
test('NFR-1 / NFR-2 bounded histories, projects and CSV row limits are enforced', () => {
  let state = fixture();
  for (let i = 0; i < 8; i++) state = studio.addAudit(state, report());
  assert.equal(state.projects[0].audits.length, 5);
  for (let i = 1; i < 5; i++) state = studio.createProject(state, 'Project ' + i, 'https://site' + i + '.example/');
  assert.throws(() => studio.createProject(state, 'Sixth', 'https://sixth.example/'), /five projects/i);
  const many = 'Top queries,Clicks,Impressions,Position\n' + Array.from({ length: 10001 }, (_, i) => 'query' + i + ',1,10,5').join('\n');
  assert.throws(() => studio.parseSearchCsv(many, current), /10,000/i);
  assert.throws(() => studio.restoreBackup(' '.repeat(4194305)), /4 MB/i);
  const a = studio.parseSearchCsv(csv, previous);
  const b = studio.parseSearchCsv(csv, period('2026-08-01', '2026-08-27'));
  assert.throws(() => studio.compareSearch(a, b), /equal-length/i);
  assert.equal(studio.parseSearchCsv('Top queries;Clicks;Impressions;Position\nquery;1;10;4', current).rows[0].clicks, 1);
});
