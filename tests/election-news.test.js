'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  validateModel, generateOutputs, renderFrontPage, replaceFrontPageBlock, escapeHtml, escapeXml
} = require('../scripts/generate-election-news');

const root = path.resolve(__dirname, '..');
const news = require('../data/government/election-news.json');
const tracker = require('../data/government/africa-election-tracker.json');
const official = require('../data/government/official-sources.json');
const clone = (value) => JSON.parse(JSON.stringify(value));

test('source-reviewed briefs generate stable article, archive, and RSS output', () => {
  const first = generateOutputs(news, tracker, official);
  const second = generateOutputs(news, tracker, official);
  const prefix = 'tools/africa-election-tracker/news/';
  const slug = news.articles[0].slug;

  assert.deepEqual([...first], [...second], 'output must not depend on build time');
  assert.deepEqual([...first.keys()].sort(), [
    prefix + 'feed.xml',
    prefix + 'index.html',
    prefix + slug + '/index.html'
  ].sort());
  assert.match(first.get(prefix + 'index.html'), /Election news, with receipts/);
  assert.match(first.get(prefix + 'index.html'), /rel="alternate" type="application\/rss\+xml"/);
  assert.match(first.get(prefix + 'index.html'), /afrotools-source-owner" content="scripts\/generate-election-news\.js"/);

  const article = first.get(prefix + slug + '/index.html');
  assert.match(article, /"@type":"NewsArticle"/);
  assert.match(article, /"@type":"BreadcrumbList"/);
  assert.doesNotMatch(article, /"@type":"WebApplication"/);
  assert.match(article, /assets\/js\/lazy-analytics\.js\?v=[0-9a-f]{8}/);
  assert.match(article, /datePublished":"2026-09-27"/);
  assert.match(article, /Published 22 September 2026; checked 27 September 2026/);
  assert.match(article, /not a final post-appeal roster/);
  assert.match(article, /cne\.cv\/sala_de_imprensa_/);

  const feed = first.get(prefix + 'feed.xml');
  assert.match(feed, /<rss version="2.0"/);
  assert.match(feed, /<dc:language>en<\/dc:language>/);
  assert.equal((feed.match(/<item>/g) || []).length, 1);
  assert.doesNotMatch(feed, /guardian\.ng|premiumtimesng\.com/);
  const itemUrl = feed.match(/<item>[\s\S]*?<link>([^<]+)<\/link>/)[1];
  assert.equal(itemUrl, 'https://afrotools.com/' + prefix + slug + '/');
  assert.ok(article.includes('"mainEntityOfPage":"' + itemUrl + '"'), 'feed item and NewsArticle URL must align');

  const trackerHtml = fs.readFileSync(path.join(root, 'tools/africa-election-tracker/index.html'), 'utf8');
  assert.match(trackerHtml, /rel="alternate" type="application\/rss\+xml"[^>]+africa-election-tracker\/news\/feed\.xml/);
  assert.match(trackerHtml, /href="\/tools\/africa-election-tracker\/news\/"/);

  for (const [relative, expected] of first) {
    assert.equal(fs.readFileSync(path.join(root, relative), 'utf8'), expected, relative + ' has drifted');
  }
});

test('publication requires a known election and dated official ledger source', () => {
  const unknownElection = clone(news);
  unknownElection.articles[0].electionId = 'unknown-election';
  assert.throws(() => validateModel(unknownElection, tracker, official), /unknown electionId/);

  const unknownAuthority = clone(news);
  unknownAuthority.articles[0].officialSources[0].officialSourceId = 'unlisted-source';
  assert.throws(() => validateModel(unknownAuthority, tracker, official), /not in the official-source ledger/);

  const wrongHost = clone(news);
  wrongHost.articles[0].officialSources[0].url = 'https://example.com/news';
  assert.throws(() => validateModel(wrongHost, tracker, official), /does not match its official ledger host/);

  const wrongCountry = clone(news);
  wrongCountry.articles[0].officialSources[0].officialSourceId = 'ng-inec-cvr';
  assert.throws(() => validateModel(wrongCountry, tracker, official), /source country does not match the election/);

  const undated = clone(news);
  delete undated.articles[0].officialSources[0].publishedOn;
  assert.throws(() => validateModel(undated, tracker, official), /publication date/);

  const prechecked = clone(news);
  prechecked.articles[0].localizations.en.reviewedOn = '2026-09-21';
  assert.throws(() => validateModel(prechecked, tracker, official), /review predates source check/);
});

test('localized desks require explicit reviewed content and never fall back to English', () => {
  const routeOnly = clone(news);
  routeOnly.localeRoutes.ha = '/ha/zabe/labarai/';
  const routeOnlyOutput = generateOutputs(routeOnly, tracker, official);
  assert.equal([...routeOnlyOutput.keys()].filter((file) => file.startsWith('ha/')).length, 0);

  const unsafeRoute = clone(news);
  unsafeRoute.localeRoutes.ha = '/tools/africa-election-tracker/';
  assert.throws(() => validateModel(unsafeRoute, tracker, official), /owned directory/);

  const untranslated = clone(news);
  untranslated.articles[0].localizations.ha = clone(untranslated.articles[0].localizations.en);
  assert.throws(() => validateModel(untranslated, tracker, official), /reviewed interface and feed translations/);

  const unreviewed = clone(news);
  unreviewed.articles[0].localizations.en.reviewStatus = 'draft';
  assert.throws(() => validateModel(unreviewed, tracker, official), /must be source-reviewed/);
});

test('RSS update date follows article revisions and XML control characters are rejected', () => {
  const revised = clone(news);
  revised.articles[0].localizations.en.updatedOn = '2026-09-29';
  assert.match(generateOutputs(revised, tracker, official).get('tools/africa-election-tracker/news/feed.xml'), /<lastBuildDate>Tue, 29 Sep 2026 00:00:00 GMT<\/lastBuildDate>/);

  const badXml = clone(news);
  badXml.articles[0].localizations.en.headline += '\u0001';
  assert.throws(() => validateModel(badXml, tracker, official), /headline is invalid/);
});

test('inbound RSS and media watch changes never become published briefs', () => {
  const noisyTracker = clone(tracker);
  noisyTracker.newsFeeds.push({
    id: 'unreviewed-media',
    label: 'Unreviewed headline',
    latestItem: { title: 'Unreviewed election claim', url: 'https://example.com/' }
  });
  assert.deepEqual(
    [...generateOutputs(news, noisyTracker, official)],
    [...generateOutputs(news, tracker, official)]
  );
});

test('front-page lead and dated calendar rail are generated from reviewed models', () => {
  const trackerHtml = fs.readFileSync(path.join(root, 'tools/africa-election-tracker/index.html'), 'utf8');
  const feature = renderFrontPage(news, tracker, official);
  const lead = news.articles[0];
  const source = lead.officialSources[0];
  assert.ok(feature.includes(escapeHtml(lead.localizations.en.headline)));
  assert.ok(feature.includes(escapeHtml(lead.localizations.en.summary)));
  assert.ok(feature.includes(source.url));
  assert.match(feature, /Published 22 September 2026; checked 27 September 2026/);
  assert.ok(feature.includes('datetime="' + tracker.generatedAt + '"'));
  assert.match(feature, /id="calendarRailList"/);
  assert.doesNotMatch(feature, /guardian\.ng|premiumtimesng\.com|polling|predictions/i);
  assert.equal(replaceFrontPageBlock(trackerHtml, feature), trackerHtml, 'front-page teaser must match the curated model');

  const revised = clone(news);
  revised.articles[0].localizations.en.headline = 'Cabo Verde court reports five admitted presidential candidacies; appeals remained available';
  const changedFeature = renderFrontPage(revised, tracker, official);
  assert.notEqual(changedFeature, feature, 'a source-reviewed headline change must alter the teaser');
  assert.notEqual(replaceFrontPageBlock(trackerHtml, changedFeature), trackerHtml, 'check mode must detect stale teaser copy');
  assert.throws(() => replaceFrontPageBlock('<main></main>', feature), /markers are missing/);
});

test('rendering helpers escape untrusted text', () => {
  assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
  assert.equal(escapeXml('<title>"&'), '&lt;title&gt;&quot;&amp;');
});
