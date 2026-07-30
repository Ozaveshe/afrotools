#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'agriculture', 'farm-budget', 'index.html');
const DATA_TAG = '<script src="/data/agriculture/farm-budget-data.js"></script>';
const ENGINE_TAG = '<script src="/engines/farm-budget-engine.js"></script>';
let html = fs.readFileSync(FILE, 'utf8');

if (!html.includes(ENGINE_TAG)) {
  const commodityTag = '<script src="/data/agriculture/commodity-prices.js?v=3e308ad4"></script>';
  assert(html.includes(commodityTag), 'Farm Budget canonical data tags not found');
  html = html.replace(commodityTag, `${commodityTag}\n${DATA_TAG}\n${ENGINE_TAG}`);
}
if (/var SEED_PRICE_PER_KG = \{/.test(html)) {
  const dataBlock = html.match(/var MONTHS = \[[\s\S]*?\nfunction getMarketPrice\(cc, crop\)\{[\s\S]*?\n\}/);
  assert(dataBlock, 'Farm Budget embedded calculation data block not found');
  html = html.replace(dataBlock[0], "var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];");
}
if (!html.includes('window.FARM_BUDGET_LAST_RESULT = result;')) {
  const calculationBlock = html.match(/  var cd = getCountryCosts\(cc\);[\s\S]*?  var roi = totalBudget > 0 \? \(profit \/ totalBudget \* 100\) : 0;/);
  assert(calculationBlock, 'Farm Budget inline formula block not found');
  const replacement = `  var engine = window.AfroTools && window.AfroTools.FarmBudgetEngine;
  var budgetData = window.AfroTools && window.AfroTools.FarmBudgetData;
  var farmCosts = window.AfroTools && window.AfroTools.farmCosts;
  var result = engine.calculate({
    countryCode:cc,
    crops:crops,
    landMode:landMode,
    laborMode:laborMode,
    mechanizationMode:mechMode,
    financeMode:finMode,
    startMonth:startMonth,
    rentOverride:document.getElementById('rent-override').value,
    loanRate:document.getElementById('loan-rate').value,
    loanTerm:document.getElementById('loan-term').value
  }, {data:budgetData,farmCosts:farmCosts});
  if(!result.ok){errEl.classList.add('show');return result;}
  var sym = result.currency.symbol;
  var totSeed=result.totals.seed,totFert=result.totals.fertilizer,totChemicals=result.totals.chemicals,
      totLabor=result.totals.labor,totMech=result.totals.mechanization,totLand=result.totals.land,
      totTransport=result.totals.transport,totRevenue=result.totals.revenue,totalArea=result.totals.area;
  var subTotal=result.subtotal,contingency=result.contingency,loanInterest=result.loanInterest,
      totalBudget=result.totalBudget,profit=result.profit,roi=result.roi;
  window.FARM_BUDGET_LAST_RESULT = result;`;
  html = html.replace(calculationBlock[0], replacement);
  html = html.replace(
    /  var cfWeights = \[[\s\S]*?  cfWeights\[0\] \+= contingency \* 0\.5;/,
    '  var cfWeights = result.cashflow.map(function(month){return month.value;});',
  );
  html = html.replace(
    /  var avgPricePerT = crops\.reduce\([\s\S]*?  var bePlant = avgPricePerT > 0 \? totalBudget \/ \(avgPricePerT \* totalArea\) : 0;/,
    '  var avgPricePerT = result.averageMarketPricePerTonne;\n  var bePlant = result.breakEvenYieldTonnesHa;',
  );
}
fs.writeFileSync(FILE, html, 'utf8');
assert(html.includes(DATA_TAG) && html.includes(ENGINE_TAG));
assert(!/var SEED_PRICE_PER_KG = \{/.test(html));
assert(html.includes('window.AfroTools.FarmBudgetEngine') && html.includes('engine.calculate'));
console.log('Farm Budget English page now delegates all calculation formulas to the shared DOM-free engine');
