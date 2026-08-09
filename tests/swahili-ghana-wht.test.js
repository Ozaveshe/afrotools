'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const route = 'sw/zana/kikokotoo-wht-ghana/index.html';
const html = fs.readFileSync(path.join(root, route), 'utf8');
const engine = require('../assets/js/engines/gh-wht.js');
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'reports/swahili-finance-engineering-final-evidence.json'), 'utf8'));

test('Swahili Ghana WHT route is native, crawlable and source-owned', () => {
  assert.match(html, /<html[^>]+lang="sw"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/kikokotoo-wht-ghana\/">/);
  for (const [locale, url] of [
    ['en', 'https://afrotools.com/tools/gh-wht/'],
    ['fr', 'https://afrotools.com/fr/tools/gh-wht/'],
    ['sw', 'https://afrotools.com/sw/zana/kikokotoo-wht-ghana/'],
    ['x-default', 'https://afrotools.com/tools/gh-wht/'],
  ]) assert.match(html, new RegExp(`hreflang="${locale}" href="${url.replaceAll('/', '\\/')}"`));
  assert.match(html, /"inLanguage": "sw"/);
  assert.match(html, /assets\/img\/tools\/gh-paye-2\.webp/);
  assert.match(html, /assets\/js\/engines\/gh-wht\.js/);
  assert.match(html, /assets\/js\/pages\/ghana-wht-vip\.js/);
  assert.doesNotMatch(html, /<iframe|generated-bridge|afrotools-language-fallback/i);
  assert.doesNotMatch(html, /Ã|â‚|Â/);
  assert.ok(fs.existsSync(path.join(root, 'scripts/build-swahili-ghana-wht.js')));
});

test('reciprocal hreflang is present on English and French owners', () => {
  for (const owner of ['tools/gh-wht/index.html', 'fr/tools/gh-wht/index.html']) {
    const source = fs.readFileSync(path.join(root, owner), 'utf8');
    assert.match(source, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/kikokotoo-wht-ghana\/"/);
  }
});

test('shared Ghana WHT engine preserves threshold, treaty and freshness contracts', () => {
  const below = engine.calculate({
    payerContext: 'business', residence: 'resident', recipientType: 'entity', category: 'goods',
    grossAmount: 1000, yearToDateBefore: 500, paymentDate: '2026-08-09',
  });
  assert.equal(below.status, 'below-threshold');
  assert.equal(below.withheld, 0);

  const above = engine.calculate({
    payerContext: 'business', residence: 'resident', recipientType: 'entity', category: 'goods',
    grossAmount: 2000, yearToDateBefore: 500, paymentDate: '2026-08-09',
  });
  assert.equal(above.status, 'calculated');
  assert.equal(above.appliedRate, 3);
  assert.equal(above.withheld, 60);
  assert.equal(above.remittanceDate, '2026-09-15');
  assert.equal(above.reviewedAt, '2026-07-22');

  assert.throws(() => engine.calculate({
    payerContext: 'business', residence: 'non-resident', recipientType: 'entity', category: 'services',
    grossAmount: 1000, paymentDate: '2026-08-09', useApprovedTreatyRate: true,
    approvedTreatyRate: 8, beneficialOwner: false, graApproval: true,
  }), /Treaty relief requires/);
});

test('finance and engineering queue remains exact and fail-closed', () => {
  const expected = [
    'pension-projection', 'ng-paye', 'business-planner', 'za-paye', 'ma-paye', 'dz-paye',
    'tn-paye', 'ly-paye', 'sd-paye', 'mz-paye', 'na-paye', 'mg-paye', 'cd-paye', 'cg-paye',
    'sl-paye', 'gh-paye-2', 'itax-guide', 'etims-guide', 'sars-efiling', 'cnps-guide',
    'paye-calculator', 'afrodraft', 'afroplan-floor-planner', 'architectural-fee',
  ];
  assert.equal(evidence.denominator, 24);
  assert.equal(evidence.accepted, 1);
  assert.equal(evidence.blocked, 23);
  assert.deepEqual(evidence.rows.map((row) => row.englishId), expected);
  assert.deepEqual(evidence.acceptedIds, ['gh-paye-2']);
  assert.ok(evidence.rows.filter((row) => row.status === 'blocked').every((row) => row.blocker));
  assert.equal(evidence.deletedFiles, 0);
  assert.equal(evidence.coordinatorOwnedFilesEdited, false);
});
