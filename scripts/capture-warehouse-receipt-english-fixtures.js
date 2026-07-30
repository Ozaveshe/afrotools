#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tests/fixtures/warehouse-receipt-english-invariants.json');
const PORT = '42971';
const BASE = process.env.WAREHOUSE_RECEIPT_BASE_URL || `http://127.0.0.1:${PORT}`;
async function ready() {
  for (let index = 0; index < 50; index += 1) {
    try { if ((await fetch(`${BASE}/agriculture/warehouse-receipt/`)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server unavailable at ${BASE}`);
}
async function snapshot(page) {
  return page.evaluate(() => ({
    grainValue: document.getElementById('res-grain-value').innerText,
    loanAmount: document.getElementById('res-loan-amount').innerText,
    ltv: document.getElementById('res-ltv-pct').innerText,
    quantity: document.getElementById('res-quantity').innerText,
    costs: document.getElementById('cost-rows').innerText,
    expectedPrice: document.getElementById('res-expected-price').innerText,
    saleRevenue: document.getElementById('res-sale-revenue').innerText,
    totalCost: document.getElementById('res-repayment').innerText,
    netProceeds: document.getElementById('res-net-proceeds').innerText,
    comparison: document.getElementById('comparison-output').innerText,
    breakEven: document.getElementById('breakeven-output').innerText,
    error: document.getElementById('calc-error').innerText,
    resultsDisplay: getComputedStyle(document.getElementById('results')).display,
  }));
}
async function capture() {
  const server = process.env.WAREHOUSE_RECEIPT_BASE_URL ? null : spawn(process.execPath, ['tests/support/static-server.js'], { cwd: ROOT, env: { ...process.env, PORT }, stdio: 'ignore' });
  try {
    await ready();
    const sentinel = await (await fetch(`${BASE}/tests/fixtures/fr-agriculture-worktree-7e83-sentinel.txt`)).text();
    assert.match(sentinel, /worktree=7e83/);
    assert.match(sentinel, /root=C:\\Users\\Oza\\\.codex\\worktrees\\7e83\\afrotools/);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ locale: 'en-US' });
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
      await page.goto(`${BASE}/agriculture/warehouse-receipt/`);
      const countries = await page.locator('#inp-country option').evaluateAll(options => options.map(option => option.value).filter(Boolean));
      const commodities = await page.locator('#inp-commodity option').evaluateAll(options => options.map(option => option.value));
      const scenarios = [];
      for (let index = 0; index < countries.length * 2; index += 1) {
        const countryCode = countries[index % countries.length];
        const commodity = commodities[(index * 3) % commodities.length];
        await page.selectOption('#inp-country', countryCode);
        await page.selectOption('#inp-commodity', commodity);
        const defaults = await page.evaluate(() => ({
          ltvPct: Number(document.getElementById('inp-ltv').value),
          annualRatePct: Number(document.getElementById('inp-rate').value),
          storagePerTonneMonth: Number(document.getElementById('inp-storage-cost').value),
          insuranceAnnualPct: Number(document.getElementById('inp-insurance').value),
          handlingPerTonne: Number(document.getElementById('inp-handling').value),
          priceIncreasePct: Number(document.getElementById('inp-price-increase').value),
        }));
        const input = {
          countryCode, commodity,
          quantityTonnes: [0.5, 5, 20, 125.75][index % 4],
          harvestPricePerTonne: [700, 85000, 235000, 1200000][index % 4],
          periodMonths: [1, 4, 7, 12][index % 4],
          ...defaults,
        };
        await page.evaluate(value => {
          const values = {
            'inp-quantity': value.quantityTonnes, 'inp-price': value.harvestPricePerTonne,
            'inp-ltv': value.ltvPct, 'inp-rate': value.annualRatePct, 'inp-period': value.periodMonths,
            'inp-storage-cost': value.storagePerTonneMonth, 'inp-insurance': value.insuranceAnnualPct,
            'inp-handling': value.handlingPerTonne, 'inp-price-increase': value.priceIncreasePct,
          };
          Object.entries(values).forEach(([id, number]) => { document.getElementById(id).value = String(number); });
          calculate();
        }, input);
        scenarios.push({ input, output: await snapshot(page) });
        await page.evaluate(() => resetForm());
      }
      const errors = [];
      for (const value of [
        { name: 'country', countryCode: '', quantityTonnes: 1, harvestPricePerTonne: 1 },
        { name: 'quantity', countryCode: 'NG', quantityTonnes: 0, harvestPricePerTonne: 1 },
        { name: 'price', countryCode: 'NG', quantityTonnes: 1, harvestPricePerTonne: 0 },
      ]) {
        await page.selectOption('#inp-country', value.countryCode);
        await page.fill('#inp-quantity', String(value.quantityTonnes));
        await page.fill('#inp-price', String(value.harvestPricePerTonne));
        await page.evaluate(() => calculate());
        errors.push({ name: value.name, output: await snapshot(page) });
      }
      return { schemaVersion: 1, source: 'agriculture/warehouse-receipt/index.html#inline-controller+embedded-data', worktreeSentinel: '7e83', countries, commodities, scenarios, errors };
    } finally { await browser.close(); }
  } finally { if (server) server.kill(); }
}
(async () => {
  const value = `${JSON.stringify(await capture(), null, 2)}\n`;
  if (process.argv.includes('--check')) {
    assert.equal(fs.readFileSync(OUT, 'utf8'), value);
    console.log('PASS 27 Warehouse Receipt English invariants');
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, value, 'utf8');
    console.log('Wrote 27 Warehouse Receipt English invariants');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
