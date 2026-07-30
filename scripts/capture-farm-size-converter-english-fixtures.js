#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tests/fixtures/farm-size-converter-english-invariants.json');
const PORT = '42952';
const BASE = process.env.FARM_SIZE_BASE_URL || `http://127.0.0.1:${PORT}`;
const SENTINEL = '/tests/fixtures/fr-agriculture-worktree-7e83-sentinel.txt';

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/agriculture/farm-size-converter/`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Farm Size fixture server did not start at ${BASE}.`);
}

async function capture() {
  const server = process.env.FARM_SIZE_BASE_URL
    ? null
    : spawn(process.execPath, ['tests/support/static-server.js'], {
        cwd: ROOT,
        env: { ...process.env, PORT },
        stdio: 'ignore',
      });
  try {
    await waitForServer();
    const sentinel = await (await fetch(`${BASE}${SENTINEL}`)).text();
    assert.match(sentinel, /worktree=7e83/);
    assert.match(sentinel, /root=C:\\Users\\Oza\\\.codex\\worktrees\\7e83\\afrotools/);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ locale: 'en-US' });
      await page.goto(`${BASE}/agriculture/farm-size-converter/`);
      const catalog = await page.evaluate(() => ({
        unitKeys: Object.keys(window.LAND_UNITS),
        units: window.LAND_UNITS,
        categoryLabels: window.CATEGORY_LABELS,
        keyRefs: window.KEY_REFS,
        fromGroups: [...document.querySelectorAll('#fromUnit optgroup')].map(group => ({
          label: group.label,
          options: [...group.querySelectorAll('option')].map(option => ({
            value: option.value,
            text: option.textContent,
          })),
        })),
      }));
      const pairs = [
        ['hectare', 'acre'], ['acre', 'hectare'], ['sqm', 'sqkm'], ['sqkm', 'sqm'],
        ['sqft', 'sqm'], ['plot_ng_standard', 'hectare'], ['plot_ng_450', 'acre'],
        ['plot_ng_460', 'sqm'], ['plot_ng_930', 'football_pitch'], ['feddan', 'hectare'],
        ['kirat', 'feddan'], ['sahm', 'kirat'], ['qasaba', 'sqm'], ['morgen', 'acre'],
        ['timad', 'hectare'], ['tseri', 'acre'], ['gasha', 'sqkm'], ['kert', 'sqm'],
        ['arpent', 'hectare'], ['perche_sq', 'arpent'], ['rope_gh', 'acre'],
        ['polo_gh', 'hectare'], ['are', 'sqm'], ['corde_sn', 'hectare'],
        ['football_pitch', 'hectare'], ['tennis_court', 'sqm'],
        ['basketball_court', 'football_pitch'],
      ];
      const amounts = [0, 0.000001, 0.25, 1, 2.5, 17, 1000, 2500000];
      const scenarios = [];
      for (let index = 0; index < pairs.length; index += 1) {
        const [from, to] = pairs[index];
        const amount = amounts[index % amounts.length];
        await page.fill('#inputVal', String(amount));
        await page.selectOption('#fromUnit', from);
        await page.selectOption('#toUnit', to);
        await page.click('#convertBtn');
        const output = await page.evaluate(() => ({
          eqFrom: document.querySelector('#eqFrom').textContent,
          eqVal: document.querySelector('#eqVal').textContent,
          eqUnit: document.querySelector('#eqUnit').textContent,
          eqContext: document.querySelector('#eqContext').textContent,
          countryContext: document.querySelector('#countryCtx').innerText,
          countryContextDisplay: document.querySelector('#countryCtx').style.display,
          fromNote: document.querySelector('#fromNote').textContent,
          toNote: document.querySelector('#toNote').textContent,
          tiles: [...document.querySelectorAll('#resultGrid .result-tile')].map(tile => ({
            className: tile.className,
            text: tile.innerText,
          })),
          table: [...document.querySelectorAll('#refTableBody tr')].map(row =>
            [...row.cells].map(cell => cell.innerText)
          ),
        }));
        scenarios.push({ input: { amount, from, to }, output });
      }
      await page.selectOption('#fromUnit', 'feddan');
      await page.selectOption('#toUnit', 'acre');
      await page.click('#swapBtn');
      const swap = await page.evaluate(() => ({
        from: document.querySelector('#fromUnit').value,
        to: document.querySelector('#toUnit').value,
        fromNote: document.querySelector('#fromNote').textContent,
        toNote: document.querySelector('#toNote').textContent,
      }));
      await page.fill('#inputVal', '-1');
      await page.click('#convertBtn');
      const invalid = await page.evaluate(() => ({
        focusedId: document.activeElement.id,
        eqVal: document.querySelector('#eqVal').textContent,
      }));
      return {
        schemaVersion: 1,
        source: 'agriculture/farm-size-converter/index.html#inline-controller',
        worktreeSentinel: '7e83',
        catalog,
        scenarios,
        swap,
        invalid,
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
    console.log(`PASS ${JSON.parse(value).scenarios.length} Farm Size English invariants`);
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, value, 'utf8');
    console.log(`Wrote ${JSON.parse(value).scenarios.length} Farm Size English invariants`);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
