const { test, expect } = require('@playwright/test');
const fs = require('fs');

async function assertLayout(page) {
  await page.setViewportSize({ width: 320, height: 780 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('h1')).toBeVisible();
}

async function downloadText(page, format) {
  const pending = page.waitForEvent('download');
  await page.locator(`[data-export="${format}"]`).click();
  const download = await pending;
  return fs.readFileSync(await download.path(), 'utf8');
}

test('stock media uses the shared engine and reopens JSON and CSV', async ({ page }) => {
  await page.goto('/sw/zana/maktaba-ya-stock-media/');
  await expect(page.locator('#sourceUrl')).toBeVisible();
  await page.locator('#query').fill('Picha ya soko la Nairobi');
  await page.locator('#calculate').click();
  const json = JSON.parse(await downloadText(page, 'json'));
  expect(json.title).toBe('Picha ya soko la Nairobi');
  expect(json.sourceUrl).toMatch(/^https:/);
  const csv = await downloadText(page, 'csv');
  expect(csv).toContain('source_url');
  expect(csv).toContain('Picha ya soko la Nairobi');
  await assertLayout(page);
});

test('thumbnail uses the shared format oracle and exports real PNG dimensions', async ({ page }) => {
  await page.goto('/sw/zana/thumbnail-ya-mtayarishi/');
  await page.locator('#platform').selectOption('youtube');
  await page.locator('#calculate').click();
  expect(await page.locator('#canvas').evaluate((canvas) => [canvas.width, canvas.height])).toEqual([1280, 720]);
  const json = JSON.parse(await downloadText(page, 'json'));
  expect([json.width, json.height]).toEqual([1280, 720]);
  const pending = page.waitForEvent('download');
  await page.locator('[data-export="png"]').click();
  const png = fs.readFileSync(await (await pending).path());
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(1280);
  expect(png.readUInt32BE(20)).toBe(720);
  await assertLayout(page);
});

test('title generator returns native Swahili and reopenable exports', async ({ page }) => {
  await page.goto('/sw/zana/vichwa-vya-maudhui/');
  await page.locator('#topic').fill('biashara ndogo');
  await page.locator('#calculate').click();
  const json = JSON.parse(await downloadText(page, 'json'));
  expect(json.language).toBe('sw');
  expect(json.titles).toHaveLength(8);
  expect(JSON.stringify(json)).toContain('Jinsi ya');
  expect(await downloadText(page, 'txt')).toContain('biashara ndogo');
  await assertLayout(page);
});

test('calendar uses shared date scheduling and reopens JSON and CSV', async ({ page }) => {
  await page.goto('/sw/zana/kalenda-ya-mitandao-ya-kijamii/');
  await page.locator('#startMonth').selectOption('1');
  await page.locator('#calculate').click();
  const json = JSON.parse(await downloadText(page, 'json'));
  expect(json.month).toBe(1);
  expect(json.totalPosts).toBeGreaterThan(0);
  const csv = await downloadText(page, 'csv');
  expect(csv).toContain('date,time,type');
  expect(csv.trim().split(/\r?\n/).length).toBe(json.totalPosts + 1);
  await assertLayout(page);
});
