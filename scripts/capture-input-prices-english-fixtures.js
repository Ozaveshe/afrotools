#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-agriculture-parity-manifest.json');
const FIXTURE_PATH = path.join(ROOT, 'tests', 'fixtures', 'input-prices-english-parity.json');
const DATA_PATH = path.join(ROOT, 'data', 'agriculture', 'input-prices-data.js');
const CHECK = process.argv.includes('--check');
const UPDATE = process.argv.includes('--update');
const PORT = Number(process.env.INPUT_PRICES_FIXTURE_PORT || 42895);
const BASE_URL = process.env.INPUT_PRICES_FIXTURE_BASE_URL || `http://127.0.0.1:${PORT}`;

if (CHECK === UPDATE) {
  throw new Error('Choose exactly one mode: --update to freeze the current behavior, or --check to compare with the frozen fixture.');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function countryRows() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const rows = manifest.rows.filter(row => row.family === 'input-prices' && row.country);
  assert.equal(rows.length, 15, 'Input Prices fixture capture must cover exactly 15 English country calculators');
  assert.equal(new Set(rows.map(row => row.country.code)).size, 15, 'Input Prices country codes must be unique');
  return rows;
}

function inlineControllerSource(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
  const controller = scripts.find(source => /\bfunction\s+runComparison\s*\(/.test(source));
  if (controller) return { kind: 'legacy-inline-controller', source: controller.trim() };
  const config = scripts.find(source => /\bINPUT_PRICES_PAGE_CONFIG\b/.test(source));
  assert(config, `Unable to locate Input Prices page controller config in ${path.relative(ROOT, filePath)}`);
  return { kind: 'shared-engine-controller', source: config.trim() };
}

function caseMatrix() {
  const cases = [];
  for (const priceMode of ['market', 'subsidized']) {
    for (const inputType of ['all', 'fertilizers', 'seeds', 'agrochemicals']) {
      for (const farmSize of ['0.5', '1', '3.75']) {
        cases.push({ id: `${priceMode}-${inputType}-${farmSize}`, priceMode, inputType, farmSize, cropMode: 'default' });
      }
    }
    cases.push({
      id: `${priceMode}-seeds-supported-2.25`,
      priceMode,
      inputType: 'seeds',
      farmSize: '2.25',
      cropMode: 'first-supported',
    });
    cases.push({
      id: `${priceMode}-seeds-unsupported-2.25`,
      priceMode,
      inputType: 'seeds',
      farmSize: '2.25',
      cropMode: 'unsupported',
    });
  }
  return cases;
}

async function waitForServer(url) {
  let lastError;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Static server did not become ready at ${url}: ${lastError ? lastError.message : 'no response'}`);
}

async function capturePage(page, row) {
  const url = `${BASE_URL}${row.english.route}`;
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onPageError = error => pageErrors.push(error.message);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.runComparison === 'function' && typeof window.INPUT_PRICES === 'object');

  const defaults = await page.evaluate(() => ({
    inputType: document.getElementById('inputType').value,
    crop: document.getElementById('cropSel').value,
    farmSize: document.getElementById('farmSize').value,
    priceMode: document.getElementById('priceType').value,
    cropOptions: [...document.getElementById('cropSel').options].map(option => ({
      value: option.value,
      label: option.textContent.trim(),
    })),
  }));

  const cases = [];
  for (const scenario of caseMatrix()) {
    const result = await page.evaluate(current => {
      const inputType = document.getElementById('inputType');
      const crop = document.getElementById('cropSel');
      const farmSize = document.getElementById('farmSize');
      const priceType = document.getElementById('priceType');
      let temporaryOption = null;

      inputType.value = current.inputType;
      farmSize.value = current.farmSize;
      priceType.value = current.priceMode;
      if (current.cropMode === 'first-supported') {
        const supported = window.INPUT_PRICES[window.COUNTRY].seeds[0].crop;
        if (![...crop.options].some(option => option.value === supported)) {
          temporaryOption = new Option(supported, supported);
          crop.add(temporaryOption);
        }
        crop.value = supported;
      } else if (current.cropMode === 'unsupported') {
        temporaryOption = new Option('Unsupported fixture crop', '__fixture_unsupported_crop__');
        crop.add(temporaryOption);
        crop.value = temporaryOption.value;
      } else {
        crop.value = '';
      }

      window.onTypeChange();
      window.runComparison();

      const normalize = value => value.replace(/\s+/g, ' ').trim();
      const isVisible = element => Boolean(element) && element.style.display !== 'none' && getComputedStyle(element).display !== 'none';
      const table = (id, cardId) => {
        const element = document.getElementById(id);
        return {
          visible: isVisible(document.getElementById(cardId)),
          headings: [...element.querySelectorAll('thead th')].map(cell => normalize(cell.textContent)),
          rows: [...element.querySelectorAll('tbody tr')].map(tableRow => ({
            className: tableRow.className,
            cells: [...tableRow.cells].map(cell => normalize(cell.textContent)),
          })),
          footer: normalize(element.querySelector('tfoot')?.textContent || ''),
        };
      };
      const budgetItems = [...document.querySelectorAll('#budgetSummary .budget-item')].map(item => ({
        className: item.className,
        label: normalize(item.querySelector('.bl')?.textContent || ''),
        value: normalize(item.querySelector('.bv')?.textContent || ''),
      }));

      const captured = {
        selected: {
          inputType: inputType.value,
          crop: crop.value,
          farmSize: farmSize.value,
          priceMode: priceType.value,
          cropMode: current.cropMode,
        },
        cropFieldVisible: isVisible(document.getElementById('cropField')),
        resultsVisible: document.getElementById('results').classList.contains('visible'),
        fertilizer: table('fertTable', 'fertCard'),
        seeds: table('seedTable', 'seedCard'),
        agrochemicals: table('chemTable', 'chemCard'),
        budget: {
          intro: normalize(document.querySelector('#budgetSummary > p')?.textContent || ''),
          items: budgetItems,
          savings: normalize(document.querySelector('#budgetSummary .saving-pill')?.textContent || ''),
        },
        subsidy: normalize(document.getElementById('subsidyAlert').textContent),
        quality: normalize(document.getElementById('qualityTip').textContent),
      };

      if (temporaryOption) temporaryOption.remove();
      return captured;
    }, scenario);
    cases.push({ id: scenario.id, ...result });
  }

  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  return {
    countryCode: row.country.code,
    route: row.english.route,
    file: row.english.file,
    defaults,
    cases,
    runtimeErrors: {
      console: [...new Set(consoleErrors)].sort(),
      page: [...new Set(pageErrors)].sort(),
    },
  };
}

async function capture() {
  const rows = countryRows();
  const sources = rows.map(row => {
    const absoluteFile = path.join(ROOT, row.english.file);
    return {
      countryCode: row.country.code,
      file: row.english.file,
      controllerKind: inlineControllerSource(absoluteFile).kind,
      controllerSha256: sha256(inlineControllerSource(absoluteFile).source),
    };
  });
  const server = process.env.INPUT_PRICES_FIXTURE_BASE_URL
    ? null
    : spawn(process.execPath, ['tests/support/static-server.js'], {
        cwd: ROOT,
        env: { ...process.env, PORT: String(PORT), AFROTOOLS_LOCAL_SKIP_DATA_STORE_WRITES: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
  const browser = await chromium.launch({ headless: true });
  try {
    await waitForServer(`${BASE_URL}/agriculture/input-prices/nigeria`);
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const countries = [];
    for (const row of rows) countries.push(await capturePage(page, row));
    await page.close();
    return {
      schemaVersion: 1,
      family: 'input-prices',
      capturedFrom: {
        dataOwner: path.relative(ROOT, DATA_PATH).replace(/\\/g, '/'),
        dataSha256: sha256(fs.readFileSync(DATA_PATH)),
        pageControllerOwners: sources,
      },
      contract: {
        countryCalculatorCount: 15,
        casesPerCountry: caseMatrix().length,
        modes: ['market', 'subsidized'],
        inputTypes: ['all', 'fertilizers', 'seeds', 'agrochemicals'],
        farmSizes: [0.5, 1, 2.25, 3.75],
        includesSupportedAndUnsupportedCropFallback: true,
      },
      countries,
    };
  } finally {
    await browser.close();
    if (server) server.kill();
  }
}

(async () => {
  const actual = await capture();
  if (UPDATE) {
    fs.mkdirSync(path.dirname(FIXTURE_PATH), { recursive: true });
    fs.writeFileSync(FIXTURE_PATH, `${JSON.stringify(actual, null, 2)}\n`);
    console.log(`Frozen ${actual.countries.length} countries x ${actual.contract.casesPerCountry} cases at ${path.relative(ROOT, FIXTURE_PATH)}`);
    return;
  }

  const expected = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  assert.equal(actual.capturedFrom.dataSha256, expected.capturedFrom.dataSha256, 'Canonical Input Prices data changed after fixture freeze');
  assert.deepEqual(actual.contract, expected.contract);
  assert.deepEqual(actual.countries, expected.countries);
  console.log(`PASS ${actual.countries.length} countries x ${actual.contract.casesPerCountry} English Input Prices black-box cases match the frozen fixture`);
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
