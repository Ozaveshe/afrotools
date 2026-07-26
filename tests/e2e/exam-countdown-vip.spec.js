const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/tools/exam-countdown/');
});

test('source card prefill does not save or add without confirmation', async ({ page }) => {
  await page.getByRole('button', { name: /UNEB late registration deadline/ }).click();
  await expect(page.locator('#customName')).toHaveValue('UNEB late registration deadline');
  await expect(page.locator('#customDate')).toHaveValue('2026-07-31');
  await expect(page.locator('[data-countdown-id]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('afro_exam_countdowns'))).toBeNull();
});

test('adds a private session countdown and exports without network writes', async ({ page }) => {
  const writes = [];
  page.on('request', request => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
  });
  await page.locator('#customName').fill('Biology Paper 1');
  await page.locator('#customDate').fill('2026-11-10');
  await page.getByRole('button', { name: 'Add countdown' }).click();
  await expect(page.getByText('Biology Paper 1').first()).toBeVisible();
  await expect(page.getByText(/calendar days/).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('afro_exam_countdowns'))).toBeNull();
  await page.getByRole('button', { name: 'Copy plan' }).click();
  await expect(page.getByText('Plan copied.')).toBeVisible();
  expect(writes.join('\n')).not.toContain('Biology');
  expect(writes.join('\n')).not.toContain('2026-11-10');
});

test('explicit remember, route-only share, and print controls work', async ({ page }) => {
  await page.getByLabel(/Remember on this device/).check();
  await page.locator('#customName').fill('Mathematics');
  await page.locator('#customDate').fill('2026-12-01');
  await page.getByRole('button', { name: 'Add countdown' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('afro_exam_countdowns')).length)).toBe(1);

  await page.evaluate(() => {
    window.__shared = null;
    navigator.share = payload => {
      window.__shared = payload;
      return Promise.resolve();
    };
  });
  await page.getByRole('button', { name: 'Share tool only' }).click();
  const payload = await page.evaluate(() => window.__shared);
  expect(payload.text).not.toContain('Mathematics');
  expect(payload.text).not.toContain('2026-12-01');

  await page.evaluate(() => {
    window.__printed = false;
    window.print = () => { window.__printed = true; };
  });
  await page.getByRole('button', { name: 'Print / save PDF' }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
});
