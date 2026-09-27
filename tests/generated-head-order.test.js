'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pageShell } = require('../scripts/apply-blog-authorship');
const { generateOutputs } = require('../scripts/generate-election-news');
const { replaceHeadLinks } = require('../scripts/lib/route-contract');

test('author generator leaves social and route metadata stable for later build passes', () => {
  const route = '/authors/example/';
  const html = pageShell('Example', 'Synthetic author', route, '<h1>Example</h1>', { '@type': 'Person', name: 'Example' });
  assert.ok(html.includes('<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">'));
  assert.equal(replaceHeadLinks(html, route, { en: route, 'x-default': route }), html);
});

test('postbuild election generator does not undo route metadata normalization', () => {
  const outputs = generateOutputs(require('../data/government/election-news.json'), require('../data/government/africa-election-tracker.json'), require('../data/government/official-sources.json'));
  for (const [file, html] of outputs) {
    if (!file.endsWith('/index.html')) continue;
    const route = '/' + file.slice(0, -'index.html'.length);
    assert.equal(replaceHeadLinks(html, route, { en: route, 'x-default': route }), html, file);
  }
});
