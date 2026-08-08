const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const inventory = require('../../reports/swahili-free-app-parity-inventory.json');
const { SW_ENERGY_REMAINING_APPS } = require('../../scripts/lib/sw-energy-remaining-contract');

const categoryKeys = new Set(['engineering', 'energy', 'transport']);
const assigned = inventory.rows.filter((row) => categoryKeys.has(row.categoryKey) && !row.accepted);
const physical = assigned.filter((row) => row.primarySwahiliRoute);

function auditPage(page) {
  const evidence = { errors: [], inputNetwork: [] };
  page.on('pageerror', (error) => evidence.errors.push(`pageerror:${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource: net::ERR_FAILED/.test(message.text())) {
      evidence.errors.push(`console:${message.text()}`);
    }
  });
  page.on('request', (request) => {
    if (['fetch', 'xhr', 'beacon'].includes(request.resourceType())) evidence.inputNetwork.push(request.url());
  });
  return evidence;
}

async function assertNoOverflow(page, width, fontScale) {
  await page.setViewportSize({ width, height: 820 });
  await page.evaluate((scale) => { document.documentElement.style.fontSize = scale; }, fontScale);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

for (const row of physical) {
  test(`${row.categoryKey}:${row.englishId} has a native route and mobile/reflow-safe shell`, async ({ page }) => {
    const evidence = auditPage(page);
    await page.route(/^https?:\/\/(?!127\.0\.0\.1:4198)/, (route) => route.abort());
    await page.goto(`${row.primarySwahiliRoute}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', /^sw(?:-|$)/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${row.primarySwahiliRoute}/`);
    await expect(page.locator('iframe')).toHaveCount(0);
    await assertNoOverflow(page, 320, '100%');
    await assertNoOverflow(page, 375, '100%');
    await assertNoOverflow(page, 640, '200%');
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    expect(evidence.errors).toEqual([]);
  });
}

async function downloadArtifact(page, selector) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator(selector).click()
  ]);
  // download.path() resolves only after Playwright has closed the artifact.
  // Reading the live stream could expose an incomplete PDF to the parser.
  const file = await download.path();
  return { file, buffer: fs.readFileSync(file) };
}

async function downloadBuffer(page, selector) {
  return (await downloadArtifact(page, selector)).buffer;
}

for (const app of SW_ENERGY_REMAINING_APPS) {
  test(`energy:${app.id} calculates, rejects invalid input, resets, themes, and parses every export`, async ({ page }) => {
    const evidence = auditPage(page);
    await page.route(/^https?:\/\/(?!127\.0\.0\.1:4198)/, (route) => route.abort());
    await page.goto(app.swRoute);
    await page.getByRole('button', { name: 'Kokotoa', exact: true }).click();
    await expect(page.locator('#results')).toBeVisible();

    const jsonBuffer = await downloadBuffer(page, '[data-export="json"]');
    const record = JSON.parse(jsonBuffer.toString('utf8'));
    expect(record.toolId).toBe(app.id);
    expect(record.locale).toBe('sw');
    expect(record.liveData).toBe(false);
    await page.locator('#importJson').setInputFiles({ name: `${app.id}.json`, mimeType: 'application/json', buffer: jsonBuffer });
    await expect(page.locator('#formStatus')).toContainText('Faili imefunguliwa tena');

    const csvBuffer = await downloadBuffer(page, '[data-export="csv"]');
    expect(csvBuffer.toString('utf8')).toContain('"kipimo","thamani"');
    const txtBuffer = await downloadBuffer(page, '[data-export="txt"]');
    expect(txtBuffer.toString('utf8')).toContain('Faragha:');
    const pdfArtifact = await downloadArtifact(page, '[data-export="pdf"]');
    const pdfBuffer = pdfArtifact.buffer;
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
    const parsedPdf = JSON.parse(execFileSync(process.execPath, [path.resolve(__dirname, '../support/parse-pdf-download.js'), pdfArtifact.file], { encoding: 'utf8' }));
    expect(parsedPdf.numpages).toBeGreaterThan(0);

    const firstNumber = page.locator('#energyForm input[type="number"]').first();
    await firstNumber.fill('-1');
    await page.getByRole('button', { name: 'Kokotoa', exact: true }).click();
    await expect(page.locator('#results')).toBeHidden();
    await page.getByRole('button', { name: 'Weka upya', exact: true }).click();
    await expect(page.locator('#formStatus')).toContainText('zimerejeshwa');

    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.locator('[data-theme-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(after).not.toBe(before);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    expect(evidence.inputNetwork).toEqual([]);
    expect(evidence.errors).toEqual([]);
  });
}

test('transport:car-import-cost keeps invalid inputs local and exposes production reset/exports', async ({ page }) => {
  const evidence = auditPage(page);
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4198)/, (route) => route.abort());
  await page.goto('/sw/zana/gharama-kuagiza-gari/');
  await expect(page.locator('#carImportApp')).toBeVisible();
  await expect(page.locator('#carImportForm')).toBeVisible();
  await page.locator('#carImportForm input[type="number"]').first().fill('-1');
  await page.locator('#carImportForm').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await expect(page.locator('#carImportResults')).toBeHidden();
  await expect(page.locator('#swCarImportError')).toContainText('batili');
  await expect(page.locator('#carImportReset')).toBeVisible();
  await page.locator('#carImportReset').click();
  await page.locator('#carImportForm button[type="submit"]').click();
  await expect(page.locator('#carImportResults')).toBeVisible();
  await expect(page.getByText('Pakua PDF', { exact: true })).toBeVisible();
  await expect(page.getByText('Pakua CSV', { exact: true })).toBeVisible();
  expect(evidence.inputNetwork.length).toBeGreaterThan(0);
  expect(evidence.inputNetwork.every((url) => /^http:\/\/127\.0\.0\.1:4198\/data\/(?:trade\/car-import-cost-|forex\/latest\.json)/.test(url))).toBe(true);
  expect(evidence.errors).toEqual([]);
});

test('lane denominator remains exact and missing routes remain fail-closed', async () => {
  expect(assigned).toHaveLength(55);
  expect(assigned.filter((row) => row.categoryKey === 'engineering')).toHaveLength(20);
  expect(assigned.filter((row) => row.categoryKey === 'energy')).toHaveLength(17);
  expect(assigned.filter((row) => row.categoryKey === 'transport')).toHaveLength(18);
  expect(assigned.filter((row) => !row.primarySwahiliRoute).map((row) => row.englishId)).toEqual(['solar-calculator', 'car-price-intelligence']);
  for (const row of assigned.filter((item) => item.primarySwahiliFile)) expect(fs.existsSync(row.primarySwahiliFile)).toBe(true);
});
