#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'agriculture/cooperative-calculator/index.html');

const START = "  var revenue  = getNum('inp-revenue');";
const END = '  // --- RENDER ---';
const BLOCK = `  var model = window.AfroTools.CooperativeEngine.calculate({
    coopType: coopType,
    method: method,
    revenue: getNum('inp-revenue'),
    expenses: getNum('inp-expenses'),
    members: getNum('inp-members'),
    myProduce: getNum('inp-my-produce'),
    totalProduce: getNum('inp-total-produce'),
    myShares: getNum('inp-my-shares'),
    totalShares: getNum('inp-total-shares'),
    marketPrice: getNum('inp-market-price'),
    saccoRate: getNum('inp-sacco-rate'),
    hybridPatronagePct: parseInt(document.getElementById('hybrid-range').value),
    allocations: {
      reserve: getNum('alloc-reserve'),
      education: getNum('alloc-edu'),
      dividend: getNum('alloc-dividend'),
      social: getNum('alloc-social'),
      retained: getNum('alloc-retained')
    }
  });
  if (!model.ok) {
    var errors = {
      'missing-revenue': 'Please enter total cooperative revenue.',
      'missing-members': 'Please enter number of members.',
      'allocation-not-100': 'Total surplus allocation must equal 100%.',
      'negative-surplus': 'Expenses exceed revenue — no surplus to distribute. Review your inputs.',
      'missing-total-produce': 'For patronage method, enter total produce collected by the cooperative.',
      'missing-total-shares': 'For per-share method, enter total cooperative share capital.',
      'missing-hybrid-totals': 'For hybrid method, enter both total produce and total shares.'
    };
    showErr(errors[model.status] || 'Review your inputs.');
    return;
  }
  window.COOPERATIVE_LAST_RESULT = model;
  var revenue = model.input.revenue;
  var expenses = model.input.expenses;
  var members = model.input.members;
  var myProduce = model.input.myProduce;
  var totalProduce = model.input.totalProduce;
  var myShares = model.input.myShares;
  var totalShares = model.input.totalShares;
  var marketPrice = model.input.marketPrice;
  var saccoRate = model.input.saccoRate;
  var rReserve = model.input.allocations.reserve / 100;
  var rEdu = model.input.allocations.education / 100;
  var rDividend = model.input.allocations.dividend / 100;
  var rSocial = model.input.allocations.social / 100;
  var rRetained = model.input.allocations.retained / 100;
  var surplus = model.surplus;
  var amtReserve = model.amounts.reserve;
  var amtEdu = model.amounts.education;
  var amtDividend = model.amounts.dividend;
  var amtSocial = model.amounts.social;
  var amtRetained = model.amounts.retained;
  var myDividend = model.memberDividend;
  var hybridPat = model.hybrid.patronagePct / 100;
  var hybridShare = model.hybrid.sharesPct / 100;
  var avgDividend = model.averageDividend;

`;

function migrate(input) {
  let source = input;
  if (!source.includes('/engines/cooperative-engine.js')) {
    source = source.replace('<script>\nvar coopType', '<script src="/engines/cooperative-engine.js"></script>\n<script>\nvar coopType');
  }
  const start = source.indexOf(START);
  const end = source.indexOf(END, start);
  if (start < 0 || end < 0) throw new Error('Missing Cooperative inline calculation block.');
  return source.slice(0, start) + BLOCK + source.slice(end);
}

function run() {
  const current = fs.readFileSync(PAGE, 'utf8');
  const output = current.includes('COOPERATIVE_LAST_RESULT') ? current : migrate(current);
  if (process.argv.includes('--check')) {
    assert.equal(current, output);
    console.log('PASS Cooperative English shared-engine migration');
  } else {
    fs.writeFileSync(PAGE, output, 'utf8');
    console.log('Migrated Cooperative English workflow to shared engine');
  }
}
if (require.main === module) run();
module.exports = { migrate };
