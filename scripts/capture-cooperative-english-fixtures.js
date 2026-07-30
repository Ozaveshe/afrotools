#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tests/fixtures/cooperative-english-invariants.json');
const PORT = '42969';
const BASE = process.env.COOPERATIVE_BASE_URL || `http://127.0.0.1:${PORT}`;

const SUCCESS_SCENARIOS = [
  { coopType: 'agri', method: 'patronage', revenue: 10000000, expenses: 6500000, members: 120, myProduce: 1200, totalProduce: 85000, myShares: 50000, totalShares: 3500000, marketPrice: 450, saccoRate: 0, hybridPatPct: 50, allocations: [25, 5, 50, 5, 15] },
  { coopType: 'multi', method: 'shares', revenue: 9754321, expenses: 3123456, members: 87, myProduce: 0, totalProduce: 0, myShares: 73500, totalShares: 2230000, marketPrice: 0, saccoRate: 0, hybridPatPct: 50, allocations: [20, 7, 55, 3, 15] },
  { coopType: 'agri', method: 'hybrid', revenue: 24000000, expenses: 17750000, members: 340, myProduce: 2750, totalProduce: 190000, myShares: 92000, totalShares: 6800000, marketPrice: 310, saccoRate: 0, hybridPatPct: 35, allocations: [30, 5, 45, 5, 15] },
  { coopType: 'agri', method: 'hybrid', revenue: 1200000, expenses: 1200000, members: 12, myProduce: 100, totalProduce: 0, myShares: 2500, totalShares: 100000, marketPrice: 90, saccoRate: 0, hybridPatPct: 100, allocations: [25, 5, 50, 5, 15] },
  { coopType: 'sacco', method: 'shares', revenue: 8500000, expenses: 4900000, members: 450, myProduce: 0, totalProduce: 0, myShares: 180000, totalShares: 15000000, marketPrice: 0, saccoRate: 12.5, hybridPatPct: 50, allocations: [25, 5, 50, 5, 15] },
  { coopType: 'sacco', method: 'hybrid', revenue: 2500000.5, expenses: 1400000.25, members: 41, myProduce: 0, totalProduce: 0, myShares: 15500.75, totalShares: 900000.25, marketPrice: 0, saccoRate: 7.25, hybridPatPct: 0, allocations: [10.2, 4.2, 60.2, 5.2, 20.2] },
];

const ERROR_SCENARIOS = [
  { name: 'missing-revenue', input: { coopType: 'agri', method: 'patronage', revenue: 0, expenses: 1, members: 1, totalProduce: 1, allocations: [25, 5, 50, 5, 15] } },
  { name: 'missing-members', input: { coopType: 'agri', method: 'patronage', revenue: 10, expenses: 1, members: 0, totalProduce: 1, allocations: [25, 5, 50, 5, 15] } },
  { name: 'rounded-allocation-rejected', input: { coopType: 'agri', method: 'patronage', revenue: 10, expenses: 1, members: 1, totalProduce: 1, allocations: [25, 5, 49.4, 5, 15] } },
  { name: 'rounded-allocation-accepted', input: { coopType: 'agri', method: 'patronage', revenue: 10, expenses: 1, members: 1, totalProduce: 1, allocations: [25, 5, 49.6, 5, 15] } },
  { name: 'negative-surplus', input: { coopType: 'agri', method: 'patronage', revenue: 10, expenses: 11, members: 1, totalProduce: 1, allocations: [25, 5, 50, 5, 15] } },
  { name: 'patronage-no-total', input: { coopType: 'agri', method: 'patronage', revenue: 10, expenses: 1, members: 1, totalProduce: 0, allocations: [25, 5, 50, 5, 15] } },
  { name: 'shares-no-total', input: { coopType: 'sacco', method: 'shares', revenue: 10, expenses: 1, members: 1, totalShares: 0, allocations: [25, 5, 50, 5, 15] } },
  { name: 'hybrid-no-totals', input: { coopType: 'multi', method: 'hybrid', revenue: 10, expenses: 1, members: 1, totalProduce: 0, totalShares: 0, allocations: [25, 5, 50, 5, 15] } },
];

