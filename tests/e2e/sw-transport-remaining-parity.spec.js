const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const apps = [
  ['ride-fare', '/sw/zana/nauli-za-ride-hailing/'],
  ['boda-income', '/sw/zana/mapato-ya-boda-boda/'],
  ['matatu-fare', '/sw/zana/nauli-za-matatu-danfo-trotro/'],
  ['delivery-cost', '/sw/zana/gharama-ya-delivery/'],
  ['car-loan-vs-cash', '/sw/zana/mkopo-wa-gari-dhidi-ya-fedha-taslimu/'],
  ['vehicle-registration', '/sw/zana/usajili-na-nyaraka-za-gari/'],
  ['roadworthiness', '/sw/zana/ukaguzi-wa-roadworthiness/'],
  ['vehicle-depreciation', '/sw/zana/kushuka-thamani-ya-gari/'],
  ['last-mile-delivery', '/sw/zana/gharama-last-mile-delivery/'],
  ['parking-fee', '/sw/zana/ada-za-maegesho/'],
  ['route-cost', '/sw/zana/gharama-njia-za-logistics/'],
  ['toll-calc', '/sw/zana/ada-za-toll/'],
  ['vehicle-tracker-roi', '/sw/zana/faida-ya-tracker-ya-gari/']
];

function observe(page) {
  const evidence = { errors: [], egress: [] };
  page.on('pageerror', (error) => evidence.errors.push(`pageerror:${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource: net::ERR_FAILED/.test(message.text())) {
      evidence.errors.push(`console:${message.text()}`);
    }
  });
  page.on('request', (request) => {
    const body = request.postData() || '';
    if (/SW_PRIVATE_MARKER/.test(body) || /987654321/.test(body)) evidence.egress.push(request.url());
  });
  return evidence;
}

async function assertReflow(page, width, scale) {
  await page.setViewportSize({ width, height: 900 });
  await page.evaluate((fontSize) => { document.documentElement.style.fontSize = fontSize; }, scale);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

for (const [id, route] of apps) {
  test(`${id}: calculates locally and passes mobile, reflow, theme, keyboard and metadata checks`, async ({ page }) => {
    const evidence = observe(page);
    await page.route(/^https?:\/\/(?!127\.0\.0\.1:43821)/, (request) => request.abort());
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', /^sw(?:-|$)/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://afrotools.com${route}`);
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', `https://afrotools.com/tools/${id}/`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://afrotools.com/assets/img/tools/${id}.webp`);
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('[download], [data-export]')).toHaveCount(0);

    const calculate = page.locator('button[onclick^="swtCalc"]').first();
    await calculate.focus();
    await expect(calculate).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#swt-results')).toHaveClass(/on/);
    await expect(page.locator('#swt-primary')).not.toHaveText(/NaN|Infinity/);
    await expect(page.locator('[role="status"]')).toContainText('kifaa hiki');

    const privateField = page.locator('input[type="number"]').first();
    await privateField.fill('987654321');
    await calculate.click();
    await expect(page.locator('#swt-results')).toHaveClass(/on/);
    expect(evidence.egress).toEqual([]);

    await page.locator('[data-sw-transport-reset]').click();
    await calculate.click();
    await expect(page.locator('#swt-results')).not.toHaveClass(/on/);
    await expect(page.locator('[role="status"]')).not.toHaveText('');

    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await assertReflow(page, 320, '100%');
    await assertReflow(page, 375, '100%');
    await assertReflow(page, 640, '200%');
    expect(evidence.errors).toEqual([]);
  });
}

test('car-import-cost: maintained engine calculates and PDF/CSV exports reopen', async ({ page }) => {
  const evidence = observe(page);
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:43821)/, (request) => request.abort());
  await page.goto('/sw/zana/gharama-kuagiza-gari/');
  await expect(page.locator('#carImportForm')).toBeVisible();
  await page.locator('#carImportForm button[type="submit"]').click();
  await expect(page.locator('#carImportResults')).toBeVisible();
  await expect(page.locator('#carImportTotal')).not.toHaveText(/NaN|Infinity|USD 0/);

  const [csvDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#carImportCsv').click()
  ]);
  const csv = fs.readFileSync(await csvDownload.path(), 'utf8');
  expect(csv).toContain('section');
  expect(csv).toContain('on-road');
  expect(csv.trim().split(/\r?\n/).length).toBeGreaterThan(5);

  const [pdfDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#carImportPdf').click()
  ]);
  const pdfPath = await pdfDownload.path();
  const pdf = fs.readFileSync(pdfPath);
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  const parsed = JSON.parse(execFileSync(process.execPath, [path.resolve(__dirname, '../support/parse-pdf-download.js'), pdfPath], { encoding: 'utf8' }));
  expect(parsed.numpages).toBeGreaterThan(0);

  await page.locator('#carImportYear').fill('-1');
  await page.locator('#carImportForm').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await expect(page.locator('#carImportResults')).toBeHidden();
  await expect(page.locator('#swCarImportError')).toContainText('batili');
  await assertReflow(page, 320, '100%');
  await assertReflow(page, 375, '100%');
  await assertReflow(page, 640, '200%');
  expect(evidence.egress).toEqual([]);
  expect(evidence.errors).toEqual([]);
});
