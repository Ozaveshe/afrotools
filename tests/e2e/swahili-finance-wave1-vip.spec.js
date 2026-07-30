'use strict';

const { test, expect } = require('@playwright/test');

async function preparePage(page, route, width = 375) {
  const pageErrors = [];
  const consoleErrors = [];
  const mutationRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) mutationRequests.push({
      method: request.method(),
      url: request.url()
    });
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location();
    const thirdPartyResourceAbort = message.text() === 'Failed to load resource: net::ERR_FAILED'
      && location.url
      && !location.url.startsWith('http://127.0.0.1:');
    if (!thirdPartyResourceAbort) consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('lang', /^sw(?:-|$)/i);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/afrotools\.com\/assets\/img\//);
  const firstWorkflowControl = page.locator('.tl-body input, .tl-body select, .tl-body button, .tool-main input, .tool-main select, .tool-main button').first();
  await expect(firstWorkflowControl).toBeVisible();
  await firstWorkflowControl.focus();
  await expect(firstWorkflowControl).toBeFocused();
  return { pageErrors, consoleErrors, mutationRequests };
}

async function expectMobileReflow(page, route) {
  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
  expect(overflow, `${route} must not overflow its mobile viewport`).toBeLessThanOrEqual(1);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const lightOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ));
  expect(lightOverflow, `${route} must remain reflow-safe in light mode`).toBeLessThanOrEqual(1);
}

async function expectNoRuntimeErrors(errors) {
  expect(errors.pageErrors).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
  expect(errors.mutationRequests).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  for (const pattern of [
    'https://www.googletagmanager.com/**',
    'https://www.google-analytics.com/**',
    'https://fonts.googleapis.com/**',
    'https://fonts.gstatic.com/**'
  ]) {
    await page.route(pattern, (route) => route.abort());
  }
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
});

test('minimum wage: country reference, compliance result, and CSV stay useful in Swahili', async ({ page }) => {
  const route = '/sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/';
  const errors = await preparePage(page, route, 320);

  await page.getByLabel('NCHI', { exact: true }).selectOption('KE');
  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#results')).toContainText(/KES|Kenya/);

  const compliance = page.getByRole('button', { name: /Hakiki kama mshahara/i });
  await compliance.click();
  await expect(compliance).toHaveAttribute('aria-expanded', 'true');
  await page.getByLabel('Mshahara wa mwezi kabla ya makato').fill('20000');
  await page.getByRole('button', { name: 'Hakiki', exact: true }).click();
  await expect(page.locator('#compliance-result')).toBeVisible();
  await expect(page.locator('#compliance-result')).not.toBeEmpty();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Hamisha nchi zote kama CSV/i }).click();
  const download = await downloadPromise;
  expect(await download.suggestedFilename()).toMatch(/\.csv$/i);
  await expectMobileReflow(page, route);
  await expectNoRuntimeErrors(errors);
});

test('overtime: Kenya holiday hours produce cash overtime and total pay', async ({ page }) => {
  const route = '/sw/zana/kikokotoo-muda-wa-ziada/';
  const errors = await preparePage(page, route, 375);

  await page.getByLabel('NCHI', { exact: true }).selectOption('KE');
  await page.getByLabel('Kiasi cha mshahara wa mwezi').fill('100000');
  await page.locator('#ot-hours').fill('10');
  await page.locator('#day-type').selectOption('holiday');
  await page.getByRole('button', { name: /Kokotoa Malipo ya Muda wa Ziada/i }).click();

  await expect(page.locator('#results')).toBeVisible();
  await expect(page.locator('#r-ot-pay')).not.toHaveText(/^(?:-|0|KES 0)$/);
  await expect(page.locator('#r-total-pay')).not.toHaveText(/^(?:-|0|KES 0)$/);
  await expectMobileReflow(page, route);
  await expectNoRuntimeErrors(errors);
});

test('leave: country rights and accrued leave are both functional', async ({ page }) => {
  const route = '/sw/zana/kikokotoo-likizo/';
  const errors = await preparePage(page, route, 320);

  await page.getByLabel('NCHI').first().selectOption('KE');
  await expect(page.locator('#lc-results')).toBeVisible();
  await expect(page.locator('#r-total-days')).not.toHaveText(/^(?:-|—|\s*)$/);

  const accrualTab = page.getByRole('tab', { name: /Siku ulizopata/i });
  await accrualTab.evaluate((element) => element.scrollIntoView({ block: 'nearest', inline: 'center' }));
  await accrualTab.click();
  await page.locator('#ac-country').selectOption('KE');
  await page.locator('#ac-start').fill('2026-01-01');
  await page.locator('#ac-today').fill('2026-07-01');
  await page.locator('#ac-entitlement').fill('21');
  await expect(page.locator('#ac-result')).toBeVisible();
  await expect(page.locator('#ac-result')).not.toBeEmpty();
  await expectMobileReflow(page, route);
  await expectNoRuntimeErrors(errors);
});

test('social security: Kenya contributions return employee, employer, and net values', async ({ page }) => {
  const route = '/sw/zana/kikokotoo-michango-ya-hifadhi-ya-jamii/';
  const errors = await preparePage(page, route, 375);

  await page.getByLabel('NCHI', { exact: true }).selectOption('KE');
  await page.getByLabel('MSHAHARA GHAFI WA MWEZI').fill('100000');
  await page.getByRole('button', { name: /Kokotoa michango/i }).click();
  await expect(page.locator('#results')).toBeVisible();
  for (const selector of ['#r-employee-total', '#r-employer-total', '#r-total-contribution', '#r-net-salary']) {
    await expect(page.locator(selector)).not.toHaveText(/^(?:-|—|0|KES 0|\s*)$/);
  }
  await expectMobileReflow(page, route);
  await expectNoRuntimeErrors(errors);
});

test('Kenya PAYE: calculation and direct local PDF path require no email', async ({ page }) => {
  const route = '/sw/kenya/kikokotoo-kodi-mshahara/';
  const errors = await preparePage(page, route, 320);

  await page.locator('#salaryInput').fill('100000');
  await page.getByRole('button', { name: /Kokotoa Mshahara/i }).click();
  await expect(page.locator('#resAmount')).not.toHaveText('KES 0');
  await expect(page.locator('#pdfModal, #leadForm, #pdfEmail')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Pakua PDF/i })).toHaveAttribute('data-no-gate', 'true');

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /Pakua PDF/i }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup.locator('body')).toContainText(/Kodi ya Mshahara|Mshahara Halisi/);
  await popup.close();

  await expectMobileReflow(page, route);
  await expectNoRuntimeErrors(errors);
});
