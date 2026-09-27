'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { renderSnapshot, injectSnapshot, escapeHtml } = require('../scripts/generate-election-calendar-snapshot');

const root = path.resolve(__dirname, '..');
const tracker = require('../data/government/africa-election-tracker.json');
const html = fs.readFileSync(path.join(root, 'tools/africa-election-tracker/index.html'), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));

test('published HTML snapshot matches every ledger record and is deterministic', () => {
  const first = renderSnapshot(tracker);
  assert.equal(first, renderSnapshot(tracker));
  assert.equal(injectSnapshot(html, first), html, 'committed calendar snapshot has drifted');
  assert.equal((first.match(/data-snapshot-election-id=/g) || []).length, tracker.elections.length);
  const officialSourceCount = tracker.elections.reduce((count, record) =>
    count + record.sources.filter((source) => source.type === 'official').length, 0);
  assert.equal((first.match(/class="et-source-link"/g) || []).length, officialSourceCount);
  for (const source of tracker.elections.flatMap((record) => record.sources.filter((entry) => entry.type === 'official'))) {
    assert.ok(first.includes(escapeHtml(source.url)), 'missing official source: ' + source.label);
  }
  assert.match(first, /data-snapshot-date="2026-09-26"/);
  assert.match(first, /Upcoming as of 26 Sep 2026/);
  assert.match(first, /Earlier records/);
  assert.match(first, /South Sudan: President[\s\S]*?Date: Tentative/);
  assert.doesNotMatch(first, /\b\d+ days(?: ago)?\b/);
  assert.doesNotMatch(first, /guardian\.ng|premiumtimesng\.com/);
  assert.match(html, /<noscript><p class="et-snapshot-note">Filters require JavaScript/);
});

test('snapshot leads with dates upcoming on the ledger date, then earlier records', () => {
  const ids = [...renderSnapshot(tracker).matchAll(/data-snapshot-election-id="([^"]+)"/g)].map((match) => match[1]);
  const byDate = [...tracker.elections].sort((a, b) => a.electionDate.localeCompare(b.electionDate) || a.country.localeCompare(b.country));
  const upcoming = byDate.filter((record) => (record.dateEnd || record.electionDate) >= tracker.generatedAt);
  const earlier = byDate.filter((record) => (record.dateEnd || record.electionDate) < tracker.generatedAt).reverse();
  assert.deepEqual(ids, [...upcoming, ...earlier].map((record) => record.id));

  const coarseDate = clone(tracker);
  const monthRecord = coarseDate.elections[0];
  monthRecord.electionDate = '2026-09-01';
  monthRecord.datePrecision = 'month';
  monthRecord.dateStatus = 'tentative';
  const yearRecord = coarseDate.elections[1];
  yearRecord.electionDate = '2026-01-01';
  yearRecord.datePrecision = 'year';
  yearRecord.dateStatus = 'tentative';
  const projectedRecord = coarseDate.elections[2];
  projectedRecord.electionDate = '2026-09-01';
  projectedRecord.datePrecision = 'day';
  projectedRecord.dateStatus = 'projected';
  const coarseHtml = renderSnapshot(coarseDate);
  const earlierHeading = coarseHtml.indexOf('Earlier records');
  assert.ok(coarseHtml.indexOf('data-snapshot-election-id="' + monthRecord.id + '"') < earlierHeading);
  assert.ok(coarseHtml.indexOf('data-snapshot-election-id="' + yearRecord.id + '"') < earlierHeading);
  assert.ok(coarseHtml.indexOf('data-snapshot-election-id="' + projectedRecord.id + '"') < earlierHeading);
});

test('static fallback remains on fetch failure and controls wait for valid live data', () => {
  assert.match(html, /id="searchInput"[^>]+disabled/);
  assert.match(html, /id="regionFilter"[^>]+disabled/);
  assert.match(html, /id="typeFilter"[^>]+disabled/);
  assert.match(html, /id="sourceFilter"[^>]+disabled/);
  assert.match(html, /id="resetFilters"[^>]+disabled/);
  assert.match(html, /\[els\.searchInput, els\.regionFilter, els\.typeFilter, els\.sourceFilter, els\.executiveOnly, els\.upcomingOnly, els\.resetFilters\]/);
  assert.match(html, /Published calendar snapshot below; live filters unavailable/);
  assert.match(html, /els\.electionList\.innerHTML = snapshotHtml/);
  assert.match(html, /dateStatus === 'tentative' \|\| record\.dateStatus === 'projected'\) return 'date not confirmed'/);
});

test('snapshot escapes text and rejects unsafe official source URLs', () => {
  assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
  const hostile = clone(tracker);
  hostile.elections[0].country = '<script>alert(1)</script>';
  assert.doesNotMatch(renderSnapshot(hostile), /<script>alert\(1\)<\/script>/);

  const unsafe = clone(tracker);
  unsafe.elections[0].sources.find((source) => source.type === 'official').url = 'javascript:alert(1)';
  assert.throws(() => renderSnapshot(unsafe), /official source must use HTTPS/);
});

test('snapshot injection refuses missing or duplicate markers', () => {
  const snapshot = renderSnapshot(tracker);
  assert.throws(() => injectSnapshot('<div></div>', snapshot), /markers are missing/);
  assert.throws(() => injectSnapshot(html + '\n' + '<!-- ELECTION_CALENDAR_SNAPSHOT_START -->', snapshot), /markers must be unique/);
});
