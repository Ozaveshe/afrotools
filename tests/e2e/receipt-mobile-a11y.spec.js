const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const pdfjs = require('../../assets/vendor/pdfjs/pdf.min.js');

pdfjs.GlobalWorkerOptions.workerSrc = path.resolve(__dirname, '../../assets/vendor/pdfjs/pdf.worker.min.js');

test('guest receipt stays readable and exports locally with keyboard review', async ({ page }) => {
  const marker = 'SYNTHETIC-RECEIPT-A11Y';
  const leakedRequests = [];
  const errors = [];
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  page.on('request', request => {
    if ((request.url() + (request.postData() || '')).includes(marker)) leakedRequests.push(request.resourceType());
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/tools/receipt-generator/');
  await page.locator('#businessName').fill(marker);
  await page.locator('#receiptNumber').fill('SYNTHETIC-001');
  await page.locator('#receiptDate').fill('2026-09-12');
  await page.locator('[data-item-field="desc"]').first().fill('Synthetic service');
  await page.locator('[data-item-field="qty"]').first().fill('2');
  await page.locator('[data-item-field="rate"]').first().fill('100');
  await page.locator('#taxRate').fill('0');
  await page.locator('#paymentMethod').selectOption({ label: 'Cash' });

  await page.locator('#downloadPdfBtn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#receiptReviewConfirm')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('#receiptReviewConfirm')).toBeChecked();
  await expect(page.locator('#receiptQr')).toHaveAttribute('role', 'img');
  await expect(page.locator('#receiptQr img')).toHaveAttribute('alt', '');
  await expect(page.locator('.r-watermark')).toHaveAttribute('aria-hidden', 'true');

  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    // The translucent watermark repeats the visible payment status; it is decoration.
    const violations = await page.evaluate(async () => (await axe.run({
      include: ['main'], exclude: ['.r-watermark']
    }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations
      .map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })));
    expect(violations, `${theme} main content`).toEqual([]);
  }
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#downloadPdfBtn').focus();
  await page.keyboard.press('Enter');
  const download = await downloadEvent;
  const bytes = fs.readFileSync(await download.path());
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
  expect(pdf.numPages).toBeGreaterThan(0);
  const operators = await (await pdf.getPage(1)).getOperatorList();
  expect(operators.fnArray).toContain(pdfjs.OPS.paintImageXObject);
  await pdf.destroy();

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    for (const id of ['downloadPdfBtn', 'printBtn', 'txtBtn', 'jsonBtn']) {
      const box = await page.locator('#' + id).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
  expect(leakedRequests).toEqual([]);
  expect(errors).toEqual([]);
});
