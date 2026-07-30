#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'agriculture/warehouse-receipt/index.html');
const DATA_START = 'var COUNTRIES = {';
const DATA_END = '// ── STATE';
const CALC_START = "  var countryCode = document.getElementById('inp-country').value;";
const CALC_END = '  // ── RENDER';
const ALIASES = `var COUNTRIES = window.WAREHOUSE_RECEIPT_DATA.countries;
var COMMODITIES = window.WAREHOUSE_RECEIPT_DATA.commodities;

`;
const CALC = `  var model = window.AfroTools.WarehouseReceiptEngine.calculate({
    countryCode: document.getElementById('inp-country').value,
    commodity: document.getElementById('inp-commodity').value,
    quantityTonnes: document.getElementById('inp-quantity').value,
    harvestPricePerTonne: document.getElementById('inp-price').value,
    ltvPct: document.getElementById('inp-ltv').value,
    annualRatePct: document.getElementById('inp-rate').value,
    periodMonths: document.getElementById('inp-period').value,
    storagePerTonneMonth: document.getElementById('inp-storage-cost').value,
    insuranceAnnualPct: document.getElementById('inp-insurance').value,
    handlingPerTonne: document.getElementById('inp-handling').value,
    priceIncreasePct: document.getElementById('inp-price-increase').value
  }, window.WAREHOUSE_RECEIPT_DATA);
  if (!model.ok) {
    var errors = {
      'missing-country': 'Please select a country.',
      'missing-quantity': 'Please enter the quantity deposited (tonnes).',
      'missing-price': 'Please enter the current harvest price per tonne.',
      'missing-storage-cost': 'Please enter the storage cost per tonne per month.',
      'missing-handling-cost': 'Please enter the handling fee per tonne.'
    };
    showErr(errors[model.status] || 'Review your inputs.');
    return;
  }
  window.WAREHOUSE_RECEIPT_LAST_RESULT = model;
  var country = model.country;
  var qty = model.input.quantityTonnes;
  var price = model.input.harvestPricePerTonne;
  var ltv = model.input.ltvPct / 100;
  var rate = model.input.annualRatePct / 100;
  var period = model.input.periodMonths;
  var storagePmt = model.input.storagePerTonneMonth;
  var ins = model.input.insuranceAnnualPct / 100;
  var handling = model.input.handlingPerTonne;
  var priceInc = model.input.priceIncreasePct / 100;
  var sym = country.symbol;
  var grainValue = model.grainValue;
  var loanAmount = model.loanAmount;
  var interest = model.interest;
  var storageCost = model.storageCost;
  var insuranceCost = model.insuranceCost;
  var handlingCost = model.handlingCost;
  var totalCost = model.totalCost;
  var expectedPrice = model.expectedPrice;
  var saleRevenue = model.saleRevenue;
  var netProceeds = model.netProceeds;
  var harvestValue = model.harvestValue;
  var wrsGain = model.wrsGain;
  var wrsGainPct = model.wrsGainPct;
  var beIncrease = model.breakEvenIncreasePct;

`;
function migrate(input) {
  let source = input;
  if (!source.includes('/data/agriculture/warehouse-receipt-data.js')) {
    source = source.replace('<script>\n//', '<script src="/data/agriculture/warehouse-receipt-data.js"></script>\n<script src="/engines/warehouse-receipt-engine.js"></script>\n<script>\n//');
  }
  const dataStart = source.indexOf(DATA_START);
  const dataEnd = source.indexOf(DATA_END, dataStart);
  if (dataStart < 0 || dataEnd < 0) throw new Error('Missing Warehouse Receipt embedded data block.');
  source = source.slice(0, dataStart) + ALIASES + source.slice(dataEnd);
  const calcStart = source.indexOf(CALC_START);
  const calcEnd = source.indexOf(CALC_END, calcStart);
  if (calcStart < 0 || calcEnd < 0) throw new Error('Missing Warehouse Receipt calculation block.');
  return source.slice(0, calcStart) + CALC + source.slice(calcEnd);
}
function run() {
  const current = fs.readFileSync(PAGE, 'utf8');
  const output = current.includes('WAREHOUSE_RECEIPT_LAST_RESULT') ? current : migrate(current);
  if (process.argv.includes('--check')) {
    assert.equal(current, output);
    console.log('PASS Warehouse Receipt English shared-engine migration');
  } else {
    fs.writeFileSync(PAGE, output, 'utf8');
    console.log('Migrated Warehouse Receipt English workflow to shared engine and data owner');
  }
}
if (require.main === module) run();
module.exports = { migrate };
