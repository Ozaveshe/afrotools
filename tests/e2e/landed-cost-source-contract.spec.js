const fs = require('fs');
const { test, expect } = require('@playwright/test');

test('landed-cost requires current inputs and exports the selected-country sources', async ({ page, context }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/landed-cost/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('spinbutton', { name: 'Duty Rate (%)', exact: true })).toHaveValue('');
  await expect(page.getByLabel('Sea Freight (USD)')).toHaveValue('');
  await expect(page.getByLabel('Insurance (USD)')).toHaveValue('');
  await expect(page.getByLabel('Exchange Rate (1 USD =)')).toHaveValue('');
  await expect(page.getByLabel('Customs Broker Quote (local)')).toHaveValue('');
  await expect(page.getByLabel('Port / Terminal Quote (local)')).toHaveValue('');
  await expect(page.locator('#fxHint')).toContainText('Bundled March 2026 reference');

  await page.getByRole('button', { name: 'Calculate Landed Cost' }).click();
  await expect(page.locator('#landedCostStatus')).toContainText('Enter current FOB, freight, insurance, HS-specific duty, and FX values');

  await page.getByLabel('Sea Freight (USD)').fill('2000');
  await page.getByLabel('Insurance (USD)').fill('100');
  await page.getByRole('spinbutton', { name: 'Duty Rate (%)', exact: true }).fill('20');
  await page.getByLabel('Exchange Rate (1 USD =)').fill('1500');
  await page.getByLabel('Customs Broker Quote (local)').fill('0');
  await page.getByLabel('Port / Terminal Quote (local)').fill('0');
  await page.getByRole('button', { name: 'Calculate Landed Cost' }).click();
  await expect(page.locator('#calcResults')).toHaveClass(/on/);

  await page.getByRole('button', { name: 'Copy landed-cost brief' }).first().click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Tariff source: https://trade.gov.ng/en/tools/tariff-search');
  expect(copied).toContain('Port authority source: https://nigerianports.gov.ng/port-tariffs/1000/');
  expect(copied).toContain('HS reference: https://www.wcotradetools.org/');

  const csvPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const csvDownload = await csvPending;
  expect(csvDownload.suggestedFilename()).toBe('afrotools-landed-cost-estimate.csv');
  const csv = fs.readFileSync(await csvDownload.path(), 'utf8');
  expect(csv).toContain('"source_reviewed_at","2026-08-13"');
  expect(csv).toContain('"tariff_source_url","https://trade.gov.ng/en/tools/tariff-search"');
  expect(csv).toContain('"port_authority_source_url","https://nigerianports.gov.ng/port-tariffs/1000/"');
  expect(csv).toContain('"hs_reference_url","https://www.wcotradetools.org/"');
  expect(pageErrors).toEqual([]);
});

test('transport hub exposes the monitored landed-cost workflow with aligned counts', async ({ page }) => {
  await page.goto('/transport/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.trp-tool-card')).toHaveCount(24);
  await expect(page.locator('.trp-tool-card[href="/tools/landed-cost/"]')).toHaveAttribute('href', '/tools/landed-cost/');
  const itemList = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => {
    return nodes.map(node => JSON.parse(node.textContent)).find(item => item['@type'] === 'ItemList');
  });
  expect(itemList.numberOfItems).toBe(24);
  expect(itemList.itemListElement).toHaveLength(24);
  expect(itemList.itemListElement[23].url).toBe('https://afrotools.com/tools/landed-cost/');
});
