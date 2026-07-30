#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '../agriculture/tractor-calculator/index.html');
let html = fs.readFileSync(file, 'utf8');

function replaceOnce(pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, `${pattern.flags.includes('s') ? 's' : ''}g`));
  assert.equal(matches && matches.length, 1, `Expected one ${label} block`);
  html = html.replace(pattern, replacement);
}

if (!html.includes('window.TRACTOR_CALCULATOR_LAST_RESULT = result;')) {
  replaceOnce(
    /function calcBuy\(equip, hire, price, farmHa, passes, years, contractHa\) \{.*?\n\}\n\n(?=function calcHire)/s,
    `function calcBuy(equip, hire, price, farmHa, passes, years, contractHa) {
  return window.AfroTools.TractorCalculatorEngine.calculateBuy({
    price: price, farmHa: farmHa, passes: passes, years: years, contractHa: contractHa
  }, equip, hire);
}

`,
    'calcBuy',
  );
  replaceOnce(
    /function calcHire\(hire, farmHa, passes\) \{.*?\n\}\n\n(?=function calcLease)/s,
    `function calcHire(hire, farmHa, passes) {
  return window.AfroTools.TractorCalculatorEngine.calculateHire(hire, farmHa, passes);
}

`,
    'calcHire',
  );
  replaceOnce(
    /function calcLease\(equip, price, farmHa, passes, years, rate, term, downPct\) \{.*?\n\}\n\n(?=function breakEvenHa)/s,
    `function calcLease(equip, price, farmHa, passes, years, rate, term, downPct) {
  return window.AfroTools.TractorCalculatorEngine.calculateLease({
    price: price, farmHa: farmHa, passes: passes, years: years, rate: rate, term: term, downPct: downPct
  });
}

`,
    'calcLease',
  );
  replaceOnce(
    /function breakEvenHa\(buy, hire, years, passes\) \{.*?\n\}\n\n(?=function calculate)/s,
    `function breakEvenHa(buy, hire, years, passes) {
  return window.AfroTools.TractorCalculatorEngine.breakEvenHa(buy, hire, years);
}

`,
    'breakEvenHa',
  );
  replaceOnce(
    /  var buyR   = calcBuy\(equip, country\.hire, price, farmHa, passes, years, contractHa\);.*?  var winner = Object\.keys\(costs\)\.reduce\(function\(a,b\)\{ return costs\[a\] < costs\[b\] \? a : b; \}\);\n/s,
    `  var result = window.AfroTools.TractorCalculatorEngine.calculate({
    countryCode: country.code,
    equipmentKey: document.getElementById('sel-equip').value,
    price: price,
    farmHa: farmHa,
    passes: passes,
    years: years,
    financeType: finType,
    rate: rate,
    term: term,
    downPct: downPct,
    doContract: doContract,
    contractHa: contractHa,
    contractRate: contractRate
  }, EQUIPMENT_DATA);
  var buyR = result.buy;
  var hireR = result.hire;
  var leaseR = result.lease;
  var costs = result.costs;
  var winner = result.winner;
  window.TRACTOR_CALCULATOR_LAST_RESULT = result;
`,
    'calculate delegation',
  );
  fs.writeFileSync(file, html, 'utf8');
}

assert.match(html, /TractorCalculatorEngine\.calculate\(/);
assert.doesNotMatch(html, /var annualFuel = equip\.fuelConsumption_L_hr/);
console.log('Tractor Calculator English controller delegates to the shared DOM-free engine.');
