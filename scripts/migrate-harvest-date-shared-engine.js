#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'agriculture/harvest-date/index.html');
const SHARED = path.join(ROOT, 'assets/js/pages/day6-agriculture-family-calculators.js');

const OLD = `    'harvest-date-estimator': function (values) {
      var planting = new Date(values.plantingDate + 'T00:00:00');
      var harvest = new Date(planting.getTime());
      harvest.setDate(harvest.getDate() + values.maturityDays);
      return 'Planning date: ' + values.crop + ' reaches the entered ' + number(values.maturityDays, 0)
        + '-day maturity on ' + harvest.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })
        + '. Weather risk marked ' + values.weatherRisk
        + '. Confirm field maturity, variety, planting establishment, rainfall and buyer readiness before scheduling harvest.';
    },`;
const NEXT = `    'harvest-date-estimator': function (values) {
      var engine = typeof window !== 'undefined' && window.AfroTools && window.AfroTools.HarvestDateEngine
        ? window.AfroTools.HarvestDateEngine
        : (typeof require === 'function' ? require('../../../engines/src/harvest-date-engine') : null);
      var model = engine.calculate(values);
      var harvest = new Date(model.harvestDate + 'T00:00:00');
      return 'Planning date: ' + model.input.crop + ' reaches the entered ' + number(model.input.maturityDays, 0)
        + '-day maturity on ' + harvest.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })
        + '. Weather risk marked ' + model.input.weatherRisk
        + '. Confirm field maturity, variety, planting establishment, rainfall and buyer readiness before scheduling harvest.';
    },`;

function outputs() {
  const page = fs.readFileSync(PAGE, 'utf8');
  const shared = fs.readFileSync(SHARED, 'utf8');
  const nextPage = page.includes('/engines/harvest-date-engine.js')
    ? page
    : page.replace('<script src="/assets/js/pages/day6-agriculture-family-calculators.js', '<script src="/engines/harvest-date-engine.js"></script>\n<script src="/assets/js/pages/day6-agriculture-family-calculators.js');
  if (!nextPage.includes('/engines/harvest-date-engine.js')) throw new Error('Missing Harvest Date English controller script marker.');
  const nextShared = shared.includes("require('../../../engines/src/harvest-date-engine')")
    ? shared
    : shared.replace(OLD, NEXT);
  if (!nextShared.includes("require('../../../engines/src/harvest-date-engine')")) throw new Error('Missing accepted Harvest Date calculator branch.');
  return { page, shared, nextPage, nextShared };
}
function run() {
  const value = outputs();
  if (process.argv.includes('--check')) {
    assert.equal(value.page, value.nextPage);
    assert.equal(value.shared, value.nextShared);
    console.log('PASS Harvest Date English shared-engine migration');
  } else {
    fs.writeFileSync(PAGE, value.nextPage, 'utf8');
    fs.writeFileSync(SHARED, value.nextShared, 'utf8');
    console.log('Migrated Harvest Date English workflow to shared engine');
  }
}
if (require.main === module) run();
module.exports = { OLD, NEXT, outputs };
