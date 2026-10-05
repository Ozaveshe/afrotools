const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const pdfParse = require('pdf-parse');

async function reveal(page, id) {
  const control = page.locator('#' + id);
  for (const parent of await control.locator('xpath=ancestor::details').all()) {
    if (await parent.getAttribute('open') === null) await parent.locator('summary').first().click();
  }
  return control;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
});

test('Hausa document types survive saved states and export native PDFs without changing payment', async ({ page }) => {
  test.setTimeout(120000);
  const errors = [], leaks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if ((request.url() + (request.postData() || '')).includes('HA-MODE-PRIVATE')) leaks.push(request.url());
  });
  await page.goto('/ha/kayan-aiki/kirkiro-invoice/');
  await page.locator('#companyName').fill('Ƙungiyar Gwaji HA-MODE-PRIVATE');
  await page.locator('#clientName').fill('Ɗanladi Ƙwarai');
  await page.locator('.li-desc').first().fill('Aikin gwaji');
  await page.locator('.li-qty').first().fill('2');
  await page.locator('.li-price').first().fill('50');
  await (await reveal(page, 'taxType')).selectOption('none');
  await (await reveal(page, 'amountPaid')).fill('25');

  for (const [type, title, prefix] of [
    ['estimate', 'KIYASIN KUƊI', 'kiyasin-kudi-'],
    ['receipt', 'RESIT', 'resit-'],
    ['invoice', 'TAKARDAR KUƊI', 'takardar-kudi-']
  ]) {
    await page.locator('#invoiceReviewConfirm').check();
    await page.locator('#documentType').selectOption(type);
    await expect(page.locator('#invoiceReviewConfirm')).not.toBeChecked();
    await expect(page.locator('#amountPaid')).toHaveValue('25');
    await expect(page.locator('#markPaid')).not.toBeChecked();
    await expect(page.locator('#previewTplTitle')).toHaveText(title);
    await page.locator('.tpl-btn[data-tpl="creative"]').click();
    await expect(page.locator('#previewTplTitle')).toHaveText(title);
    await page.locator('#invoiceReviewConfirm').check();
    const pdfPending = page.waitForEvent('download');
    await page.locator('#btnPDF').click();
    const pdf = await pdfPending;
    expect(pdf.suggestedFilename()).toMatch(new RegExp('^' + prefix));
    const text = (await pdfParse(fs.readFileSync(await pdf.path()))).text;
    for (const expected of [title, 'Ɗanladi Ƙwarai', 'Aikin gwaji', 'NGN 75.00']) expect(text).toContain(expected);

    const jsonPending = page.waitForEvent('download');
    await (await reveal(page, 'btnExportJson')).click();
    const json = fs.readFileSync(await (await jsonPending).path());
    expect(JSON.parse(json)).toMatchObject({ dt: type, ap: '25', mp: '0' });
    await page.locator('#documentType').selectOption(type === 'invoice' ? 'receipt' : 'invoice');
    await page.locator('#importJsonInput').setInputFiles({ name: 'synthetic.json', mimeType: 'application/json', buffer: json });
    await expect(page.locator('#documentType')).toHaveValue(type);
    await expect(page.locator('#previewTplTitle')).toHaveText(title);
    await expect(page.locator('#invoiceReviewConfirm')).not.toBeChecked();
  }

  const client = 'Ɗanladi " <img data-client-probe>';
  await page.locator('#clientName').fill(client);
  await (await reveal(page, 'clientCompany')).fill('<b data-client-probe>Kamfani</b>');
  await (await reveal(page, 'btnSaveClient')).click();
  await expect(page.locator('#clientList .client-item-name').last()).toHaveText(client);
  await expect(page.locator('[data-client-probe]')).toHaveCount(0);
  await expect(page.locator('#clientList button').last()).toHaveAttribute('aria-label', 'Cire abokin ciniki ' + client);

  await page.locator('#documentType').selectOption('receipt');
  await page.locator('#btnSaveInvoice').click();
  await page.reload();
  await page.locator('#inv-saved-grid .invoice-saved-card').first().click();
  await expect(page.locator('#documentType')).toHaveValue('receipt');
  await expect(page.locator('#amountPaid')).toHaveValue('25');
  const saved = await page.evaluate(() => window.AfroInvoiceState.gatherState());
  for (const dt of [undefined, 'not-a-mode', '__proto__']) {
    await page.locator('#importJsonInput').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...saved, dt })) });
    await expect(page.locator('#documentType')).toHaveValue('invoice');
  }
  await page.locator('#documentType').selectOption('estimate');
  page.once('dialog', dialog => dialog.accept());
  await (await reveal(page, 'btnNewInvoice')).click();
  await expect(page.locator('#documentType')).toHaveValue('invoice');
  await expect(page.locator('#amountPaid')).toHaveValue('0');
  expect(errors).toEqual([]);
  expect(leaks).toEqual([]);
});

test('Hausa CV brief stays readable in light and dark mode at mobile widths', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/ha/kayan-aiki/gina-cv/');
  await page.getByRole('button', { name: 'Gina daftarin CV' }).click();
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width: 1280, height: 900 });
    if (await page.locator('html').getAttribute('data-theme') !== theme) {
      await page.locator('afro-navbar #themeToggle').click();
    }
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.locator('#name')).toBeVisible();
      const result = await page.evaluate(() => {
        const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = color => rgb(color).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((v, n, i) => v + n * [.2126, .7152, .0722][i], 0);
        const selectors = ['.ha-card-head h2', '.ha-field label', '#name', '#skills', '.ha-btn', '#cvResult', '#cvResult strong', '.ha-note'];
        return {
          width: document.documentElement.scrollWidth,
          contrasts: selectors.map(selector => {
            const element = document.querySelector(selector);
            const color = getComputedStyle(element).color;
            let current = element, background = 'rgba(0, 0, 0, 0)';
            while (current && (background === 'rgba(0, 0, 0, 0)' || background === 'transparent')) {
              background = getComputedStyle(current).backgroundColor;
              current = current.parentElement;
            }
            const a = luminance(color), b = luminance(background);
            return { selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
          })
        };
      });
      expect(result.width).toBeLessThanOrEqual(width);
      for (const item of result.contrasts) expect(item.ratio, `${theme} ${width}px ${item.selector}`).toBeGreaterThanOrEqual(4.5);
      await page.locator('#name').focus();
      await page.keyboard.press('Tab');
      await expect(page.locator('#role')).toBeFocused();
    }
    const output = path.resolve('output/playwright/ha-document-completion-2026-10-05');
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, `ha-cv-${theme}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});
