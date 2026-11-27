const test = require('node:test');
const assert = require('node:assert/strict');
const budget = require('../assets/js/agriculture/fertilizer-shopping-budget.js');
const blend = { name: 'NK', composition: { N: 20, K2O: 20 }, bagSize_kg: 50, pricePerBag: 10, subsidyPrice: 0 };
const nitrogen = { name: 'N', composition: { N: 40 }, bagSize_kg: 50, pricePerBag: 5 };
const base = { products: [{...nitrogen, bags: 1}], totalNPK: {N: 20,P: 15,K: 20}, farmSizeHa: 1, costSubsidy: 5 };
test('substitutes a closer blend, keeps unsupported phosphorus separate and honors zero subsidy', () => {
  const r = budget(base, [nitrogen,blend]);
  assert.deepEqual(r.products.map(p => [p.name,p.bags]), [['NK',2]]);
  assert.equal(r.costMarket,20);
  assert.equal(r.costSubsidy,0);
  assert.equal(r.savings,20);
  assert.equal(r.costPerHaSubsidy,0);
});
test('does not introduce a new nutrient with a zero target', () => {
  const r = budget({...base, products: [], totalNPK: {N:0,P:0,K:80}, costSubsidy:null}, [blend]);
  assert.deepEqual(r.products, []);
  assert.equal(r.costPerHaSubsidy,null);
});
test('scales whole bags and cost per hectare on large farms', () => {
  const r = budget({...base, farmSizeHa:100000, totalNPK:{N:2000000,P:0,K:2000000}}, [nitrogen,blend]);
  assert.deepEqual(r.products.map(p=>p.bags), [200000]);
  assert.equal(r.costPerHaMarket,20);
});