async function ready() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(`${BASE}/agriculture/cooperative-calculator/`)).ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server unavailable at ${BASE}.`);
}

async function setScenario(page, value) {
  const input = {
    revenue: 0, expenses: 0, members: 0, myProduce: 0, totalProduce: 0,
    myShares: 0, totalShares: 0, marketPrice: 0, saccoRate: 0,
    hybridPatPct: 50, allocations: [25, 5, 50, 5, 15], ...value,
  };
  await page.evaluate(v => {
    const typeButton = [...document.querySelectorAll('.coop-tab')].find(button => button.getAttribute('onclick').includes(`'${v.coopType}'`));
    setCoopType(v.coopType, typeButton);
    const methodCard = [...document.querySelectorAll('.method-card')].find(card => card.getAttribute('onclick').includes(`'${v.method}'`));
    setMethod(v.method, methodCard);
    const fields = {
      'inp-revenue': v.revenue, 'inp-expenses': v.expenses, 'inp-members': v.members,
      'inp-my-produce': v.myProduce, 'inp-total-produce': v.totalProduce,
      'inp-my-shares': v.myShares, 'inp-total-shares': v.totalShares,
      'inp-market-price': v.marketPrice, 'inp-sacco-rate': v.saccoRate,
    };
    Object.entries(fields).forEach(([id, number]) => { document.getElementById(id).value = String(number); });
    document.getElementById('hybrid-range').value = String(v.hybridPatPct);
    ['alloc-reserve', 'alloc-edu', 'alloc-dividend', 'alloc-social', 'alloc-retained']
      .forEach((id, index) => { document.getElementById(id).value = String(v.allocations[index]); });
    updateAllocTotal();
    updateHybridLabel();
  }, input);
  return input;
}

async function snapshot(page) {
  return page.evaluate(() => ({
    error: document.getElementById('calc-error').textContent,
    errorDisplay: document.getElementById('calc-error').style.display,
    resultsDisplay: getComputedStyle(document.getElementById('results')).display,
    summary: document.getElementById('res-summary').innerText,
    allocation: document.getElementById('alloc-table-body').innerText,
    dividend: document.getElementById('res-your-dividend').innerText,
    perUnit: document.getElementById('res-per-unit').innerText,
    saccoDisplay: document.getElementById('res-sacco-box').style.display,
    sacco: document.getElementById('res-sacco-stats').innerText,
    comparisonDisplay: document.getElementById('res-comparison-card').style.display,
    comparison: document.getElementById('res-comparison').innerText,
  }));
}

async function capture() {
  const server = process.env.COOPERATIVE_BASE_URL ? null : spawn(process.execPath, ['tests/support/static-server.js'], {
    cwd: ROOT, env: { ...process.env, PORT }, stdio: 'ignore',
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
      await page.goto(`${BASE}/agriculture/cooperative-calculator/`);
      const successful = [];
      for (const scenario of SUCCESS_SCENARIOS) {
        const input = await setScenario(page, scenario);
        await page.evaluate(() => calcDividend());
        successful.push({ input, output: await snapshot(page) });
        await page.evaluate(() => resetCalc());
      }
      const errors = [];
      for (const scenario of ERROR_SCENARIOS) {
        const input = await setScenario(page, scenario.input);
        await page.evaluate(() => calcDividend());
        errors.push({ name: scenario.name, input, output: await snapshot(page) });
        await page.evaluate(() => resetCalc());
      }
      return {
        schemaVersion: 1,
        source: 'agriculture/cooperative-calculator/index.html#inline-controller',
        worktreeSentinel: '7e83',
        successful,
        errors,
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
    console.log(`PASS ${SUCCESS_SCENARIOS.length + ERROR_SCENARIOS.length} Cooperative English invariants`);
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, value, 'utf8');
    console.log(`Wrote ${SUCCESS_SCENARIOS.length + ERROR_SCENARIOS.length} Cooperative English invariants`);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
