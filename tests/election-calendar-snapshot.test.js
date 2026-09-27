'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { renderSnapshot, renderLocalizedSnapshot, injectSnapshot, injectEditionStatus, escapeHtml } = require('../scripts/generate-election-calendar-snapshot');
const { localeCopy } = require('../assets/js/pages/election-edition.js');

const root = path.resolve(__dirname, '..');
const tracker = require('../data/government/africa-election-tracker.json');
const html = fs.readFileSync(path.join(root, 'tools/africa-election-tracker/index.html'), 'utf8');
const editions = [
  { locale: 'ha', html: fs.readFileSync(path.join(root, 'ha/zabe/index.html'), 'utf8'), start: '<!-- ELECTION_HA_SNAPSHOT_START -->', end: '<!-- ELECTION_HA_SNAPSHOT_END -->' },
  { locale: 'yo', html: fs.readFileSync(path.join(root, 'yo/idibo/index.html'), 'utf8'), start: '<!-- ELECTION_YO_SNAPSHOT_START -->', end: '<!-- ELECTION_YO_SNAPSHOT_END -->' }
];
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
  assert.ok(first.includes('data-snapshot-date="' + tracker.generatedAt + '"'));
  assert.match(first, /Upcoming as of \d{1,2} [A-Za-z]{3} \d{4}/);
  assert.match(first, /Earlier records/);
  assert.match(first, /South Sudan: President[\s\S]*?Date: Tentative/);
  const southSudan = first.match(/<article class="et-election-card" data-snapshot-election-id="ss-president-2026">([\s\S]*?)<\/article>/);
  assert.ok(southSudan);
  assert.match(southSudan[1], /<time datetime="2026-12" aria-label="Dec 2026; Tentative">/);
  assert.doesNotMatch(southSudan[1], /<time datetime="2026-12-22"/);
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
  coarseDate.generatedAt = '2026-09-26';
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
  const tentativeRecord = coarseDate.elections[4];
  tentativeRecord.electionDate = '2026-09-01';
  tentativeRecord.datePrecision = 'day';
  tentativeRecord.dateStatus = 'tentative';
  const coarseHtml = renderSnapshot(coarseDate);
  const earlierHeading = coarseHtml.indexOf('Earlier records');
  assert.ok(coarseHtml.indexOf('data-snapshot-election-id="' + monthRecord.id + '"') < earlierHeading);
  assert.ok(coarseHtml.indexOf('data-snapshot-election-id="' + yearRecord.id + '"') < earlierHeading);
  assert.ok(coarseHtml.indexOf('data-snapshot-election-id="' + projectedRecord.id + '"') < earlierHeading);
  assert.ok(coarseHtml.indexOf('data-snapshot-election-id="' + tentativeRecord.id + '"') < earlierHeading);
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

