'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const pdfParse = require('pdf-parse');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

async function download(page, action) {
  const pending = page.waitForEvent('download'); await action();
  return fs.readFileSync(await (await pending).path());
}
function zipEntries(bytes) {
  const entries = []; let position = 0;
  while (position + 30 <= bytes.length && bytes.readUInt32LE(position) === 0x04034b50) {
    const size = bytes.readUInt32LE(position + 18), nameSize = bytes.readUInt16LE(position + 26), extra = bytes.readUInt16LE(position + 28);
    const start = position + 30 + nameSize + extra;
    expect(bytes.readUInt16LE(position + 8)).toBe(0);
    expect(start + size <= bytes.length).toBe(true);
    entries.push({ name: bytes.subarray(position + 30, position + 30 + nameSize).toString('utf8'), bytes: bytes.subarray(start, start + size) });
    position = start + size;
  }
  expect(entries.length).toBeGreaterThan(0); return entries;
}

test('invoice: cookie refusal remains reachable at 320 and 390', async ({ browser }) => {
  // The normal verification adapter disables lazy-analytics and its consent
  // loader. Use the real first-party loader; external requests stay blocked.
  const port = await new Promise(resolve => {
    const probe = net.createServer().listen(0, '127.0.0.1', () => {
      const value = probe.address().port;
      probe.close(() => resolve(value));
    });
  });
  const server = spawn(process.execPath, ['tests/support/static-server.js'], {
    cwd: path.resolve(__dirname, '../..'), windowsHide: true,
    env: { ...process.env, PORT: String(port), AFROTOOLS_TEST_DISABLE_ANALYTICS: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Consent proof server did not start')), 10000);
      server.stdout.once('data', () => { clearTimeout(timer); resolve(); });
      server.once('error', error => { clearTimeout(timer); reject(error); });
      server.once('exit', () => { clearTimeout(timer); reject(new Error('Consent proof server exited')); });
    });
    for (const width of [320, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, serviceWorkers: 'block', storageState: { cookies: [], origins: [] } });
    try {
    const page = await context.newPage();
    const origin = 'http://127.0.0.1:' + port;
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(origin + '/sw/zana/kizalishaji-ankara/');
    const decline = page.locator('#afro-cc-decline');
    await expect(decline).toBeVisible();
    // A normal user click must work with the actual sticky toolbar in place.
    await decline.click({ timeout: 10000 });
    await expect(page.locator('#afro-cookie-consent')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('afrotools_cookie_consent'))).toBe('declined');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    } finally { await context.close(); }
    }
  } finally {
    server.kill();
    await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve));
  }
});

async function cv(page, baseURL) {
  const sends = [];
  // Follow the existing optional-section print confirmation with synthetic data.
  page.on('dialog', dialog => dialog.accept());
  page.on('request', request => {
    const content = decodeURIComponent(request.url()) + ' ' + (request.postData() || '');
    if (['BOUND-SW-CV', 'fixture@example.test'].some(value => content.includes(value))) sends.push('private-fixture-sent');
  });
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.fulfill({ status: 204 }));
  await page.goto('/sw/zana/mjenzi-cv/');
  await page.waitForFunction(() => window.CVExportUpgrade && window.CVJobTracker && window.CVApplicationPackExport);
  await page.locator('.cv-flow-hero-actions [data-cv-flow-action="build"]').click();
  await page.evaluate(setCvFixture);
  return sends;
}

function setCvFixture() {
  const state = window.CVApp.getState();
  Object.assign(state.data, { fn: 'BOUND-SW-CV', ln: 'Māori', title: 'Synthetic Engineer', email: 'fixture@example.test', summary: 'Synthetic authored summary.' });
  state.template = 'ats-classic'; window.CVApp.renderAll();
}

test('CV: TXT CSV and print adapter preserve authored values', async ({ page, baseURL }) => {
  test.setTimeout(90000);
  const sends = await cv(page, baseURL);
  const txt = await download(page, () => page.evaluate(() => window.CVExportUpgrade.exportText()));
  expect(txt.toString('utf8').includes('BOUND-SW-CV Māori')).toBe(true);
  // Seed a synthetic saved lead before reload: this tests persisted CSV data,
  // without claiming the separately pending in-memory tracker refresh works.
  await page.evaluate(() => localStorage.setItem('afro_cv_job_pipeline', JSON.stringify([{ id: 'bound-fixture', jobTitle: 'Synthetic, Engineer', company: 'BOUND-SW-CV', country: 'KE', status: 'saved', notes: 'Synthetic "quoted" note' }])));
  await page.reload(); await page.waitForFunction(() => window.CVJobTracker);
  const build = page.locator('.cv-flow-hero-actions [data-cv-flow-action="build"]');
  if (await build.isVisible()) await build.click();
  // This module-button adapter verifies downloaded CSV bytes independently of
  // full tracker navigation, which remains a declared workflow review gap.
  const csv = await download(page, () => page.evaluate(() => document.querySelector('[data-tracker-export]').click()));
  const text = csv.toString('utf8');
  expect(text.split('\n').length).toBe(2);
  expect(text.split('\n')[0].split(',').length).toBe(15);
  expect(text.includes('"Synthetic, Engineer"')).toBe(true);
  expect(text.includes('"Synthetic ""quoted"" note"')).toBe(true);
  expect(text.includes('BOUND-SW-CV')).toBe(true);
  await page.evaluate(setCvFixture);
  await page.evaluate(() => {
    const open = window.open;
    window.open = function () {
      const popup = open.apply(window, arguments); popup.print = function () {}; return popup;
    };
  });
  const pending = page.waitForEvent('popup', { timeout: 15000 });
  await page.evaluate(() => window.CVExportUpgrade.printCv());
  const popup = await pending;
  // Matches the French print-window boundary. Native OS print execution and
  // printed page layout remain pending, rather than inferred from a popup.
  await expect.poll(async () => (await popup.locator('body').innerText()).includes('BOUND-SW-CV')).toBe(true);
  await expect(popup.locator('link[href="/assets/css/design-system.css"]')).toHaveCount(1);
  await popup.close(); expect(sends).toEqual([]);
});

test('CV: downloaded application ZIP contains valid reopened PDFs and backup', async ({ page, baseURL }) => {
  test.setTimeout(90000);
  const sends = await cv(page, baseURL);
  const archive = await download(page, () => page.evaluate(() => window.CVApplicationPackExport.download()));
  const entries = zipEntries(archive), pdfs = entries.filter(entry => entry.name.endsWith('.pdf'));
  expect(pdfs.length).toBeGreaterThanOrEqual(2);
  for (const entry of pdfs) {
    expect(entry.bytes.subarray(0, 5).toString('ascii') === '%PDF-').toBe(true);
    const parsed = await pdfParse(new Uint8Array(entry.bytes)); expect(parsed.numpages).toBeGreaterThan(0);
    if (entry.name.includes('-ats-plain-')) expect(parsed.text.includes('BOUND-SW-CV Māori')).toBe(true);
  }
  const backup = JSON.parse(entries.find(entry => entry.name.endsWith('-backup.json')).bytes.toString('utf8'));
  expect(backup.data.fn === 'BOUND-SW-CV').toBe(true);
  expect(backup.data.ln === 'Māori').toBe(true); expect(sends).toEqual([]);
});
