const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const { PDFDocument, StandardFonts } = require('../../assets/vendor/pdf-lib/pdf-lib.min.js');

test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
  await page.setViewportSize({ width: 320, height: 844 });
});

async function contained(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
}

for (const theme of ['light', 'dark']) {
  test(`French Atlas comparison remains readable and exportable at 320px ${theme}`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem('aft_theme', theme), theme);
    await page.goto('/fr/tools/afroatlas/');
    await expect(page.locator('#ua-countryA option')).toHaveCount(54);
    await page.getByRole('button', { name: 'Comparer les pays', exact: true }).click();
    await expect(page.locator('[data-ua-result]')).toBeVisible();
    await expect(page.locator('[data-ua-table]')).toContainText('Nigeria');
    await expect(page.locator('[data-ua-table]')).toContainText('Ghana');
    await contained(page);
    const pending = page.waitForEvent('download');
    await page.locator('[data-ua-export="json"]').click();
    const payload = JSON.parse(fs.readFileSync(await (await pending).path(), 'utf8'));
    expect(JSON.stringify(payload)).toContain('nigeria');
    expect(JSON.stringify(payload)).toContain('ghana');
  });
}

test('Cover Letter local save and restore survive delayed script loading', async ({ page, baseURL }) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/cover-letter-generator.js')) await new Promise((resolve) => setTimeout(resolve, 1500));
    return route.continue();
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/tools/cover-letter-generator/app.html');
  await page.waitForFunction(() => document.querySelector('#templateId').options.length > 2);
  await page.locator('#fullName').fill('Synthetic Fixture');
  await page.locator('#tab-job').click();
  await page.locator('#jobTitle').fill('Test Role');
  await page.locator('#company').fill('Example Company');
  await page.locator('#tab-draft').click();
  await page.locator('#letterText').fill('Synthetic local recovery draft.');
  await page.locator('[data-action="save"]').click();
  await page.reload();
  await expect(page.locator('#fullName')).toHaveValue('Synthetic Fixture');
  await expect(page.locator('#letterText')).toHaveValue('Synthetic local recovery draft.');
  await contained(page);
});

test('Payroll device setup survives delayed country-pack loading without an account', async ({ page, baseURL }) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.fulfill({ status: 204 });
    if (url.pathname === '/data/hr/afropayroll-country-packs.js') await new Promise((resolve) => setTimeout(resolve, 1500));
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    return route.continue();
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/tools/afropayroll-os/workspace.html');
  await page.locator('#companyName').fill('Synthetic Local Company');
  await page.locator('#saveSetupBtn').click();
  await expect(page.locator('#setupStatus')).toContainText(/Saved on this device|ready/i);
  await page.reload();
  await expect(page.locator('#companyName')).toHaveValue('Synthetic Local Company');
  await expect(page.locator('#saveStatusAccountText')).toContainText(/Sign in to Pro|stay on this device/i);
  await contained(page);
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(`Kitchen discovery with JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled });
    test('secondary directories disclose all links and retain fragment navigation', async ({ page }) => {
      await page.goto('/tools/afrokitchen/');
      const countries = page.locator('#country-grid');
      const collections = page.locator('#collections-grid');
      await expect(countries).not.toBeVisible();
      await expect(collections).not.toBeVisible();
      expect(await countries.locator('a').count()).toBeGreaterThanOrEqual(54);
      expect(await collections.locator('a').count()).toBeGreaterThanOrEqual(16);
      await page.locator('.ak-directory-disclosure summary').first().press('Enter');
      await expect(countries).toBeVisible();
      await contained(page);
      await page.locator('.ak-directory-disclosure summary').last().press('Space');
      await expect(collections).toBeVisible();
      await contained(page);
      await page.locator('.ak-directory-disclosure summary').first().press('Enter');
      await page.locator('.ak-hero-quick-actions a[href="#country-grid"]').click();
      await expect(countries).toBeVisible();
    });
  });
}

test('CV ATS dialog has a bounded keyboard flow after delayed loading', async ({ page }) => {
  await page.route('**/cv-ats-plain-mode.js*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/cv-builder/');
  await page.waitForFunction(() => window.CVExportUpgrade && window.CVExportUpgrade.__atsPlainModeReady);
  await page.evaluate(() => window.CVBuilderPolish.openExportPanel());
  const trigger = page.locator('.cv-export-drawer-shell [data-cv-export="ats"]');
  await trigger.click();
  await expect(page.locator('[data-export-ats-text]')).toBeFocused();
  await page.locator('[data-export-download-ats-pdf]').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-export-close]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('[data-export-download-ats-pdf]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.cv-export-modal-overlay.open')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'Export CV' })).toBeVisible();
  await contained(page);
});

test('PDF Workspace preserves a synthetic document through a delayed local export', async ({ page }) => {
  const marker = 'SYNTHETIC_PDF_LOCAL_PROOF';
  const leaks = [];
  page.on('request', (request) => {
    if (request.url().includes(marker) || (request.postData() || '').includes(marker)) leaks.push('network');
  });
  page.on('console', (message) => { if (message.text().includes(marker)) leaks.push('console'); });
  await page.route('**/assets/vendor/pdf-lib/*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/tools/pdf-workspace/');
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage([420, 594]).drawText(marker, { x: 30, y: 500, size: 12, font });
  await page.locator('#fileIn').setInputFiles({ name: 'synthetic-proof.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
  await expect(page.locator('#tbDL')).toBeVisible();
  await contained(page);
  await page.locator('#tbDL').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exDownload').click();
  const download = await downloadPromise;
  const bytes = fs.readFileSync(await download.path());
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(1);
  const text = await page.evaluate(async (values) => {
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(values) }).promise;
    return (await (await pdf.getPage(1)).getTextContent()).items.map((item) => item.str).join(' ');
  }, Array.from(bytes));
  expect(text).toContain(marker);
  expect(leaks).toEqual([]);
});
