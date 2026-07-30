#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tests/fixtures/crop-insurance-hub-english-invariants.json');
const PORT = '42982';
const BASE = process.env.CROP_INSURANCE_HUB_BASE_URL || `http://127.0.0.1:${PORT}`;

async function ready() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(`${BASE}/agriculture/crop-insurance/`)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server unavailable at ${BASE}`);
}

async function capture() {
  const server = process.env.CROP_INSURANCE_HUB_BASE_URL ? null : spawn(process.execPath, ['tests/support/static-server.js'], {
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
      await page.goto(`${BASE}/agriculture/crop-insurance/`);
      const calculations = await page.evaluate(() => {
        const rows = [];
        ['NGN', 'KES', 'GHS', 'ZAR'].forEach(currency => {
          [0, 1, 750000, 12500000, 999999999.99].forEach(farmValue => {
            [0, 2.5, 5, 100].forEach(premiumRate => {
              [0, 10, 25, 100].forEach(excess => {
                const input = { currency, farmValue, premiumRate, excess };
                rows.push({
                  input,
                  output: window.AfroTools.day6AgricultureFamilyCalculators.calculate('crop-insurance', input),
                });
              });
            });
          });
        });
        return rows;
      });
      const validation = await page.evaluate(() => {
        const api = window.AfroTools.day6AgricultureFamilyCalculators;
        const form = { checkValidity: () => true };
        return [
          { input: { farmValue: NaN }, output: api.validate(form, { farmValue: NaN }) },
          { input: { farmValue: -1 }, output: api.validate(form, { farmValue: -1 }) },
          { input: { premiumRate: 101 }, output: api.validate(form, { premiumRate: 101 }) },
          { input: { excess: 101 }, output: api.validate(form, { excess: 101 }) },
        ];
      });
      const owner = await page.evaluate(() => JSON.parse(JSON.stringify(window.AfroTools.cropInsuranceData)));
      const cards = await page.locator('#hubMain .country-card').evaluateAll(nodes => nodes.map(node => ({
        name: node.querySelector('.name').textContent,
        programs: node.querySelector('.programs-count').textContent,
        href: node.getAttribute('href'),
      })));
      const regions = await page.locator('#hubMain .region-section').evaluateAll(nodes => nodes.map(node => ({
        label: node.querySelector('.region-label').textContent,
        countries: Array.from(node.querySelectorAll('.country-card .name'), item => item.textContent),
      })));
      const form = page.locator('[data-df-form="crop-insurance"]');
      await form.locator('[name=currency]').selectOption('NGN');
      await form.locator('[name=farmValue]').fill('750000');
      await form.locator('[name=premiumRate]').fill('5');
      await form.locator('[name=excess]').fill('10');
      await form.getByRole('button', { name: 'Estimate cover' }).click();
      const workflow = {
        result: await page.locator('[data-df-result="crop-insurance"]').textContent(),
      };
      await form.locator('[name=farmValue]').fill('800000');
      workflow.changed = await page.locator('[data-df-result="crop-insurance"]').textContent();
      await form.getByRole('button', { name: 'Reset' }).click();
      await page.waitForTimeout(0);
      workflow.reset = await page.locator('[data-df-result="crop-insurance"]').textContent();
      return {
        schemaVersion: 1,
        source: 'assets/js/pages/day6-agriculture-family-calculators.js#crop-insurance+data/agriculture/crop-insurance-data.js',
        worktreeSentinel: '7e83',
        calculations,
        validation,
        owner,
        cards,
        regions,
        workflow,
        limitations: ['The accepted hub calculation is generic and does not consume country programme rates, subsidies, deductibles or payout rules.'],
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
    console.log('PASS 320 Crop Insurance calculations, 4 validations and 15 country-directory invariants');
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, value, 'utf8');
    console.log('Wrote 320 Crop Insurance calculations, 4 validations and 15 country-directory invariants');
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
