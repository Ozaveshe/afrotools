'use strict';

const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const pdfParse = require('pdf-parse');
const contracts = require('../../data/registry/swahili-legal-remaining-parity.json').rows;

function pathWithSlash(route) {
  return `${String(route).replace(/\/$/, '')}/`;
}

async function download(page, selector) {
  const promise = page.waitForEvent('download');
  await page.locator(selector).click();
  return promise;
}

async function applyMutationFixture(page, values) {
  return page.locator('[data-workflow-form]').evaluate((form, mutation) => {
    for (const [name, value] of Object.entries(mutation || {})) {
      const control = form.elements[name];
      if (!control) return false;
      if (control.type === 'checkbox') control.checked = Boolean(value);
      else control.value = String(value);
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }, values);
}

test.beforeEach(async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(baseURL)) return route.continue();
    if (/^https?:/i.test(url)) return route.abort();
    return route.continue();
  });
});

test.describe.configure({ mode: 'serial' });

for (const [index, contract] of contracts.entries()) {
  test(`${index + 1}/51 ${contract.englishId}: native workflow, boundaries, all exports and reflow`, async ({ page, baseURL }) => {
    const errors = { page: [], console: [], local: [], mutations: [], external: [] };
    page.on('pageerror', (error) => errors.page.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !/ERR_FAILED/.test(message.text())) errors.console.push(message.text());
    });
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) errors.mutations.push(`${request.method()} ${request.url()}`);
      if (/^https?:/i.test(request.url()) && !request.url().startsWith(baseURL)) errors.external.push(request.url());
    });
    page.on('requestfailed', (request) => {
      if (request.url().startsWith(baseURL)) errors.local.push(request.url());
    });
    page.on('response', (response) => {
      if (response.url().startsWith(baseURL) && response.status() >= 400) errors.local.push(`${response.status()} ${response.url()}`);
    });

    await page.setViewportSize({ width: index % 2 ? 320 : 375, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto(pathWithSlash(contract.swahiliRoute), { waitUntil: 'load' });
    await expect(page.locator('[data-sw-legal-property-app]')).toHaveAttribute('data-workflow-ready', 'true');
    await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://afrotools.com${pathWithSlash(contract.swahiliRoute)}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://afrotools.com${pathWithSlash(contract.swahiliRoute)}`);
    await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveCount(1);
    await expect(page.locator('link[rel=alternate][hreflang=fr]')).toHaveCount(1);
    await expect(page.locator('link[rel=alternate][hreflang=sw]')).toHaveCount(1);
    await expect(page.locator('iframe')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    const unlabeled = await page.locator('[data-workflow-form] input:not([type=hidden]), [data-workflow-form] select, [data-workflow-form] textarea').evaluateAll((nodes) => nodes.filter((node) => !node.labels || node.labels.length === 0).map((node) => node.name || node.type));
    expect(unlabeled).toEqual([]);
    const firstControl = page.locator('[data-workflow-form] input, [data-workflow-form] select').first();
    await firstControl.focus();
    await expect(firstControl).toBeFocused();

    await page.addScriptTag({ path: require.resolve('axe-core') });
    const violations = await page.evaluate(async () => (await axe.run(document.querySelector('main'), {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
    })).violations.filter((violation) => ['critical', 'serious'].includes(violation.impact)));
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);

    const invalidControl = page.locator('[data-workflow-form] input[required]:not([type=checkbox]), [data-workflow-form] select[required]').first();
    if (await invalidControl.count()) {
      await invalidControl.evaluate((node) => {
        node.value = '';
        node.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.locator('[data-workflow-form] button[type=submit]').click();
      await expect(page.locator('[data-result]')).toBeHidden();
      await expect(page.locator('[data-status]')).toContainText('Jaza kila sehemu');
      await page.reload({ waitUntil: 'load' });
      await expect(page.locator('[data-sw-legal-property-app]')).toHaveAttribute('data-workflow-ready', 'true');
    }

    await page.locator('[data-workflow-form] button[type=submit]').click();
    await expect(page.locator('[data-result]')).toBeVisible();
    const firstResult = await page.locator('[data-result]').innerText();
    expect(firstResult.length).toBeGreaterThan(30);
    expect(await applyMutationFixture(page, contract.mutationFixture)).toBe(true);
    await page.locator('[data-workflow-form] button[type=submit]').click();
    await expect(page.locator('[data-result]')).toBeVisible();
    expect(await page.locator('[data-result]').innerText()).not.toBe(firstResult);

    const json = await download(page, '[data-action=json]');
    const jsonPath = await json.path();
    const payload = JSON.parse(await fs.promises.readFile(jsonPath, 'utf8'));
    expect(payload.lugha).toBe('sw');
    expect(payload.englishId).toBe(contract.englishId);
    expect(payload.inputs).toBeTruthy();
    expect(payload.result).toBeTruthy();
    await page.locator('[data-import-json]').setInputFiles(jsonPath);
    await expect(page.locator('[data-status]')).toContainText('JSON imefunguliwa tena');
    await expect(page.locator('[data-result]')).toBeVisible();

    const txt = await download(page, '[data-action=txt]');
    const txtBody = await fs.promises.readFile(await txt.path(), 'utf8');
    expect(txtBody).toContain(`Njia: ${pathWithSlash(contract.swahiliRoute)}`);
    expect(txtBody).toContain('si ushauri wa kisheria');

    const pdf = await download(page, '[data-action=pdf]');
    const parsedPdf = await pdfParse(await fs.promises.readFile(await pdf.path()));
    expect(parsedPdf.text).toContain(contract.name);
    expect(parsedPdf.text).toContain('si ushauri wa kisheria');

    await page.locator('[data-action=copy]').click();
    await expect(page.locator('[data-status]')).toContainText('umenakiliwa');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(contract.name);
    await page.evaluate(() => { window.__swPrintCalled = false; window.print = () => { window.__swPrintCalled = true; }; });
    await page.locator('[data-action=print]').click();
    expect(await page.evaluate(() => window.__swPrintCalled)).toBe(true);

    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await expect(page.locator('[data-workflow-form] button[type=submit]')).toBeVisible();

    expect(errors.page).toEqual([]);
    expect(errors.console).toEqual([]);
    expect(errors.local).toEqual([]);
    expect(errors.mutations).toEqual([]);
    expect(errors.external).toEqual([]);
  });
}

test('hub is separate and links all 51 accepted-app candidates', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/sw/biashara-na-uzingatiaji/', { waitUntil: 'load' });
  for (const contract of contracts) {
    await expect(page.locator(`a[href="${contract.swahiliRoute}"]`).first()).toBeVisible();
  }
  const overflow = await page.evaluate(() => ({
    delta: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    offenders: Array.from(document.querySelectorAll('body *')).map((node) => {
      const rect = node.getBoundingClientRect();
      return { tag: node.tagName, id: node.id, className: String(node.className || ''), left: rect.left, right: rect.right, width: rect.width };
    }).filter((item) => item.left < -1 || item.right > innerWidth + 1).sort((a, b) => b.right - a.right).slice(0, 8)
  }));
  expect(overflow.delta, JSON.stringify(overflow.offenders, null, 2)).toBeLessThanOrEqual(1);
});
