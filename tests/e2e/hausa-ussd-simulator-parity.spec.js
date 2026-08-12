const { test, expect } = require('@playwright/test');

const route = '/ha/kayan-aiki/gwajin-ussd/';

test('Hausa USSD simulator runs a complete local session and exports parsed JSON', async ({ page }) => {
  const writes = [];
  page.on('request', request => { if (request.method() !== 'GET' && request.method() !== 'HEAD') writes.push(request.url()); });
  await page.goto(route);
  await expect(page.locator('[data-preset]')).toHaveCount(4);
  await expect(page.locator('#ussd-screen')).toContainText('Tura kuɗi');

  await page.locator('#ussd-input').fill('9');
  await page.locator('#ussd-send').click();
  await expect(page.locator('#ussd-screen')).toContainText('Zaɓi bai dace ba');
  await expect(page.locator('#ussd-stats')).toContainText('start');

  await page.locator('#ussd-input').fill('1'); await page.locator('#ussd-send').click();
  await expect(page.locator('#ussd-screen')).toContainText('lambar wayar gwaji');
  await page.locator('#ussd-input').fill('07000000000'); await page.locator('#ussd-send').click();
  await page.locator('#ussd-input').fill('2500'); await page.locator('#ussd-send').click();
  await expect(page.locator('#ussd-screen')).toContainText('KSh 2500');
  await expect(page.locator('#ussd-screen')).toContainText('Zaman gwaji ya ƙare');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#ussd-export').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('gwajin-ussd-hausa.json');
  const payload = JSON.parse(await require('fs').promises.readFile(await download.path(), 'utf8'));
  expect(payload).toMatchObject({ tool: 'ussd-simulator', language: 'ha', localOnly: true, liveDial: false, transaction: false, ended: true });
  expect(payload.variables).toEqual({ phone: '07000000000', amount: '2500' });
  expect(writes).toEqual([]);
});

test('custom flow validates fail-closed and page reflows at mobile and 200 percent', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(route);
  await page.locator('#ussd-flow').fill('{bad'); await page.locator('#ussd-load').click();
  await expect(page.locator('#ussd-status')).toContainText('JSON bai inganta ba');
  await page.locator('#ussd-flow').fill(JSON.stringify({ start: { text: 'Gwaji\n1. Gaba', options: { '1': 'done' } }, done: { text: 'An gama', end: true } }));
  await page.locator('#ussd-code').fill('*555#'); await page.locator('#ussd-load').click();
  await expect(page.locator('#ussd-screen')).toContainText('Gwaji');
  await page.locator('#ussd-input').fill('1'); await page.locator('#ussd-send').click();
  await expect(page.locator('#ussd-screen')).toContainText('An gama');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = '2'; });
  const overflow200 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow200).toBeLessThanOrEqual(1);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('afro-navbar')).toBeVisible();
});
