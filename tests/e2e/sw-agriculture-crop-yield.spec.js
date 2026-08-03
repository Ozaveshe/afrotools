const fs = require('node:fs');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');
const manifest = require('../../data/localization/sw-agriculture-parity-manifest.json');

const ROWS = manifest.rows.filter(row => row.family === 'crop-yield');
const HUB = ROWS.find(row => !row.country);
const COUNTRIES = ROWS.filter(row => row.country);

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

async function bufferFromDownload(page, action) {
  const pending = page.waitForEvent('download');
  await page.locator(`[data-action="${action}"]`).click();
  const download = await pending;
  return {
    filename: download.suggestedFilename(),
    buffer: fs.readFileSync(await download.path())
  };
}

async function parsePdfSerially(value) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const parsed = await pdfParse(value);
      // pdf-parse 1.x does not await PDF.js document destruction internally.
      await new Promise(resolve => setTimeout(resolve, 75));
      return parsed;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
  throw lastError;
}

test('Crop Yield hub exposes all 54 reviewed country owners without overflow', async ({ page }) => {
  const runtime = watchRuntime(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(HUB.swahili.route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('.country-list a')).toHaveCount(54);
  expect(new Set(await page.locator('.country-list a').evaluateAll(links => (
    links.map(link => link.getAttribute('href'))
  ))).size).toBe(54);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://afrotools.com${HUB.swahili.route}`
  );
  await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true);
  expect(await page.locator('.hero-art').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  ))).toBe(true);
  expect(runtime.writes).toEqual([]);
  expect(runtime.errors).toEqual([]);
});

for (const [index, row] of COUNTRIES.entries()) {
  test(`${row.country.code} Crop Yield full native Swahili acceptance`, async ({ page }) => {
    const runtime = watchRuntime(page);
    const width = index % 2 === 0 ? 320 : 375;
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(row.swahili.route, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(row.country.swahiliName);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${row.swahili.route}`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${row.english.route}`
    );
    await expect(page.locator('link[rel="alternate"][hreflang="sw"]')).toHaveAttribute(
      'href',
      `https://afrotools.com${row.swahili.route}`
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `https://afrotools.com${row.swahili.route}`
    );
    const schema = await page.locator('script[type="application/ld+json"]').first()
      .evaluate(node => JSON.parse(node.textContent));
    expect(schema.inLanguage).toBe('sw');
    await expect(page.locator('.hero-art')).toHaveJSProperty('complete', true);
    expect(await page.locator('.hero-art').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);

    const controls = page.locator('input:not([type="hidden"]), select');
    for (let control = 0; control < await controls.count(); control += 1) {
      const id = await controls.nth(control).getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    const calculate = page.getByRole('button', { name: 'Kokotoa makisio' });
    await calculate.focus();
    await expect(calculate).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#resultPanel')).toBeVisible();
    const proof = await page.evaluate(() => ({
      report: window.__SW_AGRI_TEST__.reportObject(),
      result: window.__SW_AGRI_TEST__.latest.result,
      engine: typeof window.__SW_AGRI_TEST__.engine.calculate
    }));
    expect(proof.engine).toBe('function');
    expect(proof.report.language).toBe('sw');
    expect(proof.report.country.code).toBe(row.country.code);
    expect(proof.report.sources.live).toBe(false);
    expect(proof.result.estimatedYieldPerHa).toBeGreaterThan(0);
    expect(proof.result.totalEstimatedYield).toBeGreaterThan(0);
    expect(proof.result.revenueEstimate.mid).toBeGreaterThanOrEqual(0);

    const json = await bufferFromDownload(page, 'json');
    expect(json.filename).toMatch(new RegExp(`${row.country.code.toLowerCase()}\\.json$`));
    const parsedJson = JSON.parse(json.buffer.toString('utf8'));
    expect(parsedJson.country.code).toBe(row.country.code);
    expect(parsedJson.result.estimatedYieldPerHa).toBe(proof.result.estimatedYieldPerHa);

    const text = await bufferFromDownload(page, 'txt');
    expect(text.filename).toMatch(/\.txt$/);
    expect(text.buffer.toString('utf8')).toContain('Makisio ya mavuno');
    expect(text.buffer.toString('utf8')).toContain('Faragha: hesabu ya ndani');

    const csv = await bufferFromDownload(page, 'csv');
    expect(csv.filename).toMatch(/\.csv$/);
    expect(csv.buffer.toString('utf8')).toContain('mavuno_t_ha');
    expect(csv.buffer.toString('utf8')).toContain(row.country.code);

    const pdf = await bufferFromDownload(page, 'pdf');
    expect(pdf.filename).toMatch(/\.pdf$/);
    expect(pdf.buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    const parsedPdf = await parsePdfSerially(pdf.buffer);
    expect(parsedPdf.text).toContain('Makisio ya mavuno');
    expect(parsedPdf.text).toContain('Faragha: hesabu ya ndani');

    await page.locator('[data-action="save"]').click();
    const saved = JSON.parse(await page.evaluate(countryCode => (
      localStorage.getItem(`afrotools:sw-agriculture:crop-yield:${countryCode}`)
    ), row.country.code));
    expect(saved.country.code).toBe(row.country.code);

    await page.locator('#themeToggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#themeToggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    ))).toBe(true);
    await expect(page.locator('#cropRowsMobile')).toBeVisible();

    await page.getByRole('button', { name: 'Weka upya' }).click();
    await page.locator('#farmSize').fill('0');
    await page.getByRole('button', { name: 'Kokotoa makisio' }).click();
    await expect(page.getByRole('alert')).toContainText('hekta 0.1');
    await expect(page.locator('#farmSize')).toBeFocused();
    await expect(page.locator('#resultPanel')).toBeHidden();

    expect(runtime.writes).toEqual([]);
    expect(runtime.errors).toEqual([]);
  });
}
