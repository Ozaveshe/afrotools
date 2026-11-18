'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { rewriteSensitiveLinks } = require('../scripts/build-hausa-product-surface');
const { contactPath, reportParams } = require('../assets/js/lib/hausa-contact-report');

const origin = 'https://afrotools.com';
const tools = new Map([
  ['/ha/kayan-aiki/cgt-najeriya/', 'ng-cgt'],
  ['/ha/kayan-aiki/cit-najeriya/', 'ng-cit'],
  ['/ha/najeriya/harajin-albashi/', 'ng-paye-ha'],
  ['/ha/kayan-aiki/takardar-albashi/', 'payslip-generator'],
  ['/ha/kayan-aiki/kalkuletan-paystack/', 'paystack-calculator']
]);

function parsedHref(html) {
  return new URL(html.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&'), origin);
}

test('each published Hausa report identifies its tool and returns to its source page', () => {
  for (const [route, tool] of tools) {
    const relative = route.slice(1) + 'index.html';
    const html = fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');
    const anchor = html.match(/<a\b[^>]*href="[^"]*topic=calculation-error[^"]*"[^>]*>/);
    assert.ok(anchor, relative);
    const url = parsedHref(anchor[0]);
    assert.equal(url.pathname, contactPath);
    assert.equal(url.searchParams.get('topic'), 'calculation-error');
    assert.equal(url.searchParams.get('tool'), tool);
    assert.equal(url.searchParams.get('return_to'), route);
    assert.equal(rewriteSensitiveLinks(anchor[0], relative), anchor[0]);
  }
});

test('Hausa rewriting decodes HTML separators once while preserving encoded query values', () => {
  const relative = 'ha/kayan-aiki/cgt-najeriya/index.html';
  const original = '<a href="/contact/?topic=calculation-error&amp;tool=ng-cgt&amp;note=x%26amp%3By&amp;tag=a&amp;tag=b">';
  const url = parsedHref(rewriteSensitiveLinks(original, relative));
  assert.equal(url.searchParams.get('note'), 'x&amp;y');
  assert.deepEqual(url.searchParams.getAll('tag'), ['a', 'b']);
  assert.equal(url.searchParams.get('tool'), 'ng-cgt');
  assert.equal(url.searchParams.get('return_to'), '/ha/kayan-aiki/cgt-najeriya/');
});

test('fresh and bookmarked bridge links resolve to the same report context', () => {
  const returnTo = '/ha/kayan-aiki/cgt-najeriya/?scenario=1#result';
  for (const separator of ['&', '&amp;']) {
    const destination = '/contact/?topic=calculation-error' + separator + 'tool=ng-cgt&ref=x%26y';
    const href = contactPath + '?' + new URLSearchParams({ destination, return_to: returnTo });
    const params = reportParams(href, origin);
    assert.equal(params.get('tool'), 'ng-cgt');
    assert.equal(params.get('ref'), 'x&y');
    assert.equal(params.get('return_to'), returnTo);
    assert.equal(params.has('amp;tool'), false);
  }
  const legacy = new URLSearchParams({ destination: '/contact/?subject=ng-cit-calculation-error', return_to: returnTo });
  const legacyParams = reportParams(contactPath + '?' + legacy, origin);
  assert.equal(legacyParams.get('tool'), 'ng-cit');
  assert.equal(legacyParams.get('subject'), 'ng-cit-calculation-error');
  assert.equal(legacyParams.get('return_to'), returnTo);
  assert.equal(reportParams(contactPath, origin), null);
  assert.equal(reportParams(contactPath + '?destination=https://example.org/contact/', origin), null);
});

test('active bridges keep decoded separators and preserve the nested return URL', () => {
  const html = '<a href="/auth/?mode=login&amp;next=%2Fha%2F%3Fa%3D1%26b%3D2">';
  const url = parsedHref(rewriteSensitiveLinks(html, 'ha/najeriya/harajin-albashi/index.html'));
  const destination = new URL(url.searchParams.get('destination'), origin);
  assert.equal(url.pathname, '/ha/shiga/');
  assert.equal(destination.searchParams.get('mode'), 'login');
  assert.equal(destination.searchParams.get('next'), '/ha/?a=1&b=2');
  assert.equal(url.searchParams.get('return_to'), '/ha/najeriya/harajin-albashi/');
});
