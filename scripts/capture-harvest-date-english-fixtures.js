#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tests/fixtures/harvest-date-english-invariants.json');
const PORT = '42954';
const BASE = process.env.HARVEST_DATE_BASE_URL || `http://127.0.0.1:${PORT}`;

async function capture() {
  const server = process.env.HARVEST_DATE_BASE_URL ? null : spawn(process.execPath, ['tests/support/static-server.js'], {
    cwd: ROOT, env: { ...process.env, PORT }, stdio: 'ignore',
  });
  try {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try { if ((await fetch(`${BASE}/agriculture/harvest-date/`)).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const sentinel = await (await fetch(`${BASE}/tests/fixtures/fr-agriculture-worktree-7e83-sentinel.txt`)).text();
    assert.match(sentinel, /worktree=7e83/);
    assert.match(sentinel, /root=C:\\Users\\Oza\\\.codex\\worktrees\\7e83\\afrotools/);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ locale: 'en-US' });
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
      await page.goto(`${BASE}/agriculture/harvest-date/`);
      const dates = ['2024-02-29', '2025-01-01', '2025-10-25', '2026-04-01', '2027-12-31'];
      const crops = ['maize', 'rice', 'cassava', 'tomato'];
      const days = [0, 1, 80.5, 110, 365, 730];
      const risks = ['low', 'medium', 'high'];
      const scenarios = [];
      for (let index = 0; index < 30; index += 1) {
        const input = {
          plantingDate: dates[index % dates.length],
          crop: crops[index % crops.length],
          maturityDays: days[index % days.length],
          weatherRisk: risks[index % risks.length],
        };
        await page.fill('[name=plantingDate]', input.plantingDate);
        await page.selectOption('[name=crop]', input.crop);
        await page.fill('[name=maturityDays]', String(input.maturityDays));
        await page.selectOption('[name=weatherRisk]', input.weatherRisk);
        await page.getByRole('button', { name: 'Create summary' }).click();
        scenarios.push({
          input,
          output: await page.locator('[data-df-result=harvest-date-estimator]').innerText(),
        });
      }
      await page.fill('[name=plantingDate]', '');
      await page.getByRole('button', { name: 'Create summary' }).click();
      const invalid = await page.locator('[data-df-result=harvest-date-estimator]').innerText();
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      const reset = await page.locator('[data-df-result=harvest-date-estimator]').innerText();
      return { schemaVersion: 1, source: 'assets/js/pages/day6-agriculture-family-calculators.js#harvest-date-estimator', worktreeSentinel: '7e83', scenarios, invalid, reset };
    } finally { await browser.close(); }
  } finally { if (server) server.kill(); }
}

(async () => {
  const value = `${JSON.stringify(await capture(), null, 2)}\n`;
  if (process.argv.includes('--check')) {
    assert.equal(fs.readFileSync(OUT, 'utf8'), value);
    console.log(`PASS ${JSON.parse(value).scenarios.length} Harvest Date English invariants`);
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, value, 'utf8');
    console.log(`Wrote ${JSON.parse(value).scenarios.length} Harvest Date English invariants`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
