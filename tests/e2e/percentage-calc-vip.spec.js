const { test, expect } = require('@playwright/test');

const route = '/tools/percentage-calc/';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('#r1')).toHaveText('100');
});

test('all six workflows calculate and validate their real boundaries', async ({ page }) => {
  await page.getByRole('tab', { name: 'X is what %?' }).click();
  await page.locator('#p2_y').fill('0');
  await expect(page.locator('#mode-2 .mode-error')).toContainText('cannot be zero');
  await expect(page.locator('#mode-2 [data-copy-mode="2"]')).toBeDisabled();

  await page.getByRole('tab', { name: '% Change' }).click();
  await page.locator('#p3_orig').fill('-100');
  await page.locator('#p3_new').fill('-50');
  await expect(page.locator('#r3')).toHaveText('+50%');
  await page.locator('#p3_orig').fill('0');
  await expect(page.locator('#mode-3 .mode-error')).toContainText('undefined');

  await page.getByRole('tab', { name: 'Discount' }).click();
  await page.locator('#p4_disc').fill('101');
  await expect(page.locator('#mode-4 .mode-error')).toContainText('between 0% and 100%');

  await page.getByRole('tab', { name: 'Tip Split' }).click();
  await page.locator('#p5_split').fill('4');
  await expect(page.locator('#r5_per')).toHaveText('1,375');

  await page.getByRole('tab', { name: 'Margin' }).click();
  await page.locator('#p6_cost').fill('0');
  await expect(page.locator('#r6_markup')).toHaveText('Not defined');
  await page.locator('#p6_sell').fill('0');
  await expect(page.locator('#mode-6 .mode-error')).toContainText('greater than zero');
});

test('tabs support keyboard navigation and every input has a visible linked label', async ({ page }) => {
  const first = page.getByRole('tab', { name: 'X% of Y' });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'X is what %?' })).toBeFocused();
  await expect(page.locator('#mode-2')).toBeVisible();

  const inputs = page.locator('.mode-content input');
  for (let index = 0; index < await inputs.count(); index += 1) {
    const id = await inputs.nth(index).getAttribute('id');
    await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    expect(await page.locator(`label[for="${id}"]`).textContent()).not.toBe('');
  }
});

test('copy and TXT export contain a bounded summary while values are never stored or posted', async ({ page }) => {
  const writes = [];
  page.on('request', request => {
    if (request.method() !== 'GET') writes.push({ url: request.url(), body: request.postData() || '' });
  });

  await page.evaluate(() => {
    window.__copiedText = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: text => { window.__copiedText = text; return Promise.resolve(); } }
    });
  });
  await page.locator('[data-copy-mode="1"]').click();
  const copied = await page.evaluate(() => window.__copiedText);
  expect(copied).toContain('20% of 500 = 100');
  expect(copied).toContain('values stay in this browser');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-download-mode="1"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('percentage-calculation.txt');

  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage)
  }));
  expect(storage.local.filter(key => /pct|percent/i.test(key))).toEqual([]);
  expect(storage.session.filter(key => /pct|percent/i.test(key))).toEqual([]);
  expect(writes.some(write => /20% of 500|percentage-calculation/i.test(write.body))).toBe(false);
});

test('print action opens the browser print boundary', async ({ page }) => {
  await page.evaluate(() => {
    window.__printed = false;
    window.print = () => { window.__printed = true; };
  });
  await page.locator('[data-print-mode="1"]').click();
  await expect.poll(() => page.evaluate(() => window.__printed)).toBe(true);
  await expect(page.locator('#percentageStatus')).toContainText('Save as PDF');
});

test('print stylesheet produces a non-empty PDF with the active calculation', async ({ page }) => {
  await page.evaluate(() => { document.body.dataset.printMode = '1'; });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#mode-1')).toBeVisible();
  await expect(page.locator('#mode-2')).toBeHidden();
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.byteLength).toBeGreaterThan(10_000);
});

for (const width of [320, 360]) {
  test(`mobile ${width}px has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.getByRole('tab', { name: 'Margin' })).toBeVisible();
  });
}

test('dark mode and 200% text equivalent remain usable at 375 CSS px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(route);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.fontSize = '32px';
  });
  await page.getByRole('tab', { name: 'Tip Split' }).click();
  await expect(page.locator('#p5_bill')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const cardBackground = await page.locator('.card').first().evaluate(el => getComputedStyle(el).backgroundColor);
  expect(['rgb(17, 24, 39)', 'rgb(18, 31, 51)']).toContain(cardBackground);
});

test('inherits canonical self-hosted DM Sans without a page-local Google font or Chart.js', async ({ page }) => {
  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  const source = await page.locator('head').innerHTML();
  expect(source).not.toMatch(/fonts\.googleapis\.com/i);
  expect(resources.some(url => /assets\/fonts\/dm-sans/i.test(url))).toBe(true);
  expect(resources.some(url => /fonts\.googleapis|fonts\.gstatic/i.test(url))).toBe(false);
  expect(resources.some(url => url.includes('chart.js'))).toBe(false);
  const family = await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily);
  expect(family).toContain('DM Sans');
});

test('interactive surface has stable names and no app runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.reload();
  const controls = page.locator('.card button, .card input');
  for (let index = 0; index < await controls.count(); index += 1) {
    const name = await controls.nth(index).evaluate(element =>
      element.labels?.[0]?.textContent ||
      element.getAttribute('aria-label') ||
      element.textContent
    );
    expect(String(name || '').trim()).not.toBe('');
  }
  expect(errors).toEqual([]);
});
