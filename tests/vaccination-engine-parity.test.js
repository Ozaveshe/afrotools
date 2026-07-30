'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const contract = require('../engines/src/vaccination-engine');

function loadBrowserData() {
  const context = { window: { AfroTools: {} } };
  context.window.window = context.window;
  vm.createContext(context);
  for (const relativeFile of [
    'data/agriculture/country-index.js',
    'data/agriculture/vaccination-data.js'
  ]) {
    vm.runInContext(
      fs.readFileSync(path.join(ROOT, relativeFile), 'utf8'),
      context,
      { filename: relativeFile }
    );
  }
  return context.window.AfroTools;
}

const data = loadBrowserData();
const engine = contract.createEngine({
  vaccinationData: data.vaccinationData,
  countryIndex: data.countryIndex,
  now: () => new Date('2026-07-31T00:00:00Z')
});

test('vaccination calculation engine is DOM-free and exposes validation', () => {
  const source = fs.readFileSync(path.join(ROOT, 'engines/src/vaccination-engine.js'), 'utf8');
  assert.doesNotMatch(source, /\bdocument\b|innerHTML|getElementById|querySelector/);
  assert.deepEqual(contract.validateInput({
    countryCode: 'KE',
    animalType: 'all',
    herdSize: 20,
    currentMonth: 3
  }), { valid: true, errors: [] });
  assert.deepEqual(contract.validateInput({
    countryCode: '',
    animalType: 'unknown',
    herdSize: 0,
    currentMonth: 13
  }), {
    valid: false,
    errors: ['country_required', 'animal_type_invalid', 'herd_size_invalid', 'current_month_invalid']
  });
});

test('Kenya all-livestock fixture preserves legacy schedule and costs', () => {
  const result = engine.calculate('KE', 'all', 20, 3, 'mixed', 'mixed');
  assert.deepEqual({
    country: result.country,
    herdSize: result.herdSize,
    currentMonth: result.currentMonth,
    vaccineCount: result.vaccineCount,
    criticalCount: result.criticalCount,
    scheduleLength: result.schedule.length,
    firstFive: result.schedule.slice(0, 5).map(row => [
      row.id,
      row.nextDueMonth,
      row.totalAnnualCost
    ]),
    costs: result.costs
  }, {
    country: { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    herdSize: 20,
    currentMonth: 3,
    vaccineCount: 13,
    criticalCount: 6,
    scheduleLength: 20,
    firstFive: [
      ['blackquarter', 3, 300],
      ['brucellosis', 3, 80],
      ['ecf', 3, 10000],
      ['lsd', 4, 400],
      ['rvf', 4, 3.6]
    ],
    costs: {
      totalAnnual: 14001.2,
      perAnimal: 700.06,
      govSavings: 0,
      byAnimalType: {
        cattle: 12786.6,
        goats_sheep: 942.6,
        poultry: 272
      },
      currency: 'KES',
      symbol: 'KSh'
    }
  });
});

test('Nigeria cattle fixture preserves legacy rounding and next due logic', () => {
  const result = engine.calculate('NG', 'cattle', 35, 7, 'adult', 'meat');
  assert.equal(result.schedule.length, 8);
  assert.equal(result.vaccineCount, 6);
  assert.equal(result.criticalCount, 3);
  assert.deepEqual(result.costs, {
    totalAnnual: 31301.55,
    perAnimal: 894.33,
    govSavings: 0,
    byAnimalType: { cattle: 31301.55 },
    currency: 'NGN',
    symbol: '₦'
  });
  assert.deepEqual(result.upcoming.map(row => row.month), ['September']);
});

test('Tanzania poultry and South Africa small-ruminant fixtures preserve output', () => {
  const poultry = engine.calculate('TZ', 'poultry', 120, 11, 'young', 'village');
  assert.deepEqual({
    length: poultry.schedule.length,
    vaccineCount: poultry.vaccineCount,
    criticalCount: poultry.criticalCount,
    totalAnnual: poultry.costs.totalAnnual,
    perAnimal: poultry.costs.perAnimal,
    months: poultry.upcoming.map(row => row.month)
  }, {
    length: 6,
    vaccineCount: 4,
    criticalCount: 2,
    totalAnnual: 36016.8,
    perAnimal: 300.14,
    months: ['November', 'December', 'January']
  });

  const smallRuminants = engine.calculate('ZA', 'goats_sheep', 12, 1, 'adult', 'breeding');
  assert.deepEqual({
    ids: smallRuminants.schedule.map(row => row.id),
    totalAnnual: smallRuminants.costs.totalAnnual,
    perAnimal: smallRuminants.costs.perAnimal
  }, {
    ids: ['goat_pox', 'clostridial_sr', 'ppr', 'bluetongue'],
    totalAnnual: 319.68,
    perAnimal: 26.64
  });
});

test('legacy normalization remains backward-compatible for empty numeric inputs', () => {
  const result = engine.calculate('XX', 'all', 0, 0, 'young', 'mixed');
  assert.equal(result.herdSize, 10);
  assert.equal(result.currentMonth, 7);
  assert.equal(result.costs.totalAnnual, 15.9);
  assert.equal(result.costs.perAnimal, 1.59);
});

test('generated browser engine matches the readable source contract', () => {
  const context = { window: { AfroTools: data } };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, 'engines/vaccination-engine.js'), 'utf8'),
    context,
    { filename: 'engines/vaccination-engine.js' }
  );
  const browserResult = context.window.AfroTools.VaccinationEngine
    .calculate('KE', 'all', 20, 3, 'mixed', 'mixed');
  const sourceResult = engine.calculate('KE', 'all', 20, 3, 'mixed', 'mixed');
  assert.equal(JSON.stringify(browserResult), JSON.stringify(sourceResult));
});

test('all 54 English country controllers use the separate renderer', () => {
  const files = fs.readdirSync(path.join(ROOT, 'agriculture/vaccination-schedule'))
    .filter(name => name.endsWith('.html') && name !== 'index.html');
  assert.equal(files.length, 54);
  for (const name of files) {
    const html = fs.readFileSync(path.join(ROOT, 'agriculture/vaccination-schedule', name), 'utf8');
    assert.match(html, /\/engines\/vaccination-engine\.js/);
    assert.match(html, /\/assets\/js\/agriculture\/vaccination-renderer\.js/);
    assert.match(html, /\/assets\/css\/agriculture\/vaccination-responsive\.css/);
    assert.match(html, /var VR\s*=\s*window\.AfroTools\.VaccinationRenderer;/);
    assert.doesNotMatch(html, /\bVE\.render(?:CalendarGrid|ScheduleTable|CostTable|GovInfo)\(/);
  }
});
