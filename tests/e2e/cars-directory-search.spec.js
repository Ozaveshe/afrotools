const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

function csvRows(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(value); value = ''; }
    else if (c === '\n' && !quoted) { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
    else value += c;
  }
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

test('car directory accepts shopper punctuation and compact model spelling without dropping other filters', async ({ page }, testInfo) => {
  await page.goto('/cars/');
  const search = page.locator('#carsFilterForm input[name="q"]');
  for (const query of ['g wagon', 'G-Wagon', '  gwagon  ', 'G–Wagon']) {
    await search.fill(query);
    await search.press('Enter');
    await expect(page.locator('.cars-browse-card h3')).toHaveText(['2022 Mercedes-Benz G-Wagon']);
  }
  await page.locator('#carsFilterForm select[name="make"]').selectOption('toyota');
  await page.getByRole('button', { name: 'Compare cars', exact: true }).click();
  await expect(page.locator('.cars-empty-state')).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  for (const query of ['mercedes benz', 'Mércédès Bénz']) {
    await search.fill(query);
    await search.press('Enter');
    await expect(page.locator('.cars-browse-card')).toHaveCount(3);
  }
  for (const query of ['汽车', 'سيارة', '!!!', 'no such synthetic vehicle']) {
    await search.fill(query);
    await search.press('Enter');
    await expect(page.locator('.cars-empty-state')).toBeVisible();
  }
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.locator('.cars-browse-card')).toHaveCount(12);
  await expect(page.locator('.cars-source-block')).not.toContainText('admin price-pack upload flow');
  await page.locator('#carsFilterForm').screenshot({ path: testInfo.outputPath('directory-filters.png') });
});

test('unsourced car profile and CSV do not imply observed local demand or confidence', async ({ page }, testInfo) => {
  await page.goto('/cars/nigeria/mercedes-benz/g-wagon/2022/');
  await expect(page.locator('#carsReport h1')).toHaveText('2022 Mercedes-Benz G-Wagon in Nigeria');
  await expect(page.locator('.cars-layer-grid')).toContainText('No sourced sample');
  const resale = page.locator('.cars-score-card').filter({ hasText: 'Resale band' });
  await expect(resale).toContainText('Modelled resale score');
  await expect(resale).toContainText('not evidence of active local demand');
  await expect(resale).not.toContainText('enough samples');
  const confidence = page.locator('.cars-score-card').filter({ hasText: 'Source confidence' });
  await expect(confidence).toContainText('local not-observed');
  await expect(confidence).toContainText('local No sourced sample');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const download = await pending;
  const csvPath = testInfo.outputPath('unsourced-car-summary.csv');
  await download.saveAs(csvPath);
  const rows = csvRows(fs.readFileSync(csvPath, 'utf8'));
  expect(rows).toHaveLength(2);
  const entry = Object.fromEntries(rows[0].map((key, i) => [key, rows[1][i]]));
  expect(entry.local_ask_median_local).toBe('');
  expect(entry.local_confidence).toBe('not-observed');
  expect(entry.local_price_kind).toBe('not-observed');
  expect(entry.local_price_date).toBe('');
  expect(entry.source_price_date).toMatch(/^\d{4}-\d{2}-\d{2}/);
  expect(entry.fx_date).toMatch(/^\d{4}-\d{2}-\d{2}/);
  expect(entry.scenario_note).toMatch(/Older budget data|Planning estimate/);
  expect(Number(entry.landed_normal_local)).toBeGreaterThan(0);
  await expect(page.locator('#carsReport a[href*="/tools/car-import-cost/"]')).not.toHaveCount(0);
  await page.locator('.cars-score-grid').screenshot({ path: testInfo.outputPath('unsourced-score-grid.png') });
});
