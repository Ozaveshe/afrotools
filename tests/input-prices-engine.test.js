'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const engine = require('../engines/src/input-prices-engine.js');
const fixture = require('./fixtures/input-prices-english-parity.json');

function loadData() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'agriculture', 'input-prices-data.js'), 'utf8'), context);
  return context.INPUT_PRICES;
}

const DATA = loadData();
const LEGACY_ZERO_DECIMAL_COUNTRIES = new Set(['NG', 'CI', 'CM', 'SN', 'MA']);

function behaviorFor(countryCode) {
  const legacy = LEGACY_ZERO_DECIMAL_COUNTRIES.has(countryCode);
  return {
    fertilizerPerKgDecimals: legacy ? 0 : 1,
    seedSortStrategy: legacy ? 'legacy-post-division-fallback' : 'pack-fallback-25',
  };
}

function legacyOracle(countryCode, input) {
  const data = DATA[countryCode];
  const behavior = behaviorFor(countryCode);
  const farmSize = parseFloat(input.farmSize) || 1;
  const useSubsidized = input.priceMode === 'subsidized';
  const includeFertilizers = input.inputType === 'all' || input.inputType === 'fertilizers';
  const includeSeeds = input.inputType === 'all' || input.inputType === 'seeds';
  const includeAgrochemicals = input.inputType === 'all' || input.inputType === 'agrochemicals';

  let fertilizerSubtotal = 0;
  const fertilizerRows = includeFertilizers ? data.fertilizers.slice().sort((a, b) => {
    const aPrice = useSubsidized && a.subsidizedPrice ? a.subsidizedPrice : a.marketPrice;
    const bPrice = useSubsidized && b.subsidizedPrice ? b.subsidizedPrice : b.marketPrice;
    return aPrice - bPrice;
  }).map((fertilizer, index) => {
    const price = useSubsidized && fertilizer.subsidizedPrice ? fertilizer.subsidizedPrice : fertilizer.marketPrice;
    const rateKey = fertilizer.brand.split(' ')[0];
    const bagsPerHa = DATA.appRates.fertilizer[rateKey] || 3;
    const perHa = price * bagsPerHa;
    if (index === 0) fertilizerSubtotal = perHa * farmSize;
    return {
      brand: fertilizer.brand,
      selectedPrice: price,
      perKg: Number((price / fertilizer.bag_kg).toFixed(behavior.fertilizerPerKgDecimals)),
      perHa,
      isCheapest: index === 0,
    };
  }) : [];

  let seeds = data.seeds.filter(seed => !input.crop || seed.crop === input.crop);
  const usedFallback = includeSeeds && seeds.length === 0;
  if (seeds.length === 0) seeds = data.seeds;
  const seedUnit = seed => behavior.seedSortStrategy === 'legacy-post-division-fallback'
    ? seed.price / seed.bag_kg || seed.price
    : seed.price / (seed.bag_kg || 25);
  let seedSubtotal = 0;
  const seedRows = includeSeeds ? seeds.slice().sort((a, b) => seedUnit(a) - seedUnit(b)).map((seed, index) => {
    const quantity = Math.ceil((DATA.appRates.seeds[seed.crop] || 30) * farmSize / (seed.bag_kg || 25));
    if (index === 0) seedSubtotal = seed.price * quantity;
    return { crop: seed.crop, brand: seed.brand, quantity, isCheapest: index === 0 };
  }) : [];

  let agrochemicalSubtotal = 0;
  let first = true;
  const groups = {};
  if (includeAgrochemicals) {
    data.agrochemicals.slice().sort((a, b) => a.price - b.price).forEach(chemical => {
      groups[chemical.type] = groups[chemical.type] || [];
      groups[chemical.type].push(chemical);
    });
  }
  const agrochemicalGroups = Object.keys(groups).map(type => ({
    type,
    rows: groups[type].map((chemical, index) => {
      const isBudgetSelection = first && index === 0;
      if (isBudgetSelection) {
        agrochemicalSubtotal = chemical.price * farmSize;
        first = false;
      }
      return {
        type: chemical.type,
        brand: chemical.brand,
        isCheapestInType: index === 0,
        isBudgetSelection,
      };
    }),
  }));

  const total = fertilizerSubtotal + seedSubtotal + agrochemicalSubtotal;
  const premium = total * 1.35;
  return {
    fertilizerRows,
    seedRows,
    agrochemicalGroups,
    usedFallback,
    budget: {
      fertilizerSubtotal,
      seedSubtotal,
      agrochemicalSubtotal,
      total,
      premium,
      savings: premium - total,
    },
  };
}

test('engine is CommonJS-compatible and does not require a DOM', () => {
  assert.equal(typeof engine.calculate, 'function');
  assert.equal(global.document, undefined);
  assert.deepEqual(engine.calculate({ countryCode: 'XX' }, null, DATA.appRates), {
    ok: false,
    status: 'unknown-country',
    countryCode: 'XX',
  });
});

test('shared engine preserves every country legacy calculation variant', () => {
  assert.equal(fixture.countries.length, 15);
  for (const countryFixture of fixture.countries) {
    const countryCode = countryFixture.countryCode;
    const firstSupportedCrop = DATA[countryCode].seeds[0].crop;
    const inputs = [];
    for (const priceMode of ['market', 'subsidized']) {
      for (const inputType of ['all', 'fertilizers', 'seeds', 'agrochemicals']) {
        for (const farmSize of [0.5, 1, 3.75]) {
          inputs.push({ countryCode, priceMode, inputType, farmSize, crop: '' });
        }
      }
      inputs.push({ countryCode, priceMode, inputType: 'seeds', farmSize: 2.25, crop: firstSupportedCrop });
      inputs.push({ countryCode, priceMode, inputType: 'seeds', farmSize: 2.25, crop: '__fixture_unsupported_crop__' });
    }

    for (const input of inputs) {
      const actual = engine.calculate(input, DATA[countryCode], DATA.appRates, behaviorFor(countryCode));
      const expected = legacyOracle(countryCode, input);
      assert.deepEqual(actual.fertilizers.rows.map(row => ({
        brand: row.brand,
        selectedPrice: row.selectedPrice,
        perKg: row.perKg,
        perHa: row.perHa,
        isCheapest: row.isCheapest,
      })), expected.fertilizerRows, `${countryCode} fertilizer parity`);
      assert.deepEqual(actual.seeds.rows.map(row => ({
        crop: row.crop,
        brand: row.brand,
        quantity: row.quantity,
        isCheapest: row.isCheapest,
      })), expected.seedRows, `${countryCode} seed parity`);
      assert.deepEqual(actual.agrochemicals.groups.map(group => ({
        type: group.type,
        rows: group.rows.map(row => ({
          type: row.type,
          brand: row.brand,
          isCheapestInType: row.isCheapestInType,
          isBudgetSelection: row.isBudgetSelection,
        })),
      })), expected.agrochemicalGroups, `${countryCode} agrochemical parity`);
      assert.equal(actual.seeds.usedFallback, expected.usedFallback, `${countryCode} crop fallback parity`);
      assert.deepEqual(actual.budget, {
        ...expected.budget,
        premiumRate: 0.35,
      }, `${countryCode} budget parity`);
    }
  }
});
