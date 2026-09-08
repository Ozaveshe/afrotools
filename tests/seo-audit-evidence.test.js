'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyzeHtml, extractPage } = require('../netlify/functions/_shared/seo-audit-engine.js');
const html = '<html lang="en"><head><title>A useful short page</title><link rel="canonical" href="/tools/"></head><body><h1>Calculator</h1><img src="/ornament.svg" alt=""><a href="http://other.example/">Other website</a><a href="//external.example/">External</a></body></html>';
test('AC-5 absence of llms.txt cannot alter score and methodology is explicit', () => {
  const a = analyzeHtml({ html, url: 'https://example.com/tools/', fetchMeta: { llmsTxt: { found: true } } });
  const b = analyzeHtml({ html, url: 'https://example.com/tools/', fetchMeta: { llmsTxt: { found: false } } });
  assert.equal(a.score, b.score);
  assert.equal(a.methodologyVersion, '2');
  assert.ok(a.limitations.some(x => /ranking/i.test(x)));
  assert.ok(a.issues.every(i => i.id && i.evidence));
  assert.ok(!JSON.stringify(a).includes('rarely rank'));
});
test('AC-5 decorative alt, navigation links and relative URLs are handled correctly', () => {
  const page = extractPage(html, 'https://example.com/tools/');
  assert.equal(page.canonical, 'https://example.com/tools/');
  assert.equal(page.links.external, 2);
  assert.equal(page.mixedContent.length, 0);
  const report = analyzeHtml({ html, url: 'https://example.com/tools/' });
  assert.ok(!report.issues.some(i => i.id === 'img-alt-missing'));
  const mixed = extractPage(html.replace('</body>', '<script src="http://bad.example/a.js"></script></body>'), 'https://example.com/tools/');
  assert.equal(mixed.mixedContent.length, 1);
});
test('AC-5 inert markup is not reported as page metadata, and duplicate robots directives are observed', () => {
  const inert = '<!-- <meta name="robots" content="noindex"> --><script>const template = \'<meta name="robots" content="noindex">\';</script>';
  const clean = analyzeHtml({ html: html.replace('</head>', inert + '</head>'), url: 'https://example.com/tools/' });
  assert.ok(!clean.issues.some(i => i.id === 'noindex'));
  const blocked = analyzeHtml({ html: html.replace('</head>', '<meta name="robots" content="index"><meta name="robots" content="none"></head>'), url: 'https://example.com/tools/' });
  assert.ok(blocked.issues.some(i => i.id === 'noindex'));
});
