'use strict';

const assert = require('node:assert/strict');
const data = require('../data/agriculture/fertilizer-calc-data.json');
const engine = require('../engines/src/fertilizer-calc-engine');

let scenarios = 0;
for (const cropId of Object.keys(data.crops)) {
  for (const soil of Object.keys(data.soilMultipliers)) {
    for (const target of ['low', 'medium', 'high']) {
      for (const currency of Object.keys(data.costs)) {
        for (const area of [0.5, 1, 3.75]) {
          const result = engine.calculate({ cropId, soil, target, currency, area }, data);
          assert.equal(result.ok, true);
          const crop = data.crops[cropId];
          const multiplier = data.soilMultipliers[soil];
          const expected = crop.npk[target].map(value => Math.round(value * multiplier));
          assert.deepEqual(Object.values(result.perHectare), expected);
          assert.deepEqual(Object.values(result.totals), expected.map(value => Math.round(value * area)));
          assert.equal(result.yieldEstimate, crop.yield[target] * area);
          if (cropId === 'banana') {
            assert.deepEqual(result.scheduleReview, { status: 'needs-review', issue: 'banana-potassium-overallocation' });
            assert.deepEqual(result.schedule, ['Banana application schedule is under review. Do not use the previous timetable; confirm timing and nutrient splits with a local agronomist.']);
            assert.notDeepEqual(result.schedule, crop.schedule, 'do not expose the legacy 125% potassium timetable');
          } else assert.deepEqual(result.schedule, crop.schedule);
          assert.equal(result.microTip, data.microTips[cropId]);
          assert.equal(result.cost.urea, result.bags.urea * data.costs[currency].urea);
          assert.equal(result.cost.npk15, result.bags.npk15 * data.costs[currency].npk15);
          assert.equal(result.cost.total, result.cost.urea + result.cost.npk15);
          scenarios += 1;
        }
      }
    }
  }
}
assert.equal(engine.calculate({ cropId: 'unknown', soil: 'loam', target: 'low', currency: 'USD' }, data).status, 'unsupported-crop');
assert.equal(engine.calculate({}, null).status, 'missing-data');
console.log(JSON.stringify({ tool: 'fertilizer-calc', scenarios, status: 'passed' }, null, 2));

const validInput = { cropId: 'maize', soil: 'loam', target: 'medium', currency: 'KES', area: 1 };
for (const area of [0, -1, NaN, Infinity, -Infinity, null, false, true, '', ' ', '1ha', '1,5', [], {}, 1e308]) assert.equal(engine.calculate({ ...validInput, area }, data).ok, false);
for (const key of ['cropId', 'soil', 'target', 'currency']) for (const value of ['constructor', '__proto__', 'toString', [validInput[key]], {}]) assert.equal(engine.calculate({ ...validInput, [key]: value }, data).ok, false);
for (const area of [undefined, '1', ' 1.5 ', '2e1', '.5']) assert.equal(engine.calculate({ ...validInput, area }, data).input.area, area === undefined ? 1 : Number(area));
console.log('PASS Fertilizer input keys, positive area and finite results');

const scenario = engine.calculate({cropId:'maize',soil:'loam',target:'medium',currency:'KES',area:1},data);
assert.equal(scenario.bags.urea,3);assert.equal(scenario.bags.npk15,7);assert.equal(scenario.cost.total,49900);
for(const plan of Object.values(scenario.productPlans)){assert(Math.abs(plan.applicationSupply.n-100)<1e-7);assert.equal(plan.nutrientBasis.join(','),'N,P2O5,K2O');for(const product of plan.products){assert(product.remainingKg>=0);assert.equal(product.purchaseKg,product.purchaseBags*50);}}
assert.equal(scenario.productPlans.separate.purchaseCost,null);
assert.equal(scenario.cost.priceStatus,'undated-example-prices');
console.log('PASS separate product plans, nutrient credit and purchase/application distinction');

const quoteInput = {cropId:'maize',soil:'loam',target:'medium',currency:'KES',area:1};
const localQuote = {currency:'KES',source:'Synthetic supplier example',observedOn:'2024-02-29',prices:{urea:100,npk15:200,dap:300,mop:400}};
const quoted = engine.calculate({...quoteInput,priceQuote:localQuote},data);
assert.equal(quoted.cost.total,1700);assert.equal(quoted.cost.priceStatus,'user-provided-unverified');
assert.equal(quoted.productPlans.separate.purchaseCost,2100);
assert.deepEqual(quoted.input.priceQuote,localQuote);
const partial = engine.calculate({...quoteInput,priceQuote:{...localQuote,prices:{urea:100}}},data);
assert.equal(partial.cost.total,null);assert.equal(partial.cost.npk15,null);assert.equal(partial.productPlans.separate.purchaseCost,null);
assert.equal(engine.calculate({...quoteInput,priceQuote:{...localQuote,prices:{urea:0,npk15:0,dap:0,mop:0}}},data).cost.total,0);
for(const bad of [null,[],{}, {...localQuote,currency:'USD'}, {...localQuote,source:''}, {...localQuote,source:' '.repeat(3)}, {...localQuote,source:'x'.repeat(301)}, {...localQuote,observedOn:'2025-02-29'}, {...localQuote,observedOn:'2024-13-01'}, {...localQuote,observedOn:'2024-01-00'}, {...localQuote,prices:{}}, {...localQuote,prices:[]}, {...localQuote,prices:{urea:-1}}, {...localQuote,prices:{urea:NaN}}, {...localQuote,prices:{urea:Infinity}}, {...localQuote,prices:{urea:'100'}}, {...localQuote,prices:{urea:null}}, {...localQuote,prices:{unknown:100}}]) assert.equal(engine.calculate({...quoteInput,priceQuote:bad},data).status,'invalid-price-quote');
assert.equal(engine.calculate({...quoteInput,priceQuote:{...localQuote,prices:{urea:1e308,npk15:1e308}}},data).ok,false);
localQuote.prices.urea=999;assert.equal(quoted.input.priceQuote.prices.urea,100);
assert.equal(data.costs.KES.urea,4500);
console.log('PASS local quote provenance, partial-price honesty, invalid quote and overflow rejection');
