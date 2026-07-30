#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tests/fixtures/tractor-calculator-english-invariants.json');
const PORT = '42980';
const BASE = process.env.TRACTOR_CALCULATOR_BASE_URL || `http://127.0.0.1:${PORT}`;

async function ready() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(`${BASE}/agriculture/tractor-calculator/`)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server unavailable at ${BASE}`);
}

async function capture() {
  const server = process.env.TRACTOR_CALCULATOR_BASE_URL ? null : spawn(process.execPath, ['tests/support/static-server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT },
    stdio: 'ignore',
  });
  try {
    await ready();
    const sentinel = await (await fetch(`${BASE}/tests/fixtures/fr-agriculture-worktree-7e83-sentinel.txt`)).text();
    assert.match(sentinel, /worktree=7e83/);
    assert.match(sentinel, /root=C:\\Users\\Oza\\\.codex\\worktrees\\7e83\\afrotools/);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ locale: 'en-US' });
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
      await page.goto(`${BASE}/agriculture/tractor-calculator/`);
      const owner = await page.evaluate(() => JSON.parse(JSON.stringify(EQUIPMENT_DATA)));
      const countryCodes = Object.keys(owner.countries);
      const equipmentKeys = Object.keys(owner.equipment);
      const defaults = [];
      for (const countryCode of countryCodes) {
        for (const equipmentKey of equipmentKeys) {
          await page.selectOption('#sel-country', countryCode);
          await page.evaluate(() => onCountryChange());
          await page.selectOption('#sel-equip', equipmentKey);
          await page.evaluate(() => onEquipChange());
          defaults.push({
            countryCode,
            equipmentKey,
            values: await page.evaluate(() => ({
              price: Number(document.getElementById('inp-price').value),
              contractRate: Number(document.getElementById('inp-contract-rate').value),
              financeRate: Number(document.getElementById('inp-rate').value),
              financeTerm: Number(document.getElementById('inp-term').value),
              currencyLabel: document.getElementById('currency-label').textContent,
              equipmentHint: document.getElementById('equip-hint').textContent,
              financeHint: document.getElementById('fin-hint').textContent,
            })),
          });
        }
      }
      const arithmetic = await page.evaluate(() => {
        const rows = [];
        const countries = Object.keys(EQUIPMENT_DATA.countries);
        const equipment = Object.keys(EQUIPMENT_DATA.equipment);
        countries.forEach((countryCode, countryIndex) => equipment.forEach((equipmentKey, equipmentIndex) => [5, 7, 10, 15].forEach((years, yearIndex) => [1, 2, 3].forEach(passes => {
          const country = EQUIPMENT_DATA.countries[countryCode];
          const equip = EQUIPMENT_DATA.equipment[equipmentKey];
          const hire = EQUIPMENT_DATA.hireRates[countryCode];
          const price = Math.round(equip.purchasePrice_USD.typical * country.usdRate / 1000) * 1000;
          const farmHa = [0.5, 10, 55, 220][(countryIndex + equipmentIndex + yearIndex + passes) % 4];
          const contractHa = (countryIndex + passes) % 2 ? 0 : 35;
          const finance = EQUIPMENT_DATA.financing[countryCode].options;
          const rate = finance[(equipmentIndex + passes) % finance.length].rate_pct;
          const term = [3, 5, 7, 10][(yearIndex + passes) % 4];
          const downPct = [0, 20, 40][passes - 1];
          const buy = calcBuy(equip, hire, price, farmHa, passes, years, contractHa);
          const hireResult = calcHire(hire, farmHa, passes);
          const lease = calcLease(equip, price, farmHa, passes, years, rate, term, downPct);
          const costs = { buy: buy.totalCost, hire: hireResult ? hireResult.annualCost * years : Infinity, lease: lease.totalCost };
          const winner = Object.keys(costs).reduce((a, b) => costs[a] < costs[b] ? a : b);
          rows.push({
            input: { countryCode, equipmentKey, price, farmHa, passes, years, contractHa, rate, term, downPct },
            output: { buy, hire: hireResult, lease, breakEvenHa: breakEvenHa(buy, hireResult, years, passes), costs, winner },
          });
        }))));
        return rows;
      });
      const domScenarios = [];
      for (let index = 0; index < countryCodes.length * 3; index += 1) {
        const countryCode = countryCodes[index % countryCodes.length];
        const equipmentKey = equipmentKeys[index % equipmentKeys.length];
        const financeType = ['cash', 'loan', 'lease'][Math.floor(index / countryCodes.length)];
        await page.selectOption('#sel-country', countryCode);
        await page.evaluate(() => onCountryChange());
        await page.selectOption('#sel-equip', equipmentKey);
        await page.evaluate(() => onEquipChange());
        await page.check(`[name=finance][value=${financeType}]`);
        await page.evaluate(() => toggleFinance());
        await page.fill('#inp-farm', String([1, 20, 75][index % 3]));
        await page.selectOption('#inp-passes', String((index % 3) + 1));
        await page.evaluate(years => setPeriod(years), [5, 7, 10, 15][index % 4]);
        if (index % 2 === 0) {
          await page.check('[name=contract][value=yes]');
          await page.evaluate(() => toggleContract());
          await page.fill('#inp-contract-ha', String(20 + index));
        } else {
          await page.check('[name=contract][value=no]');
          await page.evaluate(() => toggleContract());
        }
        await page.evaluate(() => calculate());
        domScenarios.push({
          input: { countryCode, equipmentKey, financeType },
          output: await page.evaluate(() => ({
            recommendationClass: document.getElementById('rec-banner').className,
            title: document.getElementById('rec-title').textContent,
            text: document.getElementById('rec-text').textContent,
            saving: document.getElementById('rec-saving').textContent,
            table: document.getElementById('compare-tbody').innerText,
            breakEven: document.getElementById('breakeven-note').innerText,
            hireInfo: document.getElementById('hire-info').innerText,
            contractDisplay: getComputedStyle(document.getElementById('contract-box')).display,
            contractText: document.getElementById('contract-text').textContent,
            financingDisplay: getComputedStyle(document.getElementById('fin-box')).display,
            financingText: document.getElementById('fin-box').innerText,
          })),
        });
      }
      return {
        schemaVersion: 1,
        source: 'agriculture/tractor-calculator/index.html#inline-controller+data/agriculture/equipment-data.js',
        worktreeSentinel: '7e83',
        owner,
        defaults,
        arithmetic,
        domScenarios,
        limitations: ['The accepted controller coerces invalid or empty numeric inputs to fallback values and shows no validation error.'],
      };
    } finally {
      await browser.close();
    }
  } finally {
    if (server) server.kill();
  }
}

(async () => {
  const value = `${JSON.stringify(await capture(), null, 2)}\n`;
  if (process.argv.includes('--check')) {
    assert.equal(fs.readFileSync(OUT, 'utf8'), value);
    console.log('PASS 476 Tractor Calculator English arithmetic/default/display invariants');
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, value, 'utf8');
    console.log('Wrote 476 Tractor Calculator English arithmetic/default/display invariants');
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
