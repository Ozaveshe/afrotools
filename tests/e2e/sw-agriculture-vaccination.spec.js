const fs = require('node:fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');

const ROUTE = '/sw/zana/ratiba-ya-chanjo/';

function watchRuntime(page) {
  const errors = [];
  const writes = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console:${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
  page.on('request', request => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      writes.push(`${request.method()} ${request.url()}`);
    }
  });
  return { errors, writes };
}

async function downloadBuffer(page, action) {
  const pending = page.waitForEvent('download');
  await page.locator(`[data-action="${action}"]`).click();
  const download = await pending;
  return {
    filename: download.suggestedFilename(),
    buffer: fs.readFileSync(await download.path())
  };
}

async function calculateKenya(page) {
  await page.locator('#country').selectOption('KE');
  await page.locator('#animalType').selectOption('cattle');
  await page.locator('#herdSize').fill('25');
  await page.locator('#currentMonth').selectOption('3');
  await page.locator('#ageGroup').selectOption('mixed');
  const submit = page.getByRole('button', { name: 'Tengeneza ratiba' });
  await submit.focus();
  await expect(submit).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#resultPanel')).toBeVisible();
}

test('native Swahili vaccination workflow calculates locally with route-correct metadata', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });

  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://afrotools.com${ROUTE}`
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    'href',
    'https://afrotools.com/agriculture/vaccination-schedule/'
  );
  await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute(
    'href',
    `https://afrotools.com${ROUTE}`
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `https://afrotools.com${ROUTE}`
  );
  await expect(page.locator('.hero-art')).toHaveAttribute(
    'src',
    '/assets/img/tools/vaccination-schedule.webp'
  );
  const schema = await page.locator('script[type="application/ld+json"]').first()
    .evaluate(node => JSON.parse(node.textContent));
  expect(schema.inLanguage).toBe('sw');

  const controls = page.locator('input:not([type="hidden"]), select');
  for (let index = 0; index < await controls.count(); index += 1) {
    const id = await controls.nth(index).getAttribute('id');
    await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
  }

  await calculateKenya(page);
  const proof = await page.evaluate(() => ({
    report: window.__SW_AGRI_TEST__.reportObject(),
    result: window.__SW_AGRI_TEST__.latest,
    engineCalculate: typeof window.__SW_AGRI_TEST__.engine.calculate,
    engineValidation: typeof window.__SW_AGRI_TEST__.engine.validateInput
  }));
  expect(proof.engineCalculate).toBe('function');
  expect(proof.engineValidation).toBe('function');
  expect(proof.report.language).toBe('sw');
  expect(proof.report.country.code).toBe('KE');
  expect(proof.result.herdSize).toBe(25);
  expect(proof.result.schedule.length).toBeGreaterThan(0);
  expect(proof.result.costs.totalAnnual).toBeGreaterThan(0);
  expect(runtime.writes).toEqual([]);
  expect(runtime.errors).toEqual([]);
});

test('Swahili vaccination exports reopen as JSON, TXT, CSV and parsed PDF', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
  await calculateKenya(page);

  const json = await downloadBuffer(page, 'json');
  expect(json.filename).toMatch(/\.json$/i);
  const parsedJson = JSON.parse(json.buffer.toString('utf8'));
  expect(parsedJson.language).toBe('sw');
  expect(parsedJson.country.code).toBe('KE');
  expect(parsedJson.result.schedule.length).toBeGreaterThan(0);

  const text = await downloadBuffer(page, 'txt');
  expect(text.filename).toMatch(/\.txt$/i);
  expect(text.buffer.toString('utf8')).toContain('Ratiba elekezi ya chanjo');
  expect(text.buffer.toString('utf8')).toContain('Faragha: hesabu ya ndani');

  const csv = await downloadBuffer(page, 'csv');
  expect(csv.filename).toMatch(/\.csv$/i);
  expect(csv.buffer.toString('utf8')).toContain('ugonjwa');
  expect(csv.buffer.toString('utf8')).toContain('gharama_ya_mwaka');

  const pdf = await downloadBuffer(page, 'pdf');
  expect(pdf.filename).toMatch(/\.pdf$/i);
  expect(pdf.buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
  const parsedPdf = await pdfParse(pdf.buffer);
  expect(parsedPdf.text).toContain('Ratiba elekezi ya chanjo');
  expect(parsedPdf.text).toContain('Faragha: hesabu ya ndani');

  await page.locator('[data-action="save"]').click();
  const saved = JSON.parse(await page.evaluate(() => (
    localStorage.getItem('afrotools:sw-agriculture:vaccination')
  )));
  expect(saved.country.code).toBe('KE');
  expect(runtime.writes).toEqual([]);
  expect(runtime.errors).toEqual([]);
});

for (const width of [320, 375]) {
  test(`Swahili vaccination remains usable at ${width}px, 200% text and dark mode`, async ({ page }) => {
    const runtime = watchRuntime(page);
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
    await page.locator('#themeToggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await calculateKenya(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    ))).toBe(true);
    await expect(page.locator('#scheduleMobile')).toBeVisible();

    await page.getByRole('button', { name: 'Weka upya' }).click();
    await page.locator('#herdSize').fill('0');
    await page.getByRole('button', { name: 'Tengeneza ratiba' }).click();
    await expect(page.getByRole('alert')).toContainText('idadi halali');
    await expect(page.locator('#herdSize')).toBeFocused();
    await expect(page.locator('#resultPanel')).toBeHidden();
    expect(runtime.writes).toEqual([]);
    expect(runtime.errors).toEqual([]);
  });
}
