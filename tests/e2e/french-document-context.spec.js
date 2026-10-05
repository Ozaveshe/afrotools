const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const pdfParse = require('pdf-parse');

test.use({ trace: 'off' });

async function prepare(page) {
  const errors = [];
  page.on('pageerror', () => errors.push('pageerror'));
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue();
    return route.fulfill({ status: 204, body: '' });
  });
  return errors;
}

async function download(page, locator) {
  const pending = page.waitForEvent('download');
  await locator.click();
  return fs.readFileSync(await (await pending).path());
}

async function reflow(page) {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
}

test('French invoice currency, review, preview and exports retain literal synthetic values', async ({ page }) => {
  test.setTimeout(120000);
  const errors = await prepare(page);
  await page.goto('/fr/tools/generateur-factures/');
  await expect(page.locator('#currency option[value=GHS]')).toHaveText('GHS - Ghana');
  await expect(page.locator('#currency option[value=SDG]')).toHaveText('SDG - Soudan');
  await expect(page.getByText('Lignes de facture', { exact: true }).first()).toBeVisible();
  await expect(page.locator('#btnAddItem')).toHaveAccessibleName(/ligne/);
  await page.locator('#companyName').fill('Global Compact');
  await page.locator('#clientName').fill('Revenue');
  await page.locator('.li-desc').first().fill('Line Items');
  await page.locator('.li-price').first().fill('10');
  for (const detail of await page.locator('#taxType').locator('xpath=ancestor::details').all()) await detail.locator('summary').first().click();
  await page.locator('#taxType').selectOption('vat');
  await page.locator('#taxRate').fill('9');
  for (const currency of ['GHS', 'SDG']) {
    await page.locator('#currency').selectOption(currency);
    await expect(page.locator('#taxRate')).toHaveValue('9');
  }
  await expect(page.locator('#pCompany')).toHaveText('Global Compact');
  await expect(page.locator('#pClient')).toHaveText('Revenue');
  await expect(page.locator('#pItems')).toContainText('Line Items');
  await reflow(page);
  await page.locator('details.action-more summary').click();
  await page.locator('#invoiceReviewConfirm').check();
  const data = JSON.parse((await download(page, page.locator('#btnExportJson'))).toString('utf8'));
  expect(data).toMatchObject({ cn: 'Global Compact', cl: 'Revenue', cu: 'SDG' });
  expect(data.items[0].d).toBe('Line Items');
  const pdf = await pdfParse(await download(page, page.locator('#btnPDF')));
  for (const expected of ['Global Compact', 'Revenue', 'Line Items', 'FACTURE']) expect(pdf.text).toContain(expected);
  expect(errors).toEqual([]);
});

test('French CV template selection, editor, backup and ATS export preserve user text', async ({ page }) => {
  test.setTimeout(120000);
  const errors = await prepare(page);
  await page.goto('/fr/tools/generateur-cv/');
  await page.waitForFunction(() => window.CVApp && window.CVExportUpgrade && window.CVTemplateRegistry);
  const landing = page.locator('.cv-template-landing-grid');
  await expect(landing.locator('[data-template-card]')).toHaveCount(30);
  await expect(landing.locator('[data-template-card="global-compact"] h4')).toHaveText('Compact international');
  await expect(landing).not.toContainText(/Best for|Use template|Preview full size|Pacte mondial|sécurisé ATS/);
  const preview = landing.locator('[data-template-preview="global-compact"]');
  await preview.click();
  await expect(page.getByRole('dialog', { name: 'Compact international' })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Compatibilité ATS');
  await page.keyboard.press('Escape');
  await expect(preview).toBeFocused();
  await preview.press('Enter');
  await page.getByRole('dialog').getByRole('button', { name: 'Utiliser ce modèle', exact: true }).click();
  expect(await page.evaluate(() => window.CVApp.getState().template)).toBe('global-compact');
  await page.evaluate(() => {
    const state = window.CVApp.getState();
    state.country = 'GH';
    Object.assign(state.data, {
      fn: 'Global Compact', ln: 'Test', title: 'Revenue', email: 'fixture@example.test', phone: '0000000000', loc: 'Accra',
      summary: 'Revenue\nYear 1',
      edus: [{ deg: 'Formation test', sch: 'École test', y1: '2020', y2: '2023' }],
      exps: [{ t: 'Poste test', c: 'Entreprise test', s: '2024-01', cur: true, d: 'Mission test.' }]
    });
    window.CVApp.renderAll();
  });
  const firstName = page.locator('[data-path="fn"]').first();
  await expect(firstName).toHaveAccessibleName(/Prénom/);
  await firstName.fill('Élodie Global Compact');
  await expect(page.locator('#cvpreview')).toContainText('Élodie Global Compact');
  await expect(page.locator('#cvpreview')).toContainText('Revenue');
  await expect.poll(() => page.evaluate(() => window.CVApp.getState().data.fn)).toBe('Élodie Global Compact');
  await reflow(page);
  await page.evaluate(() => window.CVBuilderPolish.openExportPanel());
  await page.locator('.cv-export-drawer-shell [data-cv-export-review]').check();
  const text = (await download(page, page.locator('.cv-export-drawer-shell [data-cv-export="text"]'))).toString('utf8');
  expect(text).toContain('Élodie Global Compact');
  expect(text).toContain('Revenue');
  expect(text).toContain('Year 1');
  expect(text).toMatch(/profil/i);
  expect(text).toMatch(/expérience professionnelle/i);
  const data = JSON.parse((await download(page, page.locator('.cv-export-drawer-shell [data-cv-export="json"]'))).toString('utf8'));
  expect(JSON.stringify(data)).toContain('Élodie Global Compact');
  expect(JSON.stringify(data)).toContain('Revenue');
  await page.keyboard.press('Escape');
  await page.locator('[data-tracker-current]').click();
  const csv = (await download(page, page.locator('[data-tracker-export]'))).toString('utf8');
  expect(csv.split(/\r?\n/)[0]).toContain('poste,entreprise,pays');
  expect(csv).toContain('Revenue');
  expect(csv).toContain('Élodie Global Compact Test');
  expect(await page.evaluate(() => window.CVApp.getState().country)).toBe('GH');
  expect(errors).toEqual([]);
});
