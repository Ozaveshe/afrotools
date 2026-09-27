'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { assign, improveArticle } = require('../scripts/apply-blog-authorship');
const { addBacklink, linksIn } = require('../scripts/blog-link-pass');
const { buildReport } = require('../scripts/seo-priority-report');

test('existing team byline becomes a linked, disclosed pen-name byline', () => {
  const html = '<html lang="en"><head><meta name="author" content="AfroTools"><script type="application/ld+json">{"@type":"Article","author":{"@type":"Organization","name":"AfroTools Team"}}</script></head><body><div class="article-meta-hero"><span>By AfroTools Team</span></div><main><article class="article-body"><p>Guide.</p></article></main></body></html>';
  const { html: updated, person } = improveArticle(html, 'vehicle-import-checklist-africa');
  assert.equal(person.name, 'Amara Moyo');
  assert.match(updated, /<span>By <a href="\/authors\/amara-moyo\/">Amara Moyo<\/a><\/span>/);
  assert.match(updated, /Editorial pen name/);
  assert.match(updated, /"@type":"Person","name":"Amara Moyo","url":"https:\/\/afrotools.com\/authors\/amara-moyo\/"/);
  assert.equal(improveArticle(updated, 'vehicle-import-checklist-africa').html, updated);
  assert.equal(assign('kenya-paye-guide', html).name, 'David Mensah');
});

test('post-publish backlink requires a real outbound link and remains unique', () => {
  const older = { slug: 'old-guide', date: '2026-01-01', links: new Set(), html: '<article class="article-body"><section class="related-articles"><div class="related-grid"><a href="/blog/another-guide/">Other</a></div></section></article>' };
  const newer = { slug: 'new-guide', date: '2026-02-01', title: 'New guide', description: 'A useful next step.', links: new Set(['old-guide']) };
  const result = addBacklink(older, newer);
  assert.equal(result.changed, true);
  assert.match(result.html, /href="\/blog\/new-guide\/"/);
  assert.equal(linksIn(result.html).has('new-guide'), true);
  assert.equal(addBacklink({ ...older, html: result.html, links: linksIn(result.html) }, newer).changed, false);
  assert.throws(() => addBacklink(older, { ...newer, links: new Set() }), /does not link/);
});

test('refresh queue uses measured blog positions and impressions only', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-blog-refresh-'));
  try {
    const input = path.join(temp, 'csv');
    fs.mkdirSync(input);
    fs.writeFileSync(path.join(input, 'search-console.csv'), [
      'Page,Clicks,Impressions,Position',
      'https://afrotools.com/blog/target-guide/,10,500,14',
      'https://afrotools.com/blog/top-guide/,30,500,6',
      'https://afrotools.com/blog/low-sample/,0,20,12',
      'https://afrotools.com/tools/some-tool/,2,900,15'
    ].join('\n'));
    const report = buildReport({ inputDir: input, outputPath: path.join(temp, 'report.json'), limit: 25, fallbackTargetCtr: 0.03, recipeScan: false });
    assert.equal(report.summary.csvFiles, 1);
    assert.equal(report.summary.blogRefreshCandidates, 1);
    assert.equal(report.blogRefreshCandidates[0].url, 'https://afrotools.com/blog/target-guide/');
    assert.equal(report.blogRefreshCandidates[0].averagePosition, 14);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
