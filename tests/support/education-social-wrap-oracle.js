'use strict';
const assert = require('node:assert/strict');
const {normalizeReleaseOwnedHtml} = require('../../scripts/lib/release-owned-html-normalizer');

function assertHead(actual, baseline) {
  assert.equal(actual.title, baseline.title);
  assert.equal(actual.canonical, baseline.canonical);
  assert.deepEqual(actual.alternates, baseline.alternates);
  assert.doesNotMatch(actual.robots, /noindex/i);
  for (const key of ['description', 'og:title', 'og:description', 'og:url', 'og:image', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert.equal(actual.counts[key], 1, key + ' must be unique');
  }
  assert.equal(actual.meta.description, baseline.meta.description);
  assert.equal(actual.meta['og:title'], baseline.meta['og:title']);
  assert.equal(actual.meta['og:description'], baseline.meta['og:description']);
  assert.equal(actual.meta['og:url'], baseline.meta['og:url']);
  assert.equal(actual.meta['og:image'], baseline.meta['og:image']);
  assert.equal(actual.meta['twitter:title'], actual.title);
  assert.equal(actual.meta['twitter:description'], actual.meta.description);
  assert.equal(actual.meta['twitter:image'], actual.meta['og:image']);
  assert.equal(actual.meta['twitter:card'], 'summary_large_image');
  for (const node of baseline.jsonLd) assert.ok(actual.jsonLd.some(value => JSON.stringify(value) === JSON.stringify(node)), 'Source JSON-LD must remain intact');
}

function assertSourceBody(actual, baseline) {
  const body = html => html.slice(html.indexOf('<body'));
  assert.equal(normalizeReleaseOwnedHtml(body(actual), {stripReleaseMetadata:true}),
    normalizeReleaseOwnedHtml(body(baseline), {stripReleaseMetadata:true}), 'Source body and controls must remain intact');
}

module.exports = {assertHead, assertSourceBody};