test('Hausa and Yoruba snapshots are dated, deterministic, and carry all ledger records and official links', () => {
  const officialSources = tracker.elections.flatMap((record) => record.sources.filter((source) => source.type === 'official'));
  for (const edition of editions) {
    const snapshot = renderLocalizedSnapshot(tracker, edition.locale);
    assert.equal(snapshot, renderLocalizedSnapshot(tracker, edition.locale));
    assert.equal(injectSnapshot(edition.html, snapshot, edition.start, edition.end), edition.html, edition.locale + ' snapshot drifted');
    assert.equal((snapshot.match(/data-ed-snapshot-election-id=/g) || []).length, tracker.elections.length);
    assert.equal((snapshot.match(/target="_blank"/g) || []).length, officialSources.length);
    assert.ok(snapshot.includes('data-ed-snapshot-date="' + tracker.generatedAt + '"'));
    assert.ok(snapshot.includes(localeCopy[edition.locale].ledgerDate));
    assert.ok(snapshot.includes(localeCopy[edition.locale].dateStatus.tentative));
    assert.ok(snapshot.includes(localeCopy[edition.locale].exactDayUnconfirmed));
    assert.doesNotMatch(snapshot, /guardian\.ng|premiumtimesng\.com|\b\d+ days(?: ago)?\b/);
    const sourceAnchorTexts = [...snapshot.matchAll(/<a href="[^"]+" rel="noopener noreferrer" target="_blank">([^<]+)<\/a>/g)].map((match) => match[1]);
    assert.equal(sourceAnchorTexts.length, officialSources.length);
    assert.ok(sourceAnchorTexts.every((label) => new RegExp('^' + localeCopy[edition.locale].officialLink + ' · [1-9][0-9]*$').test(label)));
    for (const source of officialSources) {
      assert.ok(snapshot.includes(escapeHtml(source.url)), edition.locale + ' missing official source: ' + source.label);
      assert.ok(snapshot.includes('datetime="' + source.checkedAt + '"'), edition.locale + ' missing checked date: ' + source.label);
      assert.ok(!snapshot.includes(escapeHtml(source.label)), edition.locale + ' displayed an untranslated source title: ' + source.label);
    }
    assert.match(edition.html, /data-ed-country disabled/);
    assert.match(edition.html, /data-ed-upcoming checked disabled/);
    assert.ok(edition.html.includes('<p class="ed-status" data-ed-status data-ed-snapshot-status role="status" aria-live="polite">' + localeCopy[edition.locale].ledgerDate + ': ' + tracker.generatedAt + '.</p>'));
    assert.equal(injectEditionStatus(edition.html, tracker, edition.locale), edition.html);
    assert.match(edition.html, /<noscript><p class="ed-noscript">/);
  }
});

test('localized snapshots use reviewed locale labels and do not present tentative exact days as confirmed', () => {
  for (const edition of editions) {
    const snapshot = renderLocalizedSnapshot(tracker, edition.locale);
    const copy = localeCopy[edition.locale];
    const southSudan = snapshot.match(/<article class="ed-entry" data-ed-snapshot-election-id="ss-president-2026">([\s\S]*?)<\/article>/);
    assert.ok(southSudan, edition.locale + ' South Sudan record is missing');
    assert.ok(southSudan[1].includes(copy.country.SS + ' · ' + copy.office.President));
    assert.ok(southSudan[1].includes(copy.region['East Africa']));
    assert.ok(southSudan[1].includes(copy.dateStatus.tentative));
    assert.ok(southSudan[1].includes(copy.exactDayUnconfirmed));
    assert.match(southSudan[1], /<time datetime="2026-12">2026-12<\/time>/);
    assert.doesNotMatch(southSudan[1], /<time datetime="2026-12-22">/);
  }
});

test('localized generator rejects unsafe source URLs and missing reviewed locale labels', () => {
  const unsafe = clone(tracker);
  unsafe.elections[0].sources.find((source) => source.type === 'official').url = 'javascript:alert(1)';
  assert.throws(() => renderLocalizedSnapshot(unsafe, 'ha'), /official source must use HTTPS/);

  const missingLabel = clone(tracker);
  missingLabel.elections[0].office = 'Unknown office';
  assert.throws(() => renderLocalizedSnapshot(missingLabel, 'yo'), /locale labels are missing/);
});

test('localized month, year and projected dates never claim an exact day', () => {
  const coarse = clone(tracker);
  const examples = [
    { record: coarse.elections[0], date: '2026-09-01', precision: 'month', status: 'tentative', datetime: '2026-09' },
    { record: coarse.elections[1], date: '2026-01-01', precision: 'year', status: 'tentative', datetime: '2026' },
    { record: coarse.elections[2], date: '2026-09-01', precision: 'day', status: 'projected', datetime: '2026-09' }
  ];
  for (const example of examples) {
    example.record.electionDate = example.date;
    example.record.datePrecision = example.precision;
    example.record.dateStatus = example.status;
  }
  for (const edition of editions) {
    const snapshot = renderLocalizedSnapshot(coarse, edition.locale);
    for (const example of examples) {
      const card = snapshot.match(new RegExp('<article class="ed-entry" data-ed-snapshot-election-id="' + example.record.id + '">([\\s\\S]*?)<\\/article>'));
      assert.ok(card, example.record.id + ' missing');
      assert.ok(card[1].includes('<time datetime="' + example.datetime + '">' + example.datetime + '</time>'));
      assert.ok(card[1].includes(localeCopy[edition.locale].exactDayUnconfirmed));
      assert.ok(!card[1].includes('<time datetime="' + example.date + '">' + example.date + '</time>'));
    }
  }
});
