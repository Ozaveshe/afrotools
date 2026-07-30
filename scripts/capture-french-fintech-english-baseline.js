'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { buildReport } = require('./build-french-free-app-parity-inventory');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4261';
const OUTPUT = path.join(ROOT, 'tests', 'fixtures', 'french-fintech-english-baseline.json');
const SENTINEL_PATH = '/artifacts/fr-fintech-banking-lane-sentinel.txt';
const EXPECTED_SENTINEL = [
  'lane=fr-fintech-banking-parity',
  'branch=codex/fr-fintech-banking-parity',
  'foundation=8ce5cac175e42201968b1f7540752d6acf92d4ca',
  'worktree=C:/Users/Oza/.codex/worktrees/fr-fintech-banking-parity/afrotools',
  'port=4261'
].join('\n');

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

async function verifySentinel(page) {
  const response = await page.request.get(`${BASE_URL}${SENTINEL_PATH}`);
  if (!response.ok()) {
    throw new Error(`Lane sentinel returned ${response.status()} from ${BASE_URL}`);
  }
  const body = (await response.text()).trim();
  if (body !== EXPECTED_SENTINEL) {
    throw new Error(`Lane sentinel mismatch at ${BASE_URL}: ${body}`);
  }
}

async function snapshot(page) {
  return page.evaluate(() => {
    function clean(value) {
      return String(value || '').replace(/\s+/g, ' ').trim();
    }
    const controls = Array.from(document.querySelectorAll(
      'body input:not([type="hidden"]), body select, body textarea'
    )).map((control) => ({
      id: control.id || null,
      name: control.name || null,
      type: control.tagName.toLowerCase() === 'select' ? 'select' : (control.type || control.tagName.toLowerCase()),
      value: control.value,
      checked: typeof control.checked === 'boolean' ? control.checked : null
    }));
    const visibleResults = Array.from(document.querySelectorAll(
      '.results.on, .result.on, .results.show, .result.show, .results[style*="block"], '
      + '[aria-live="polite"], [aria-live="assertive"], .form-error.on'
    )).map((node) => ({
      id: node.id || null,
      className: typeof node.className === 'string' ? node.className : '',
      text: clean(node.textContent)
    })).filter((row) => row.text);
    return { controls, visibleResults };
  });
}

async function primaryAction(page) {
  const buttons = page.locator(
    'body .card button, body button.btn-calc, body button[onclick*="calc"], body button[onclick*="Calc"], '
    + 'body button[onclick*="compare"], body button[onclick*="review"]'
  );
  const count = await buttons.count();
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    if (!await button.isVisible()) continue;
    const label = compact(await button.textContent());
    if (/add|remove|copy|download|export|reset|clear|share|print/i.test(label)) continue;
    return button;
  }
  throw new Error(`No primary calculator action found on ${page.url()}`);
}

async function captureRow(browser, row) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  const requestFailures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(compact(message.text()));
  });
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`.trim());
  });

  try {
    await page.goto(`${BASE_URL}${row.englishRoute}/`, { waitUntil: 'domcontentloaded' });
    const before = await snapshot(page);
    const action = await primaryAction(page);
    await action.click();
    await page.waitForTimeout(50);
    const valid = await snapshot(page);

    const firstNumeric = page.locator(
      'body input[type="number"]:not([disabled]):not([readonly])'
    ).first();
    let invalid = null;
    if (await firstNumeric.count()) {
      await firstNumeric.fill('-1');
      await action.click();
      await page.waitForTimeout(50);
      invalid = await snapshot(page);
    }

    return {
      englishId: row.englishId,
      englishRoute: `${row.englishRoute}/`,
      englishFile: `tools/${row.englishId}/index.html`,
      before,
      valid,
      invalid,
      consoleErrors,
      requestFailures
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const report = buildReport();
  const allRows = report.rows.filter((row) => row.categoryKey === 'fintech');
  const onlyArg = process.argv.find((arg) => arg.startsWith('--ids='));
  const onlyIds = onlyArg ? new Set(onlyArg.slice('--ids='.length).split(',').filter(Boolean)) : null;
  const rows = onlyIds ? allRows.filter((row) => onlyIds.has(row.englishId)) : allRows;
  if (allRows.length !== 31 || (onlyIds && rows.length !== onlyIds.size)) {
    throw new Error(`Expected 31 Fintech & Banking rows and every requested id, found ${allRows.length}/${rows.length}`);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const sentinelPage = await browser.newPage();
    await verifySentinel(sentinelPage);
    await sentinelPage.close();

    const receipts = [];
    for (const row of rows) {
      receipts.push(await captureRow(browser, row));
      process.stdout.write(`captured ${row.englishId}\n`);
    }

    const payload = {
      schemaVersion: 1,
      lane: 'fr-fintech-banking-parity',
      foundation: '8ce5cac175e42201968b1f7540752d6acf92d4ca',
      baseUrl: BASE_URL,
      sentinel: SENTINEL_PATH,
      denominator: rows.length,
      fixturePolicy: 'Synthetic default values from the public English forms; no personal or account data.',
      rows: receipts
    };
    if (process.argv.includes('--check')) {
      const baseline = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
      const comparable = (value) => value.rows.map((row) => ({
        englishId: row.englishId,
        englishRoute: row.englishRoute,
        englishFile: row.englishFile,
        before: row.before,
        valid: row.valid,
        invalid: row.invalid
      }));
      const baselineComparable = comparable(baseline).filter((row) => !onlyIds || onlyIds.has(row.englishId));
      const expected = JSON.stringify(baselineComparable);
      const actual = JSON.stringify(comparable(payload));
      if (actual !== expected) {
        const expectedRows = new Map(baselineComparable.map((row) => [row.englishId, row]));
        const actualRows = comparable(payload);
        const changedIds = actualRows
          .filter((row) => JSON.stringify(row) !== JSON.stringify(expectedRows.get(row.englishId)))
          .map((row) => row.englishId);
        if (process.argv.includes('--diagnostic')) {
          const redact = (value) => JSON.parse(JSON.stringify(value).replace(/\d/g, '#'));
          for (const id of changedIds) {
            process.stderr.write(`${id} redacted expected=${JSON.stringify(redact(expectedRows.get(id)))}\n`);
            process.stderr.write(`${id} redacted actual=${JSON.stringify(redact(actualRows.find((row) => row.englishId === id)))}\n`);
          }
        }
        throw new Error(
          `English Fintech controller behavior changed from the frozen pre-extraction fixture: ${changedIds.join(', ')}.`
        );
      }
      process.stdout.write(`matched ${path.relative(ROOT, OUTPUT)}\n`);
    } else {
      fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
      process.stdout.write(`wrote ${path.relative(ROOT, OUTPUT)}\n`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
