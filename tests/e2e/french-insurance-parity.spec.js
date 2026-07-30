'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const CONTRACT = require('../../data/insurance/assumption-contract.json');

test.describe.configure({ mode: 'serial' });

async function expectNoOverflow(page) {
  const report = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const main = document.querySelector('main');
    return {
      viewport,
      main: main ? main.scrollWidth : 0,
      offenders: [...main.querySelectorAll('*')].filter((element) => {
        const box = element.getBoundingClientRect();
        return box.right > viewport + 1 || box.left < -1;
      }).slice(0, 6).map((element) => ({
        tag: element.tagName,
        className: String(element.className || ''),
        text: String(element.textContent || '').trim().slice(0, 60)
      }))
    };
  });
  expect(report.main, JSON.stringify(report.offenders, null, 2)).toBe(report.viewport);
}

async function fillFixture(page, mode, input) {
  if (mode === 'warning') {
    for (let index = 0; index < input.checked; index += 1) {
      await page.locator('input[type=checkbox]').nth(index).check();
    }
    return;
  }
  for (const [name, value] of Object.entries(input)) {
    await page.locator(`[name="${name}"]`).fill(String(value));
  }
}

test('French Insurance hub owns exactly 16 routes and works at 320px, dark system mode and 200% text', async ({ page }) => {
  const writes = [];
  const errors = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 840 });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/fr/insurance/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-insurance-app]')).toHaveCount(16);
  await page.getByRole('button', { name: 'Afficher le parcours' }).click();
  await expect(page.getByRole('status').last()).toContainText('Choisissez');
  await expect(page.locator('#fr-insurance-need')).toBeFocused();
  await page.locator('#fr-insurance-need').selectOption('claim-tracker');
  await page.getByRole('button', { name: 'Afficher le parcours' }).click();
  await expect(page.locator('#fr-insurance-title')).toContainText('sinistre');
  await expect(page.locator('#fr-insurance-link')).toHaveAttribute('href', '/fr/tools/suivi-sinistre-assurance/');
  await page.setViewportSize({ width: 375, height: 840 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expectNoOverflow(page);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

for (const [index, app] of CONTRACT.apps.entries()) {
  test(`${index + 1}/16 ${app.id} runs the shared oracle, handles invalid state and reopens its local export`, async ({ page }) => {
    const fixture = CONTRACT.oracleFixtures[app.mode];
    const writes = [];
    const errors = [];
    page.on('request', (request) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.setViewportSize({ width: index % 2 === 0 ? 320 : 375, height: 840 });
    await page.emulateMedia({
      colorScheme: index % 3 === 0 ? 'dark' : 'light',
      reducedMotion: 'reduce'
    });
    await page.goto(app.frenchRoute, { waitUntil: 'domcontentloaded' });
    if (index % 3 === 1) {
      await page.evaluate(() => {
        document.documentElement.dataset.theme = 'dark';
        document.documentElement.dataset.themeChoice = 'manual';
      });
    } else if (index % 3 === 2) {
      await page.evaluate(() => {
        document.documentElement.dataset.theme = 'light';
        document.documentElement.dataset.themeChoice = 'manual';
      });
    }

    const root = page.locator('[data-insurance-workflow]');
    await expect(root).toHaveAttribute('data-app-id', app.id);
    await expect(root).toHaveAttribute('data-mode', app.mode);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('form input, form select').first()).toHaveAccessibleName(/.+/);

    const submit = page.getByRole('button', {
      name: app.mode === 'warning' ? 'Examiner les signaux' : 'Calculer avec mes données'
    });
    if (app.mode !== 'warning') {
      await submit.click();
      await expect(page.locator('[data-result]')).toHaveText('');
    }

    await fillFixture(page, app.mode, fixture.input);
    await submit.focus();
    await expect(submit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-result]')).not.toHaveText('');
    await expect(page.locator('[data-result]')).toBeFocused();

    const downloadPromise = page.waitForEvent('download');
    const downloadButton = page.locator('[data-export="json"]');
    await downloadButton.focus();
    await page.keyboard.press('Enter');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`${app.id}-fr.json`);
    const exported = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    expect(exported.schemaVersion).toBe(1);
    expect(exported.appId).toBe(app.id);
    expect(exported.mode).toBe(app.mode);
    expect(exported.result.ok).toBe(true);
    for (const [key, expected] of Object.entries(fixture.expected)) {
      expect(exported.result[key]).toBe(expected);
    }
    expect(exported.boundary).toContain('aucun devis');

    await page.evaluate(() => { window.__insurancePrinted = false; window.print = () => { window.__insurancePrinted = true; }; });
    const printButton = page.locator('[data-export="pdf"]');
    await printButton.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => window.__insurancePrinted)).toBe(true);

    const resetButton = page.locator('[data-action="reset"]');
    await resetButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-result]')).toHaveText('');
    await expect(page.locator('[data-export="json"]')).toBeDisabled();
    await expect(page.locator('form input, form select').first()).toBeFocused();

    await page.setViewportSize({ width: 375, height: 840 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expectNoOverflow(page);
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });
}
