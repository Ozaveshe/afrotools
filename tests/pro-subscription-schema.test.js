'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { replaceCountMarkers } = require('../scripts/build-canonical-registry');
const planApi = require('../assets/js/lib/pro-plan');
const registry = {
  productPlans: Object.values(planApi.plans).map((plan) => ({
    id: `product:${plan.id}`, amountMinor: plan.amount, currency: plan.currency,
    interval: plan.interval, title: plan.label, suffix: plan.suffix, detail: plan.detail
  })),
  apiPlans: []
};
const marker = /<script[^>]*data-registry-schema="pro-subscription"[^>]*>([\s\S]*?)<\/script>/;

for (const file of ['pro/index.html', 'pricing/index.html']) {
  test(`${file}: published subscription prices match registry and survive regeneration`, () => {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const match = html.match(marker);
    assert.ok(match, 'subscription schema must be owned by the registry builder');
    const schema = JSON.parse(match[1]);
    assert.equal(schema.mainEntity['@type'], 'WebApplication');
    assert.equal(schema.mainEntity.offers[1].price, (planApi.plans.annual.amount / 100).toFixed(2));
    assert.equal(schema.mainEntity.offers[0].priceSpecification.billingDuration, 'P1M');
    assert.equal(schema.mainEntity.offers[1].priceSpecification.billingDuration, 'P1Y');
    assert.ok(!match[1].includes('priceValidUntil'), 'no unsupported future price guarantee');
    assert.ok(!schema.mainEntity.aggregateRating, 'no invented rating');
    assert.equal(replaceCountMarkers(match[0], file, registry).content, match[0]);
    const changed = structuredClone(registry);
    Object.assign(changed.productPlans.find((p) => p.id === 'product:annual'), {
      amountMinor: 4200, title: '$42', detail: 'Synthetic test price.'
    });
    const rebuilt = replaceCountMarkers(match[0], file, changed).content;
    const offers = JSON.parse(rebuilt.match(marker)[1]).mainEntity.offers;
    assert.equal(offers[1].price, '42.00');
    assert.equal(offers[1].priceSpecification.price, '42.00');
    assert.match(offers[1].description, /\$42/);
    assert.equal(offers[0].price, schema.mainEntity.offers[0].price);
  });
}

test('unknown currency fails closed instead of publishing a misleading USD amount', () => {
  const changed = structuredClone(registry);
  changed.productPlans.find((p) => p.id === 'product:annual').currency = 'NGN';
  const html = fs.readFileSync(path.join(__dirname, '../pro/index.html'), 'utf8');
  assert.throws(() => replaceCountMarkers(html.match(marker)[0], 'fixture', changed), /invalid USD subscription/);
});
