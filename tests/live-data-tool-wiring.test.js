#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

const fuelPage = read('tools/fuel-tracker/index.html');
const fuelApp = read('tools/fuel-tracker/fuel-tracker.js');
const electricityPage = read('tools/electricity-estimator/index.html');
const interestRates = read('tools/interest-rate-ref/index.html');
const forexProfit = read('tools/forex-profit/index.html');
const ticker = read('assets/js/components/rate-ticker.js');
const fuelApi = read('netlify/functions/api-fuel.js');
const electricityApi = read('netlify/functions/api-electricity.js');

assert.match(fuelPage, /fuel-tracker\.js[^>]+defer[^>]+data-afrofuel-app/, 'Fuel app should start on page load');
assert.match(fuelPage, /id="fuel-data-fallback-note"/, 'Fuel page needs a visible fallback status hook');
assert.match(fuelApp, /\/api\/fuel/, 'Fuel app should request the live API');
assert.match(fuelApp, /\/data\/fuel\/latest\.json/, 'Fuel app should retain the static snapshot fallback');
assert.match(fuelApp, /LiveData\("\/api\/fuel"/, 'Fuel app should start its live source before invoking the fallback loader');
assert.doesNotMatch(fuelApp, /Local static preview/, 'Local and production loads should follow the same live-first order');
assert.match(fuelApp, /Showing cached rates from/, 'Fuel fallback should be disclosed');
assert.doesNotMatch(fuelApp, /Built-in fallback estimates|built-in planning estimate|using a static estimate/i, 'Fuel must not present randomized estimates as data');
assert.match(fuelApi, /source_state:/, 'Fuel API should expose source provenance');

assert.match(electricityPage, /fetch\('\/api\/electricity'/, 'Electricity estimator should request its live API');
assert.match(electricityPage, /ELECTRICITY_FALLBACK_AS_OF\s*=\s*'2026-03-28'/, 'Electricity fallback must be dated');
assert.match(electricityPage, /ELECTRICITY_FALLBACK_COUNTRIES/, 'Electricity should retain its inline fallback table');
assert.match(electricityPage, /Showing cached rates from/, 'Electricity fallback should be disclosed');
assert.match(electricityPage, /source-confidence\.js/, 'Electricity should use the shared source-confidence UI');
assert.doesNotMatch(electricityPage, /quality score|quality_score/i, 'Public electricity UI must not expose raw quality scores');
assert.match(electricityApi, /source_state:/, 'Electricity API should expose source provenance');

assert.ok(interestRates.indexOf("fetchRates('/api/rates')") < interestRates.indexOf("fetchRates('/data/rates/latest.json')"), 'Interest Rate Reference should be live-first');
assert.ok(forexProfit.indexOf("fetchRates('/api/forex?base=USD')") < forexProfit.indexOf("fetchRates('/data/forex/latest.json')"), 'Forex Profit should be live-first');
assert.ok(ticker.indexOf('/api/forex?base=USD') < ticker.indexOf('/data/forex/latest.json'), 'Shared FX ticker should be live-first');

console.log('live-data-tool-wiring.test.js passed');
